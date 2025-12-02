/**
 * Custom hook for managing notification permissions and responses
 */

import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

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
        shouldPlaySound: true,
        shouldSetBadge: true,
      } as any),
    });

    // Listen for notifications when app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Notification received
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listen for notification responses (user interaction)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Notification response received
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

