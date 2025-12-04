/**
 * TaskFormScreen - Screen for adding/editing tasks using Expo Router
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskForm } from './_components/TaskForm';
import { useTaskActions } from './_context/TaskContext';
import { Colors } from './_styles/theme';
import { Task } from './_types/Task';
import { showErrorToast, showSuccessToast } from './_utils/toastUtils';

/**
 * TaskFormScreen allows users to add a new task or edit an existing one
 */
export default function TaskFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { saveTask, fetchTaskById } = useTaskActions();
  const [task, setTask] = useState<Task | null>(null);

  /**
   * Load task data from storage
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

  // Load task data if editing
  useEffect(() => {
    if (taskId) {
      loadTask();
    }
  }, [taskId, loadTask]);

  /**
   * Handle task save
   */
  const handleSaveTask = async (updatedTask: Task) => {
    try {
      await saveTask(updatedTask);
      showSuccessToast(taskId ? 'Task updated successfully' : 'Task created successfully');
      router.back();
    } catch {
      showErrorToast('Failed to save task');
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <TaskForm
        initialTask={task}
        onSave={handleSaveTask}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
