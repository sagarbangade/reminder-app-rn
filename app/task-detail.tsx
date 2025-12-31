/**
 * TaskDetailScreen - Screen for viewing task details using Expo Router
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from './_components/BottomTabs';
import { ConfirmDialog } from './_components/ConfirmDialog';
import { NotificationCalendar } from './_components/NotificationCalendar';
import { useTaskActions } from './_context/TaskContext';
import { Colors, Radii, Shadows } from './_styles/theme';
import { Task } from './_types/Task';
import { navigateToTaskForm } from './_utils/navigationHelpers';
import { cancelTaskNotifications, schedulePersistentFollowupsForOccurrence } from './_utils/scheduleUtils';
import { acknowledgeOccurrence, deletePersistentSchedule, getPersistentSchedule, isOccurrenceAcknowledged, unacknowledgeOccurrence } from './_utils/storageUtils';
import { showErrorToast, showSuccessToast, showToast } from './_utils/toastUtils';

/**
 * TaskDetailScreen displays full details of a task and allows editing/deletion
 */
export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const { deleteTask, fetchTaskById } = useTaskActions();
  const [activeTab, setActiveTab] = useState<'details' | 'upcoming'>('details');
  const [upcoming, setUpcoming] = useState<{ date: Date; key: string; label: string }[]>([]);
  const [ackMap, setAckMap] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  /**
   * Load task data
   */
  const loadTask = useCallback(async () => {
    try {
      if (taskId) {
        const loadedTask = await fetchTaskById(taskId);
        setTask(loadedTask);
      }
    } catch {
      showErrorToast('Failed to load task');
    }
  }, [taskId, fetchTaskById]);

  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId, loadTask]);

  const loadUpcoming = useCallback(async () => {
    if (!task) return;
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const items: { date: Date; key: string; label: string }[] = [];

    if (task.scheduleType === 'daily' || task.scheduleType === 'alternateDays') {
      // generate occurrences for next 24 hours based on timesInDay
      const daysToCheck = 2; // check today and tomorrow to cover a 24h window
      for (let d = 0; d < daysToCheck; d++) {
        const base = new Date();
        base.setDate(base.getDate() + d);
        base.setHours(0, 0, 0, 0);
        // for alternateDays, check cadence
        const isAlternate = task.scheduleType === 'alternateDays';
        for (const time of task.timesInDay) {
          const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
          const occ = new Date(base);
          occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
          if (occ >= now && occ <= end) {
            if (isAlternate) {
              // Use startDate if available, otherwise fall back to createdAt
              const baseDate = task.startDate || task.createdAt;
              const diffDays = Math.floor((occ.getTime() - new Date(baseDate).setHours(0,0,0,0)) / (24*60*60*1000));
              if (diffDays % Math.max(1, task.alternateInterval || 1) !== 0) continue;
            }
            items.push({ date: occ, key: occ.toISOString(), label: occ.toLocaleString() });
          }
        }
      }
    }

    if (task.scheduleType === 'customTimes') {
      if (task.customDateTimes && task.customDateTimes.length) {
        for (const dt of task.customDateTimes) {
          try {
            const d = new Date(dt);
            if (d >= new Date() && d <= end) items.push({ date: d, key: d.toISOString(), label: d.toLocaleString() });
          } catch {}
        }
      } else {
        // fall back to today's times
        for (const time of task.timesInDay) {
          const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
          const occ = new Date();
          occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
          if (occ >= new Date() && occ <= end) items.push({ date: occ, key: occ.toISOString(), label: occ.toLocaleString() });
        }
      }
    }

    items.sort((a, b) => a.date.getTime() - b.date.getTime());
    setUpcoming(items);

    // load acknowledged statuses
    const map: Record<string, boolean> = {};
    for (const it of items) {
      try {
        const ack = await isOccurrenceAcknowledged(task.id, it.key);
        map[it.key] = ack;
      } catch {
        map[it.key] = false;
      }
    }
    setAckMap(map);
  }, [task]);

  useEffect(() => {
    if (task) loadUpcoming();
  }, [task, loadUpcoming]);

  const handleAcknowledge = async (occKey: string) => {
    if (!task) return;
    try {
      const currentlyAcked = ackMap[occKey];
      if (currentlyAcked) {
        // user wants to uncheck -> unacknowledge and reschedule followups
        await unacknowledgeOccurrence(task.id, occKey);
        // reschedule persistent followups for this occurrence (if in future)
        try {
          await schedulePersistentFollowupsForOccurrence(task, occKey);
        } catch {
          showErrorToast('Failed to reschedule followups');
        }
        setAckMap((m) => ({ ...m, [occKey]: false }));
        try { await Haptics.selectionAsync(); } catch {}
        showToast('info', 'Reminder un-acked');
      } else {
        // acknowledge: cancel persistent followups and mark acknowledged
        const ids = await getPersistentSchedule(task.id, occKey);
        if (ids && ids.length) {
          await cancelTaskNotifications(ids);
          await deletePersistentSchedule(task.id, occKey);
        }
        await acknowledgeOccurrence(task.id, occKey);
        setAckMap((m) => ({ ...m, [occKey]: true }));
        try { await Haptics.selectionAsync(); } catch {}
        showToast('success', 'Reminder acknowledged');
      }
    } catch {
      showErrorToast('Failed to toggle acknowledgment');
    }
  };

  /**
   * Handle delete task
   */
  const handleDelete = async () => {
    if (!task) {
      showErrorToast('No task to delete');
      return;
    }
    
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!task) return;

    try {
      await deleteTask(task.id);
      try { await Haptics.selectionAsync(); } catch {}
      showSuccessToast('Task deleted successfully');
      router.back();
    } catch (e) {
      showErrorToast(`Failed to delete task: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  /**
   * Handle edit task
   */
  const handleEdit = () => {
    if (task?.id) {
      // Use any to bypass type checking for dynamic routes
      navigateToTaskForm(router, task.id);
    }
  };

  /**
   * Format schedule display
   */
  const formatScheduleDisplay = () => {
    if (!task) return '';

    switch (task.scheduleType) {
      case 'daily':
        return `Daily at ${task.timesInDay.join(', ')}`;
      case 'alternateDays':
        return `Every ${task.alternateInterval} days`;
      case 'customTimes':
        return `Custom: ${task.timesInDay.join(', ')}`;
      default:
        return '';
    }
  };

  if (!task) {
    return (
      <View style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Task Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: insets.bottom + 220 }}>
        {/* Tabs */}
        <View style={styles.tabRow}>
            <Pressable onPress={() => setActiveTab('details')} style={[styles.tabButton, activeTab === 'details' && styles.tabActivePill]}>
              <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>Details</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('upcoming')} style={[styles.tabButton, activeTab === 'upcoming' && styles.tabActivePill]}>
              <Text style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}>Upcoming 24h</Text>
            </Pressable>
        </View>

        {activeTab === 'details' && (
        <View>
        <View style={styles.section}>
          <Text style={styles.label}>Title</Text>
          <Text style={styles.value}>{task.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Details</Text>
          <Text style={styles.value}>{task.details || 'No details provided'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Schedule</Text>
          <Text style={styles.value}>{formatScheduleDisplay()}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Times</Text>
          {task.timesInDay.map((time, index) => (
            <Text key={index} style={styles.value}>
              • {time}
            </Text>
          ))}
        </View>

        {task.alternateInterval && (
          <View style={styles.section}>
            <Text style={styles.label}>Interval</Text>
            <Text style={styles.value}>{task.alternateInterval} days</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.label}>Created</Text>
          <Text style={styles.value}>
            {new Date(task.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {task && activeTab === 'details' && <NotificationCalendar task={task} />}
        </View>
        )}

        {activeTab === 'upcoming' && (
          <View style={styles.section}>
            <Text style={styles.label}>Upcoming reminders (24h)</Text>
            {upcoming.length === 0 ? (
              <Text style={styles.value}>No upcoming reminders in the next 24 hours.</Text>
            ) : (
              upcoming.map((it) => (
                <View key={it.key} style={styles.upcomingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.value}>{it.label}</Text>
                  </View>
                  <Pressable onPress={() => handleAcknowledge(it.key)} style={styles.ackButton}>
                    {ackMap[it.key] ? (
                      <MaterialCommunityIcons name="check-circle" size={28} color={Colors.success} />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={28} color={Colors.textMuted} />
                    )}
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Pressable
            style={[styles.button, styles.editButton]}
            onPress={handleEdit}
          >
            <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
            <Text style={styles.buttonText}>Edit</Text>
          </Pressable>

          <Pressable
            style={[styles.button, styles.deleteButton]}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            android_ripple={{ color: 'rgba(255,255,255,0.12)' }}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="trash-can" size={20} color="#fff" />
            <Text style={styles.buttonText}>Delete</Text>
          </Pressable>
        </View>
      </ScrollView>
      <BottomTabs />
      
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  goBackBtn: {
    marginRight: 8,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
    ...Shadows.sm,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: Colors.card,
    fontSize: 16,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: Colors.bgLight,
  },
  tabActive: {
    backgroundColor: '#7C3AED',
  },
  tabActivePill: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.lg,
    paddingVertical: 8,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.card,
  },
  upcomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  ackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
