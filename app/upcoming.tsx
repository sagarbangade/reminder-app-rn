import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
 
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from './_components/BottomTabs';
import { Colors, Radii } from './_styles/theme';
import { Task } from './_types/Task';
import { cancelTaskNotifications, schedulePersistentFollowupsForOccurrence } from './_utils/scheduleUtils';
import { acknowledgeOccurrence, deletePersistentSchedule, getAllTasks, getPersistentSchedule, isOccurrenceAcknowledged, unacknowledgeOccurrence } from './_utils/storageUtils';
import { showToast } from './_utils/toastUtils';

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

  const loadUpcoming = useCallback(async () => {
    const now = new Date();
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tasks = await getAllTasks();
    const occs: {
      task: Task;
      date: Date;
      key: string;
      label: string;
      acknowledged: boolean;
    }[] = [];
    for (const task of tasks) {
      // daily/alternateDays
      if (task.scheduleType === 'daily' || task.scheduleType === 'alternateDays') {
        const daysToCheck = 2;
        for (let d = 0; d < daysToCheck; d++) {
          const base = new Date();
          base.setDate(base.getDate() + d);
          base.setHours(0, 0, 0, 0);
          const isAlternate = task.scheduleType === 'alternateDays';
          for (const time of task.timesInDay) {
            const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
            const occ = new Date(base);
            occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
            if (occ >= now && occ <= end) {
              if (isAlternate) {
                const diffDays = Math.floor((occ.getTime() - new Date(task.createdAt).setHours(0,0,0,0)) / (24*60*60*1000));
                if (diffDays % Math.max(1, task.alternateInterval || 1) !== 0) continue;
              }
              const key = occ.toISOString();
              const acknowledged = await isOccurrenceAcknowledged(task.id, key);
              occs.push({ task, date: occ, key, label: occ.toLocaleString(), acknowledged });
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
              if (d >= now && d <= end) {
                const key = d.toISOString();
                const acknowledged = await isOccurrenceAcknowledged(task.id, key);
                occs.push({ task, date: d, key, label: d.toLocaleString(), acknowledged });
              }
            } catch {}
          }
        } else {
          for (const time of task.timesInDay) {
            const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
            const occ = new Date();
            occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
            if (occ >= now && occ <= end) {
              const key = occ.toISOString();
              const acknowledged = await isOccurrenceAcknowledged(task.id, key);
              occs.push({ task, date: occ, key, label: occ.toLocaleString(), acknowledged });
            }
          }
        }
      }
    }
    occs.sort((a, b) => a.date.getTime() - b.date.getTime());
    setOccurrences(occs);
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
      Alert.alert('Error', 'Failed to toggle acknowledge');
    }
  };

  const grouped = occurrences.reduce((acc, occ) => {
    if (!acc[occ.task.id]) acc[occ.task.id] = [];
    acc[occ.task.id].push(occ);
    return acc;
  }, {} as Record<string, typeof occurrences>);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}> 
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

        {Object.keys(grouped).length === 0 ? (
          <Text style={styles.empty}>No reminders due in the next 24 hours.</Text>
        ) : (
          Object.values(grouped).map((occs) => {
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
                        <MaterialCommunityIcons name="check-circle" size={28} color="#34C759" />
                      ) : (
                        <MaterialCommunityIcons name="checkbox-blank-circle-outline" size={28} color="#999" />
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            );
          })
        )}
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
    color: '#7C3AED',
    marginTop: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  empty: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  taskSection: {
    marginBottom: 28,
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
    borderBottomColor: '#EEE',
  },
  occLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222',
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
  
});
