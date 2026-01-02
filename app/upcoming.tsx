import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from './_components/BottomTabs';
import { Colors, Radii, Shadows } from './_styles/theme';
import { Task } from './_types/Task';
import { cancelTaskNotifications, schedulePersistentFollowupsForOccurrence } from './_utils/scheduleUtils';
import { acknowledgeOccurrence, deletePersistentSchedule, getAllTasks, getPersistentSchedule, isOccurrenceAcknowledged, unacknowledgeOccurrence } from './_utils/storageUtils';
import { showErrorToast, showToast } from './_utils/toastUtils';

export default function UpcomingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [occurrences, setOccurrences] = useState<{
    task: Task;
    date: Date;
    key: string;
    label: string;
    acknowledged: boolean;
  }[]>([]);
  
  // Active reminders = past reminders (within 6h) that haven't been acknowledged
  const [activeReminders, setActiveReminders] = useState<{
    task: Task;
    date: Date;
    key: string;
    label: string;
    acknowledged: boolean;
  }[]>([]);

  const loadUpcoming = useCallback(async () => {
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    // Look back 6 hours for active (missed) reminders
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const tasks = await getAllTasks();
    
    const upcomingOccs: typeof occurrences = [];
    const activeOccs: typeof occurrences = [];
    
    for (const task of tasks) {
      // daily/alternateDays
      if (task.scheduleType === 'daily' || task.scheduleType === 'alternateDays') {
        // Check today and yesterday for missed reminders, plus tomorrow for upcoming
        const daysToCheck = 3;
        for (let d = -1; d < daysToCheck; d++) {
          const base = new Date();
          base.setDate(base.getDate() + d);
          base.setHours(0, 0, 0, 0);
          const isAlternate = task.scheduleType === 'alternateDays';
          for (const time of task.timesInDay) {
            const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
            const occ = new Date(base);
            occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
            
            if (isAlternate) {
              const baseDate = task.startDate || task.createdAt;
              const diffDays = Math.floor((occ.getTime() - new Date(baseDate).setHours(0,0,0,0)) / (24*60*60*1000));
              if (diffDays % Math.max(1, task.alternateInterval || 1) !== 0) continue;
            }
            
            const key = occ.toISOString();
            const acknowledged = await isOccurrenceAcknowledged(task.id, key);
            
            // Future occurrence (upcoming)
            if (occ >= now && occ <= end) {
              upcomingOccs.push({ task, date: occ, key, label: occ.toLocaleString(), acknowledged });
            }
            // Past occurrence within 6 hours and NOT acknowledged (active/missed)
            else if (occ < now && occ >= sixHoursAgo && !acknowledged) {
              activeOccs.push({ task, date: occ, key, label: occ.toLocaleString(), acknowledged });
            }
          }
        }
      }
      // customTimes
      if (task.scheduleType === 'customTimes') {
        if (task.customDateTimes && task.customDateTimes.length) {
          for (const dt of task.customDateTimes) {
            try {
              const d = new Date(dt);
              const key = d.toISOString();
              const acknowledged = await isOccurrenceAcknowledged(task.id, key);
              
              if (d >= now && d <= end) {
                upcomingOccs.push({ task, date: d, key, label: d.toLocaleString(), acknowledged });
              } else if (d < now && d >= sixHoursAgo && !acknowledged) {
                activeOccs.push({ task, date: d, key, label: d.toLocaleString(), acknowledged });
              }
            } catch {}
          }
        } else {
          for (const time of task.timesInDay) {
            const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
            const occ = new Date();
            occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
            const key = occ.toISOString();
            const acknowledged = await isOccurrenceAcknowledged(task.id, key);
            
            if (occ >= now && occ <= end) {
              upcomingOccs.push({ task, date: occ, key, label: occ.toLocaleString(), acknowledged });
            } else if (occ < now && occ >= sixHoursAgo && !acknowledged) {
              activeOccs.push({ task, date: occ, key, label: occ.toLocaleString(), acknowledged });
            }
          }
        }
      }
    }
    
    upcomingOccs.sort((a, b) => a.date.getTime() - b.date.getTime());
    activeOccs.sort((a, b) => b.date.getTime() - a.date.getTime()); // Most recent first
    
    setOccurrences(upcomingOccs);
    setActiveReminders(activeOccs);
  }, []);

  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);

  const [showOnlyUnacked, setShowOnlyUnacked] = React.useState(false);

  const handleToggleAck = async (task: Task, occKey: string, currentlyAcked: boolean) => {
    try {
        if (currentlyAcked) {
        await unacknowledgeOccurrence(task.id, occKey);
        await schedulePersistentFollowupsForOccurrence(task, occKey);
        try { await Haptics.selectionAsync(); } catch {}
        showToast('info', 'Reminder un-acked');
      } else {
        const ids = await getPersistentSchedule(task.id, occKey);
        if (ids && ids.length) {
          await cancelTaskNotifications(ids);
          await deletePersistentSchedule(task.id, occKey);
        }
        await acknowledgeOccurrence(task.id, occKey);
        try { await Haptics.selectionAsync(); } catch {}
        showToast('success', 'Reminder acknowledged');
      }
      await loadUpcoming();
    } catch {
      showErrorToast('Failed to toggle acknowledge');
    }
  };

  const grouped = occurrences.reduce((acc, occ) => {
    if (!acc[occ.task.id]) acc[occ.task.id] = [];
    acc[occ.task.id].push(occ);
    return acc;
  }, {} as Record<string, typeof occurrences>);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar style="dark" />
      {/* Go Back button */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.goBackBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.header}>Upcoming Reminders (24h)</Text>
      </View>
      <ScrollView style={styles.scroll}>
        <View style={styles.filterRow}>
          <Pressable onPress={() => setShowOnlyUnacked(false)} style={[styles.filterBtn, !showOnlyUnacked && styles.filterActive]}>
            <Text style={[styles.filterText, !showOnlyUnacked && styles.filterTextActive]}>All</Text>
          </Pressable>
          <Pressable onPress={() => setShowOnlyUnacked(true)} style={[styles.filterBtn, showOnlyUnacked && styles.filterActive]}>
            <Text style={[styles.filterText, showOnlyUnacked && styles.filterTextActive]}>Unacknowledged</Text>
          </Pressable>
        </View>

        {/* Active/Missed Reminders Section */}
        {activeReminders.length > 0 && (
          <View style={styles.activeSection}>
            <View style={styles.activeSectionHeader}>
              <MaterialCommunityIcons name="bell-ring" size={20} color={Colors.warning} />
              <Text style={styles.activeSectionTitle}>Active Reminders</Text>
              <Text style={styles.activeSectionSubtitle}>
                ({activeReminders.length} - tap to stop notifications)
              </Text>
            </View>
            {activeReminders.map((occ) => (
              <View key={occ.key} style={styles.activeOccRow}>
                <View style={styles.activeOccInfo}>
                  <Text style={styles.activeTaskTitle}>{occ.task.title}</Text>
                  <Text style={styles.activeOccTime}>{occ.label}</Text>
                </View>
                <Pressable 
                  onPress={() => handleToggleAck(occ.task, occ.key, false)} 
                  style={styles.stopButton}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#fff" />
                  <Text style={styles.stopButtonText}>Done</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {/* Upcoming Reminders Section */}
        {Object.keys(grouped).length === 0 && activeReminders.length === 0 ? (
          <Text style={styles.empty}>No reminders due in the next 24 hours.</Text>
        ) : Object.keys(grouped).length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Upcoming (Next 24h)</Text>
            {Object.values(grouped).map((occs) => {
              const filtered = showOnlyUnacked ? occs.filter(o => !o.acknowledged) : occs;
              if (filtered.length === 0) return null;
              return (
                <View key={occs[0].task.id} style={styles.taskSection}>
                  <Text style={styles.taskTitle}>{occs[0].task.title}</Text>
                  {filtered.map((occ) => (
                    <View key={occ.key} style={styles.occRow}>
                      <Text style={styles.occLabel}>{occ.label}</Text>
                      <Pressable onPress={() => handleToggleAck(occ.task, occ.key, occ.acknowledged)} style={styles.ackButton}>
                        {occ.acknowledged ? (
                          <MaterialCommunityIcons name="check-circle" size={28} color={Colors.success} />
                        ) : (
                          <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={28} color={Colors.textMuted} />
                        )}
                      </Pressable>
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
      <BottomTabs />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
  },
  goBackBtn: {
    marginRight: 8,
    padding: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 100, // Extra padding for bottom tabs
  },
  empty: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  taskSection: {
    marginBottom: 28,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: 14,
    ...Shadows.sm,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
  },
  occRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  occLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  ackButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    marginVertical: 12,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
    marginHorizontal: 6,
  },
  filterActive: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  filterTextActive: {
    color: Colors.primary,
  },
  // Active reminders section styles
  activeSection: {
    backgroundColor: '#FFF5E6',
    borderRadius: Radii.md,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFD699',
  },
  activeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 6,
  },
  activeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#CC7A00',
  },
  activeSectionSubtitle: {
    fontSize: 12,
    color: '#996600',
  },
  activeOccRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE6B3',
  },
  activeOccInfo: {
    flex: 1,
  },
  activeTaskTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#663D00',
  },
  activeOccTime: {
    fontSize: 13,
    color: '#996600',
    marginTop: 2,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    gap: 4,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 12,
    marginTop: 8,
  },
});
