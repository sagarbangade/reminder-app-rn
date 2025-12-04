/**
 * Notification categories and actions for reminder notifications
 */

import * as Notifications from 'expo-notifications';

export const REMINDER_CATEGORY_ID = 'reminder';
export const SNOOZE_ACTION_ID = 'snooze';
export const DISMISS_ACTION_ID = 'dismiss';

/**
 * Register notification categories with actions
 * Should be called on app startup
 */
export async function registerNotificationCategories(): Promise<void> {
  try {
    await Notifications.setNotificationCategoryAsync(REMINDER_CATEGORY_ID, [
      {
        identifier: SNOOZE_ACTION_ID,
        buttonTitle: 'Snooze 5 min',
        options: {
          opensAppToForeground: false,
        },
      },
      {
        identifier: DISMISS_ACTION_ID,
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  } catch (error) {
    console.error('Error registering notification categories:', error);
  }
}
