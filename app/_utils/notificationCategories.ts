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
