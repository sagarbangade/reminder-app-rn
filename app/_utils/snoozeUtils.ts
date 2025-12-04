/**
 * Utility functions for snoozing notifications
 */

import * as Notifications from 'expo-notifications';
import { TASK_REMINDER_CATEGORY } from './notificationCategories';
import { showToast } from './toastUtils';

/**
 * Snooze a notification for a specified duration
 */
export async function snoozeNotification(
  taskId: string,
  taskTitle: string,
  taskDetails: string,
  snoozeMinutes: number = 10
): Promise<void> {
  try {
    // Calculate snooze time
    const snoozeDate = new Date();
    snoozeDate.setMinutes(snoozeDate.getMinutes() + snoozeMinutes);

    // Schedule a new notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Snoozed: ${taskTitle}`,
        body: taskDetails || `Reminder for ${taskTitle}`,
        sound: 'default',
        priority: 'high',
        vibrate: [0, 250, 250, 250],
        categoryIdentifier: TASK_REMINDER_CATEGORY,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeDate,
      },
    });

    showToast('success', `Snoozed for ${snoozeMinutes} minutes`);
  } catch (error) {
    console.error('Error snoozing notification:', error);
    showToast('error', 'Failed to snooze notification');
  }
}
