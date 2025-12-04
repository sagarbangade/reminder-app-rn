/**
 * Custom hook for managing notification permissions and responses
 */

import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { DISMISS_ACTION_ID, SNOOZE_ACTION_ID } from '../_utils/notificationCategories';
import { getSnoozeDuration, snoozeNotification } from '../_utils/snoozeUtils';
import { getTaskById } from '../_utils/storageUtils';
import { showToast } from '../_utils/toastUtils';

/**
 * Request notification permissions and set up listeners
 */
export function useNotifications(onNotificationReceived?: (notification: Notifications.Notification) => void) {
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Request permissions
    requestNotificationPermissions();

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Listen for notifications when app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Notification received
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listen for notification responses (user interaction)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(async (response) => {
      const { actionIdentifier, notification } = response;
      const { taskId, occurrenceKey } = notification.request.content.data as {
        taskId?: string;
        occurrenceKey?: string;
      };

      // Handle snooze action
      if (actionIdentifier === SNOOZE_ACTION_ID && taskId && occurrenceKey) {
        try {
          const task = await getTaskById(taskId);
          if (task) {
            await snoozeNotification(taskId, occurrenceKey, task);
            showToast('info', `Snoozed for ${getSnoozeDuration()} minutes`);
          }
        } catch (error) {
          console.error('Error handling snooze:', error);
          showToast('error', 'Failed to snooze notification');
        }
      } else if (actionIdentifier === DISMISS_ACTION_ID) {
        // Dismiss action - notification is already dismissed
        showToast('success', 'Reminder dismissed');
      }
    });

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [onNotificationReceived]);
}

/**
 * Request notification permissions from the user
 */
async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only ask if permission hasn't been granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
        } as any,
      });
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

