/**
 * TaskListScreen - Main screen for displaying all tasks
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from '../_components/BottomTabs';
import { TaskCard } from '../_components/TaskCard';
import { useTaskStorage } from '../_hooks/useTaskStorage';
import { Colors, Radii } from '../_styles/theme';
import { getUpcomingCountForTask } from '../_utils/scheduleUtils';
import { showToast } from '../_utils/toastUtils';

/**
 * TaskListScreen displays all tasks and allows navigation to add/edit tasks
 */
export const TaskListScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, loading, deleteTask, loadTasks } = useTaskStorage();  // Reload tasks when screen is focused (after adding/editing)
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks])
  );

  useEffect(() => {
    if (!tasks) return;
    const map: Record<string, number> = {};
    for (const t of tasks) {
      try {
        map[t.id] = getUpcomingCountForTask(t);
      } catch {
        map[t.id] = 0;
      }
    }
    setCounts(map);
  }, [tasks]);

  /**
   * Handle task deletion
   */
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      try { await Haptics.selectionAsync(); } catch {}
      showToast('success', 'Task deleted');
      // refresh list
      await loadTasks();
    } catch {
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  /**
   * Navigate to edit screen
   */
  const handleEditTask = (taskId: string) => {
    (router.push as any)(`/task-form?taskId=${taskId}`);
    try { Haptics.selectionAsync(); } catch {}
    showToast('info', 'Opening editor...');
  };

  const handleOpenDetail = (taskId: string) => {
    (router.push as any)(`/task-detail?taskId=${taskId}`);
  };

  /**
   * Navigate to add new task screen
   */
  const handleAddTask = () => {
    (router.push as any)(`/task-form`);
  };

  // handleOpenUpcoming removed — bottom tabs handle navigation now

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[styles.header, styles.headerElevated]}>
        <View>
          <Text style={styles.title}>Reminder App</Text>
          <Text style={styles.subtitle}>Stay on track with smart reminders</Text>
        </View>
        <Pressable onPress={handleAddTask} style={styles.headerAction}>
          <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        </Pressable>
      </View>

      {/* Task List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pill" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No reminders yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to create your first reminder
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => handleOpenDetail(item.id)}
              onEdit={() => handleEditTask(item.id)}
              onDelete={handleDeleteTask}
              upcomingCount={counts[item.id] || 0}
            />
          )}
          contentContainerStyle={styles.listContent}
          scrollEnabled
        />
      )}

      {/* Persistent bottom tabs */}
      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: Radii.lg,
    borderBottomRightRadius: Radii.lg,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
    fontWeight: '600',
  },
  addButton: {
    padding: 8,
  },
  headerElevated: {
    paddingHorizontal: 18,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.neon,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomTabs: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '700',
  },
  addPill: {
    backgroundColor: Colors.neon,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
});
