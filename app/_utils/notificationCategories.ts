/**
 * Notification categories and actions for reminder notifications
 */

import * as Notifications from 'expo-notifications';

export const TASK_REMINDER_CATEGORY = 'TASK_REMINDER';
export const MARK_DONE_ACTION = 'MARK_DONE';
export const SNOOZE_ACTION = 'SNOOZE';
export const VIEW_ACTION = 'VIEW';

/**
 * Register notification categories with actions
 * Should be called on app startup
 */
export async function registerNotificationCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(TASK_REMINDER_CATEGORY, [
      {
        identifier: MARK_DONE_ACTION,
        buttonTitle: '✓ Mark as Done',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: SNOOZE_ACTION,
        buttonTitle: 'Snooze 10m',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: VIEW_ACTION,
        buttonTitle: 'View',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);
  } catch (error) {
    console.error('Error registering notification categories:', error);
  }
}

/**
 * Setup Android notification channel for proper delivery on Android 8.0+
 * This is REQUIRED for notifications to work on Android Oreo and above
 */
export async function setupAndroidNotificationChannel(): Promise<void> {
  try {
    // Only setup channel on Android
    const { Platform } = await import('react-native');
    if (Platform.OS !== 'android') return;

    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
    });
    
    console.log('Android notification channel created successfully');
  } catch (error) {
    console.error('Error setting up Android notification channel:', error);
  }
}
