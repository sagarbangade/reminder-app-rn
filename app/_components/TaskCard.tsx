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
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  content: {
    flex: 1,
    paddingLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  details: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  schedule: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  rightCol: {
    width: 50,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  timesBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  timesBadgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  actionGroup: { 
    flexDirection: 'row', 
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: { backgroundColor: Colors.success },
  deleteButton: { backgroundColor: Colors.danger },
  infoButton: { backgroundColor: Colors.primary },
  upcomingBadge: {
    position: 'absolute',
    top: 8,
    right: 12,
    backgroundColor: Colors.secondary,
    borderRadius: Radii.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingBadgeText: { color: '#fff', fontWeight: '800', fontSize: 11 },
});

