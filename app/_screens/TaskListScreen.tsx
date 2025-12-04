/**
 * TaskListScreen - Main screen for displaying all tasks
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabs } from '../_components/BottomTabs';
import { TaskCard } from '../_components/TaskCard';
import { useTaskActions, useTasks, useTasksLoading } from '../_context/TaskContext';
import { Colors, Radii, Shadows } from '../_styles/theme';
import { navigateToTaskDetail, navigateToTaskForm } from '../_utils/navigationHelpers';
import { getUpcomingCountForTask } from '../_utils/scheduleUtils';
import { showErrorToast, showToast } from '../_utils/toastUtils';

/**
 * TaskListScreen displays all tasks and allows navigation to add/edit tasks
 */
export const TaskListScreen: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Use TaskContext for global state
  const tasks = useTasks();
  const loading = useTasksLoading();
  const { loadTasks, deleteTask } = useTaskActions();
  
  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Optimize counts calculation with useMemo
  const counts = useMemo(() => {
    if (!tasks) return {};
    const map: Record<string, number> = {};
    for (const t of tasks) {
      try {
        map[t.id] = getUpcomingCountForTask(t);
      } catch {
        map[t.id] = 0;
      }
    }
    return map;
  }, [tasks]);

  /**
   * Handle task deletion with optimistic update
   */
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      await deleteTask(taskId);
      try { await Haptics.selectionAsync(); } catch {}
      showToast('success', 'Task deleted');
    } catch {
      showErrorToast('Failed to delete task');
      // Reload tasks on error to revert optimistic update
      await loadTasks();
    }
  }, [deleteTask, loadTasks]);

  /**
   * Navigate to edit screen
   */
  const handleEditTask = useCallback((taskId: string) => {
    navigateToTaskForm(router, taskId);
    try { Haptics.selectionAsync(); } catch {}
  }, [router]);

  const handleOpenDetail = useCallback((taskId: string) => {
    navigateToTaskDetail(router, taskId);
  }, [router]);

  /**
   * Navigate to add new task screen
   */
  const handleAddTask = useCallback(() => {
    navigateToTaskForm(router);
  }, [router]);

  // Show loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar style="light" />
      {/* Minimal Professional Header - No Title */}
      <LinearGradient
        colors={[Colors.headerGradientStart, Colors.headerGradientEnd]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={handleAddTask} style={styles.headerAction}>
            <MaterialCommunityIcons name="plus" size={20} color={Colors.card} />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Task List */}
      {tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pill" size={64} color={Colors.disabled} />
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
      
      <Pressable
        style={styles.floatingButtonContainer}
        onPress={handleAddTask}
        accessibilityRole="button"
        accessibilityLabel="Add new task"
        accessibilityHint="Opens the form to create a new reminder"
      >
        <View style={styles.floatingButton}>
          <MaterialCommunityIcons name="plus" size={24} color={Colors.card} />
        </View>
      </Pressable>

      {/* Persistent bottom tabs */}
      <BottomTabs />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    ...Shadows.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.card,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 6,
    fontWeight: '500',
    letterSpacing: 0.3,
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
    ...Shadows.md,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100, // Extra padding for bottom tabs
    gap: 14,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
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
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
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
