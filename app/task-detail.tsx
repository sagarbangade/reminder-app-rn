/**
 * TaskDetailScreen - Screen for viewing task details using Expo Router
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from './_components/BottomTabs';
import { NotificationCalendar } from './_components/NotificationCalendar';
import { useTaskStorage } from './_hooks/useTaskStorage';
import { Colors, Radii } from './_styles/theme';
import { Task } from './_types/Task';
import { cancelTaskNotifications, schedulePersistentFollowupsForOccurrence } from './_utils/scheduleUtils';
import { acknowledgeOccurrence, deletePersistentSchedule, getPersistentSchedule, isOccurrenceAcknowledged, unacknowledgeOccurrence } from './_utils/storageUtils';
import { showToast } from './_utils/toastUtils';

/**
 * TaskDetailScreen displays full details of a task and allows editing/deletion
 */
export default function TaskDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const { deleteTask, fetchTaskById } = useTaskStorage();
  const [activeTab, setActiveTab] = useState<'details' | 'upcoming'>('details');
  const [upcoming, setUpcoming] = useState<{ date: Date; key: string; label: string }[]>([]);
  const [ackMap, setAckMap] = useState<Record<string, boolean>>({});

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
      Alert.alert('Error', 'Failed to load task');
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
              // check interval from createdAt
              const diffDays = Math.floor((occ.getTime() - new Date(task.createdAt).setHours(0,0,0,0)) / (24*60*60*1000));
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
        } catch (e) {
          console.error('Failed to reschedule followups on unack', e);
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
    } catch (e) {
      console.error('Failed acknowledge toggle', e);
    }
  };

  /**
   * Handle delete task
   */
  const handleDelete = async () => {
    if (!task) {
      Alert.alert('Error', 'No task to delete');
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to delete "${task.title}"?`);
    if (!confirmed) return;

    try {
      await deleteTask(task.id);
      try { await Haptics.selectionAsync(); } catch {}
      showToast('success', 'Task deleted');
      router.back();
    } catch (e) {
      Alert.alert('Error', `Failed to delete task: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  /**
   * Handle edit task
   */
  const handleEdit = () => {
    if (task?.id) {
      // Use any to bypass type checking for dynamic routes
      (router.push as any)(`/task-form?taskId=${task.id}`);
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#7C3AED" />
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
                      <MaterialCommunityIcons name="check-circle" size={28} color="#34C759" />
                    ) : (
                      <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={28} color="#999" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    color: '#666',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#000',
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
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabRow: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
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
    color: '#666',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
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
