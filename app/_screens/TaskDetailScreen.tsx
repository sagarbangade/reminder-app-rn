/**
 * TaskDetailScreen - Optional screen for viewing task details
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useTaskStorage } from '../_hooks/useTaskStorage';
import { Task } from '../_types/Task';

/**
 * TaskDetailScreen displays full details of a task and allows editing/deletion
 */
export const TaskDetailScreen: React.FC<{
  navigation: any;
  route: any;
}> = ({ navigation, route }) => {
  const [task, setTask] = React.useState<Task | null>(null);
  const { deleteTask, fetchTaskById } = useTaskStorage();
  /**
   * Load task data
   */
  const loadTask = React.useCallback(async () => {
    try {
      const taskId = route.params?.taskId;
      if (taskId) {
        const loadedTask = await fetchTaskById(taskId);
        setTask(loadedTask);
      }
    } catch {
      Alert.alert('Error', 'Failed to load task');
    }
  }, [route.params?.taskId, fetchTaskById]);

  React.useEffect(() => {
    loadTask();
  }, [loadTask]);

  /**
   * Handle delete task
   */
  const handleDelete = () => {
    if (!task) return;

    Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteTask(task.id);
            Alert.alert('Success', 'Task deleted');
            navigation.goBack();
          } catch {
            Alert.alert('Error', 'Failed to delete task');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  /**
   * Handle edit task
   */
  const handleEdit = () => {
    if (task) {
      navigation.navigate('TaskForm', { taskId: task.id });
    }
  };

  /**
   * Get schedule display text
   */
  const getScheduleDisplayText = (): string => {
    if (!task) return '';
    switch (task.scheduleType) {
      case 'daily':
        return `Daily at ${task.timesInDay.join(', ')}`;
      case 'alternateDays':
        return `Every ${task.alternateInterval} days at ${task.timesInDay[0]}`;
      case 'customTimes':
        return `Custom times: ${task.timesInDay.join(', ')}`;
      default:
        return 'Unknown schedule';
    }
  };

  if (!task) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Task Title */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Medication</Text>
          <Text style={styles.taskTitle}>{task.title}</Text>
        </View>

        {/* Task Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.details}>{task.details || 'No details provided'}</Text>
        </View>

        {/* Schedule Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <Text style={styles.schedule}>{getScheduleDisplayText()}</Text>
        </View>

        {/* Times List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Times</Text>
          {task.timesInDay.map((time, index) => (
            <View key={index} style={styles.timeItem}>
              <MaterialCommunityIcons name="clock" size={18} color="#0A84FF" />
              <Text style={styles.timeText}>{time}</Text>
            </View>
          ))}
        </View>

        {/* Interval (if applicable) */}
        {task.scheduleType === 'alternateDays' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Interval</Text>
            <Text style={styles.details}>Every {task.alternateInterval} day(s)</Text>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Pressable
          style={[styles.button, styles.editButton]}
          onPress={handleEdit}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Edit</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.deleteButton]}
          onPress={handleDelete}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#FFF" />
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    padding: 16,
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
  section: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  details: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  schedule: {
    fontSize: 16,
    color: '#0A84FF',
    fontWeight: '500',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  timeText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
    backgroundColor: '#0A84FF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
