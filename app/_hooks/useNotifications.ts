/**
 * Custom hook for managing notification permissions and responses
 */

import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { SNOOZE_ACTION } from '../_utils/notificationCategories';
import { snoozeNotification } from '../_utils/snoozeUtils';
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
    
    console.log('[useNotifications] Notification handler configured');

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
      if (actionIdentifier === SNOOZE_ACTION && taskId && occurrenceKey) {
        try {
          const task = await getTaskById(taskId);
          if (task) {
            await snoozeNotification(taskId, task.title, task.details || '', 10);
          }
        } catch (error) {
          console.error('Error handling snooze:', error);
          showToast('error', 'Failed to snooze notification');
        }
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
    console.log('[Notifications] Current permission status:', existingStatus);
    
    let finalStatus = existingStatus;

    // Only ask if permission hasn't been granted
    if (existingStatus !== 'granted') {
      console.log('[Notifications] Requesting permissions...');
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
        } as any,
      });
      finalStatus = status;
      console.log('[Notifications] Permission request result:', finalStatus);
    }

    if (finalStatus === 'granted') {
      console.log('[Notifications] ✅ Notifications enabled');
    } else {
      console.warn('[Notifications] ⚠️ Notifications NOT granted');
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('[Notifications] Error requesting permissions:', error);
    return false;
  }
}

