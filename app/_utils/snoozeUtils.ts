/**
 * Utility functions for snoozing notifications
 */

import * as Notifications from 'expo-notifications';
import { Task } from '../_types/Task';
import { REMINDER_CATEGORY_ID } from './notificationCategories';

const SNOOZE_DURATION_MINUTES = 5;

/**
 * Snooze a notification for 5 minutes
 * @param taskId The task ID
 * @param occurrenceKey The occurrence key (ISO string)
 * @param task The task object
 * @returns The notification ID of the snoozed notification
 */
export async function snoozeNotification(
  taskId: string,
  occurrenceKey: string,
  task: Task
): Promise<string> {
  try {
    // Calculate snooze time (5 minutes from now)
    const snoozeDate = new Date();
    snoozeDate.setMinutes(snoozeDate.getMinutes() + SNOOZE_DURATION_MINUTES);

    // Schedule the snoozed notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${task.title}`,
        body: task.details || `Time for ${task.title}`,
        sound: 'default',
        data: {
          taskId,
          occurrenceKey,
          isSnoozed: true,
        },
        categoryIdentifier: REMINDER_CATEGORY_ID,
        priority: 'high',
        vibrate: [0, 250, 250, 250],
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeDate,
      },
    });

    return notificationId;
  } catch (error) {
    console.error('Error snoozing notification:', error);
    throw error;
  }
}

/**
 * Get the snooze duration in minutes
 */
export function getSnoozeDuration(): number {
  return SNOOZE_DURATION_MINUTES;
}
