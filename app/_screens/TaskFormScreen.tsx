/**
 * TaskFormScreen - Screen for adding/editing tasks
 */

import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { TaskForm } from '../_components/TaskForm';
import { useTaskStorage } from '../_hooks/useTaskStorage';
import { Task } from '../_types/Task';
import { showToast } from '../_utils/toastUtils';

/**
 * TaskFormScreen allows users to add a new task or edit an existing one
 */
export const TaskFormScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const { saveTask, fetchTaskById } = useTaskStorage();
  const [task, setTask] = useState<Task | null>(null);

  const taskId = route.params?.taskId;

  // Load task data if editing
  /**
   * Load task data from storage
   */
  const loadTask = React.useCallback(async () => {
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

  /**
   * Handle task save
   */
  const handleSaveTask = async (updatedTask: Task) => {
    try {
      await saveTask(updatedTask);
      try { await Haptics.selectionAsync(); } catch {}
      showToast('success', taskId ? 'Task updated' : 'Task created');
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to save task');
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TaskForm
        initialTask={task}
        onSave={handleSaveTask}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
});
