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
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Radii } from '../_styles/theme';
import { Task } from '../_types/Task';

interface TaskCardProps {
  task: Task;
  onPress: () => void; // open / view detail
  onEdit?: () => void; // open edit form
  onDelete: (taskId: string) => void;
  upcomingCount?: number;
}

/**
 * TaskCard - Displays a single task with its details and action buttons
 */
export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onEdit, onDelete, upcomingCount = 0 }) => {
  const handleDelete = () => {
    const confirmed = window.confirm(`Are you sure you want to delete "${task.title}"?`);
    if (confirmed) {
      onDelete(task.id);
    }
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

  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 120 }) }],
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.cardContent}>
        <Pressable
          onPressIn={() => { scale.value = 0.98; }}
          onPressOut={() => { scale.value = 1; }}
          onPress={onPress}
          style={styles.pressable}
        >
          <View style={styles.leftCol}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(task.title || 'R').slice(0, 1).toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{task.title}</Text>
            <Text style={styles.details} numberOfLines={2}>{task.details}</Text>
            <View style={styles.row}>
              <Text style={styles.schedule}>{getScheduleDisplayText()}</Text>
            </View>
          </View>
          <View style={styles.rightCol}>
            <View style={styles.timesBadge}>
              <Text style={styles.timesBadgeText}>{task.timesInDay.length}×</Text>
            </View>
          </View>
        </Pressable>
        <View style={styles.actionGroup}>
          <Pressable
            style={[styles.actionIcon, styles.infoButton]}
            onPress={onPress}
          >
            <MaterialCommunityIcons name="eye" size={18} color="#FFF" />
          </Pressable>
          <Pressable
            style={[styles.actionIcon, styles.editButton]}
            onPress={onEdit ? onEdit : onPress}
          >
            <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
          </Pressable>
          <Pressable
            style={[styles.actionIcon, styles.deleteButton]}
            onPress={handleDelete}
          >
            <MaterialCommunityIcons name="delete" size={18} color="#FFF" />
          </Pressable>
        </View>
      </View>
      {upcomingCount > 0 && (
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingBadgeText}>{upcomingCount}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: Radii.md || 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  pressable: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  leftCol: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingLeft: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  details: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
    lineHeight: 20,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  schedule: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  rightCol: {
    width: 50,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  timesBadge: {
    backgroundColor: (Colors as any).primarySoft || '#EFE8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  timesBadgeText: {
    color: Colors.primary,
    fontWeight: '800',
  },
  actionGroup: { 
    flexDirection: 'row', 
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  editButton: { backgroundColor: Colors.neon },
  deleteButton: { backgroundColor: Colors.accent },
  infoButton: { backgroundColor: Colors.primary },
  upcomingBadge: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: Colors.neon,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  upcomingBadgeText: { color: '#fff', fontWeight: '800' },
});

