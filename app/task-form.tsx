/**
 * TaskFormScreen - Screen for adding/editing tasks using Expo Router
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TaskForm } from './_components/TaskForm';
import { useTaskStorage } from './_hooks/useTaskStorage';
import { Colors } from './_styles/theme';
import { Task } from './_types/Task';

/**
 * TaskFormScreen allows users to add a new task or edit an existing one
 */
export default function TaskFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { saveTask, fetchTaskById } = useTaskStorage();
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
      Alert.alert('Error', 'Failed to load task');
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
      Alert.alert('Success', taskId ? 'Task updated' : 'Task created');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save task');
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
