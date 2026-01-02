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

    // Schedule the snoozed reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Snoozed: ${taskTitle}`,
        body: taskDetails || `Reminder for ${taskTitle}`,
        sound: 'default',
        priority: 'high',
        vibrate: [0, 250, 250, 250],
        categoryIdentifier: TASK_REMINDER_CATEGORY,
        data: {
          taskId,
          occurrenceKey: snoozeDate.toISOString(),
        },
        android: {
          vibrate: [0, 250, 250, 250],
          priority: 'high',
          channelId: 'reminders',
        },
      } as Notifications.NotificationContentInput,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: snoozeDate,
      },
    });

    // Show instant confirmation notification (works even when app is in background)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✓ Snoozed',
        body: `Will remind you about "${taskTitle}" in ${snoozeMinutes} minutes`,
        android: {
          channelId: 'reminders',
        },
      } as Notifications.NotificationContentInput,
      trigger: null, // Immediate
    });

    // Also show toast if app is in foreground
    showToast('success', `Snoozed for ${snoozeMinutes} minutes`);
  } catch (error) {
    console.error('Error snoozing notification:', error);
    
    // Show error notification (works in background)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '❌ Snooze Failed',
        body: 'Could not snooze the reminder. Please try again.',
        android: {
          channelId: 'reminders',
        },
      } as Notifications.NotificationContentInput,
      trigger: null,
    }).catch(() => {}); // Ignore if this also fails
    
    showToast('error', 'Failed to snooze notification');
  }
}
