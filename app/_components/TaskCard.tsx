/**
 * TaskCard component for displaying task information
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Radii } from '../_styles/theme';
import { Task } from '../_types/Task';
import { ConfirmDialog } from './ConfirmDialog';

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
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(false);
    onDelete(task.id);
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
      <Pressable
        onPressIn={() => { scale.value = 0.98; }}
        onPressOut={() => { scale.value = 1; }}
        onPress={onPress}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityLabel={`View ${task.title} reminder`}
        accessibilityHint="Opens detailed view of this reminder"
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(task.title || 'R').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
            <Text style={styles.details} numberOfLines={2}>{task.details}</Text>
          </View>
          {upcomingCount > 0 && (
            <View style={styles.upcomingBadge}>
              <Text style={styles.upcomingBadgeText}>{upcomingCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.scheduleRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.primary} />
            <Text style={styles.schedule}>{getScheduleDisplayText()}</Text>
          </View>
          <View style={styles.timesBadge}>
            <Text style={styles.timesBadgeText}>{task.timesInDay.length}×</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actionGroup}>
        <Pressable
          style={[styles.actionIcon, styles.infoButton]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="View details"
          accessibilityHint="Opens detailed view"
        >
          <MaterialCommunityIcons name="eye" size={18} color="#FFF" />
        </Pressable>
        <Pressable
          style={[styles.actionIcon, styles.editButton]}
          onPress={onEdit ? onEdit : onPress}
          accessibilityRole="button"
          accessibilityLabel="Edit reminder"
          accessibilityHint="Opens form to edit this reminder"
        >
          <MaterialCommunityIcons name="pencil" size={18} color="#FFF" />
        </Pressable>
        <Pressable
          style={[styles.actionIcon, styles.deleteButton]}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete reminder"
          accessibilityHint="Deletes this reminder permanently"
        >
          <MaterialCommunityIcons name="delete" size={18} color="#FFF" />
        </Pressable>
      </View>
      
      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        type="danger"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  pressable: { 
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
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
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 20,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  details: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  schedule: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  timesBadge: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
  },
  timesBadgeText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
  },
  actionGroup: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.bgLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  editButton: { backgroundColor: Colors.success },
  deleteButton: { backgroundColor: Colors.danger },
  infoButton: { backgroundColor: Colors.primary },
  upcomingBadge: {
    backgroundColor: Colors.secondary,
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 28,
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingBadgeText: { 
    color: '#fff', 
    fontWeight: '800', 
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

