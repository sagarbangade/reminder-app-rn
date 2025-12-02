/**
 * TaskCard component for displaying task information
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Task } from '../types/Task';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onDelete: (taskId: string) => void;
}

/**
 * TaskCard - Displays a single task with its details and action buttons
 */
export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onDelete }) => {
  const handleDelete = () => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: () => onDelete(task.id),
        style: 'destructive',
      },
    ]);
  };

  const getScheduleDisplayText = (): string => {
    switch (task.scheduleType) {
      case 'daily':
        return 'Daily at ' + task.timesInDay.join(', ');
      case 'alternateDays':
        return `Every ${task.alternateInterval} days at ${task.timesInDay[0]}`;
      case 'customTimes':
        return 'Custom times: ' + task.timesInDay.join(', ');
      default:
        return 'Unknown schedule';
    }
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title}>{task.title}</Text>
        <Text style={styles.details}>{task.details}</Text>
        <Text style={styles.schedule}>{getScheduleDisplayText()}</Text>
      </View>
      
      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, styles.editButton]}
          onPress={onPress}
        >
          <MaterialCommunityIcons name="pencil" size={20} color="#FFF" />
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#FFF" />
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  schedule: {
    fontSize: 12,
    color: '#0A84FF',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#0A84FF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
});
