/**
 * Utility functions for scheduling notifications
 */

import * as Notifications from 'expo-notifications';
import { Task } from '../types/Task';

/**
 * Schedule notifications for a task based on its schedule type
 * Returns array of notification IDs for later cancellation
 */
export async function scheduleTaskNotifications(task: Task): Promise<string[]> {
  const notificationIds: string[] = [];

  try {
    switch (task.scheduleType) {
      case 'daily':
        // Schedule notification for each time in the day, every day
        for (const time of task.timesInDay) {
          const id = await scheduleDailyNotification(task, time);
          notificationIds.push(id);
        }
        break;

      case 'alternateDays':
        // Schedule notification at first time in timesInDay every alternateInterval days
        if (task.timesInDay.length > 0) {
          const id = await scheduleAlternateDaysNotification(task, task.timesInDay[0]);
          notificationIds.push(id);
        }
        break;

      case 'customTimes':
        // Schedule each time daily (similar to daily but explicitly for custom times)
        for (const time of task.timesInDay) {
          const id = await scheduleDailyNotification(task, time);
          notificationIds.push(id);
        }
        break;
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }

  return notificationIds;
}

/**
 * Schedule a daily notification at a specific time
 */
async function scheduleDailyNotification(task: Task, time: string): Promise<string> {
  // Create trigger for daily notification
  // Using a 24-hour interval for daily reminders
  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 24 * 60 * 60, // Daily
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Medicine Reminder: ${task.title}`,
      body: task.details || `Time to take your ${task.title}`,
      sound: 'default',
      priority: 'high',
    },
    trigger,
  });

  return notificationId;
}

/**
 * Schedule a notification for alternate days at a specific time
 */
async function scheduleAlternateDaysNotification(task: Task, time: string): Promise<string> {
  // Calculate next occurrence based on alternateInterval
  const now = new Date();
  const createdDate = new Date(task.createdAt);
  
  // Calculate how many days have passed since task creation
  const daysPassed = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate next notification day based on interval
  const nextNotificationDay = Math.ceil((daysPassed + 1) / task.alternateInterval) * task.alternateInterval;
  const nextDate = new Date(createdDate);
  nextDate.setDate(nextDate.getDate() + nextNotificationDay);

  // Schedule as a time interval from now
  const secondsUntilNext = Math.floor((nextDate.getTime() - now.getTime()) / 1000);
  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: Math.max(secondsUntilNext, 60), // At least 1 minute
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `Medicine Reminder: ${task.title}`,
      body: task.details || `Time to take your ${task.title}`,
      sound: 'default',
      priority: 'high',
    },
    trigger,
  });

  return notificationId;
}

/**
 * Cancel all notifications for a task
 */
export async function cancelTaskNotifications(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error(`Error canceling notification ${id}:`, error);
    }
  }
}

/**
 * Reschedule all notifications for a task (cancel old, schedule new)
 */
export async function rescheduleTaskNotifications(
  task: Task,
  oldNotificationIds: string[]
): Promise<string[]> {
  // Cancel old notifications
  await cancelTaskNotifications(oldNotificationIds);
  
  // Schedule new notifications
  return scheduleTaskNotifications(task);
}

/**
 * Validate time string format (HH:MM)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Get all scheduled notifications (for debugging)
 */
export async function getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}
