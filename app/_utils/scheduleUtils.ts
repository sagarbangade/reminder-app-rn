/**
 * Utility functions for scheduling notifications
 */

import { Task } from '../_types/Task';
import { savePersistentSchedule } from './storageUtils';

// Lazy load notifications to avoid import errors in Expo Go
let Notifications: any = null;
let notificationsError: boolean = false;

async function getNotifications() {
  if (notificationsError) return null;
  
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
    } catch (error) {
      console.warn('expo-notifications not available:', error);
      notificationsError = true;
      return null;
    }
  }
  return Notifications;
}

/**
 * Schedule notifications for a task based on its schedule type
 * Returns array of notification IDs for later cancellation
 */
export async function scheduleTaskNotifications(task: Task): Promise<string[]> {
  const Notif = await getNotifications();
  if (!Notif) {
    console.warn('Notifications not available, skipping scheduling');
    return [];
  }

  const notificationIds: string[] = [];

  try {
    switch (task.scheduleType) {
      case 'daily':
        // Schedule notification for each time in the day, every day
        for (const time of task.timesInDay) {
          const id = await scheduleDailyNotification(Notif, task, time);
          notificationIds.push(id);
          // schedule followups for the next occurrence of this time within 24h
          try {
            const next = getNextOccurrenceForTime(time);
            if (next) {
              await scheduleFollowupsForOccurrence(Notif, task, next);
            }
          } catch (e) {
            console.error('Error scheduling followups for daily', e);
          }
        }
        break;

      case 'alternateDays':
        // Schedule notifications for each configured time on the alternate-day cadence
        if (task.timesInDay.length > 0) {
          const ids = await scheduleAlternateDaysForTimes(Notif, task);
          notificationIds.push(...ids);
        }
        break;

      case 'customTimes':
        // If task has explicit customDateTimes (one-off), schedule each at its exact date/time
        if (task.customDateTimes && task.customDateTimes.length > 0) {
          for (const dtIso of task.customDateTimes) {
            try {
              const when = new Date(dtIso);
              if (when > new Date()) {
                const id = await Notif.scheduleNotificationAsync({
                  content: {
                    title: `Reminder: ${task.title}`,
                    body: task.details || `Time for ${task.title}`,
                    sound: 'default',
                    priority: 'high',
                    android: {
                      vibrate: [0, 250, 250, 250],
                      priority: 'high',
                    },
                  },
                  trigger: when,
                });
                notificationIds.push(id);
                // schedule followups for this exact occurrence
                try {
                  await scheduleFollowupsForOccurrence(Notif, task, when);
                } catch (e) {
                  console.error('Error scheduling followups for custom', e);
                }
              }
            } catch (err) {
              console.error('Failed scheduling custom date/time', err);
            }
          }
        } else {
          // Fallback: schedule as daily times
          for (const time of task.timesInDay) {
            const id = await scheduleDailyNotification(Notif, task, time);
            notificationIds.push(id);
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }

  return notificationIds;
}

// helper: get next occurrence Date for a given 'HH:MM' time string within next 24 hours
function getNextOccurrenceForTime(time: string): Date | null {
  const now = new Date();
  const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
  if (isNaN(hh) || isNaN(mm)) return null;
  const occ = new Date(now);
  occ.setHours(hh, mm, 0, 0);
  if (occ <= now) occ.setDate(occ.getDate() + 1);
  // limit to next 24h
  const diffMs = occ.getTime() - now.getTime();
  if (diffMs > 24 * 60 * 60 * 1000) return null;
  return occ;
}

// helper: schedule follow-up notifications every 5 minutes for next 6 hours and persist ids
async function scheduleFollowupsForOccurrence(Notif: any, task: Task, occ: Date) {
  try {
    const followupIds: string[] = [];
    const followupMinutes = 6 * 60; // 6 hours
    const step = 5; // every 5 minutes
    for (let m = 0; m <= followupMinutes; m += step) {
      const f = new Date(occ);
      f.setMinutes(f.getMinutes() + m);
      if (f <= new Date()) continue;
      try {
        const fid = await Notif.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${task.title}`,
            body: task.details || `Time for ${task.title}`,
            sound: 'default',
            priority: 'high',
            android: { vibrate: [0, 250, 250, 250], priority: 'high' },
          },
          trigger: f,
        });
        followupIds.push(fid);
      } catch (e) {
        console.error('Failed scheduling followup', e);
      }
    }
    if (followupIds.length) {
      const occurrenceKey = occ.toISOString();
      await savePersistentSchedule(task.id, occurrenceKey, followupIds);
    }
  } catch (e) {
    console.error('Error scheduling persistent followups', e);
  }
}

// Public helper: schedule persistent followups for an occurrence ISO string
export async function schedulePersistentFollowupsForOccurrence(task: Task, occIso: string): Promise<void> {
  try {
    const Notif = await getNotifications();
    if (!Notif) return;
    const occ = new Date(occIso);
    if (isNaN(occ.getTime())) return;
    await scheduleFollowupsForOccurrence(Notif, task, occ);
  } catch (e) {
    console.error('Error scheduling persistent followups for occurrence:', e);
  }
}

/**
 * Schedule a daily notification at a specific time
 */
async function scheduleDailyNotification(Notif: any, task: Task, time: string): Promise<string> {
  // Create trigger for daily notification
  // Using a 24-hour interval for daily reminders
  const trigger: any = {
    type: Notif.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 24 * 60 * 60, // Daily
  };

  const notificationId = await Notif.scheduleNotificationAsync({
    content: {
      title: `Reminder: ${task.title}`,
      body: task.details || `Time for ${task.title}`,
      sound: 'default',
      priority: 'high',
      android: {
        vibrate: [0, 250, 250, 250],
        priority: 'high',
      },
    },
    trigger,
  });

  return notificationId;
}



/**
 * Schedule notifications for every configured time on alternate-day cadence.
 * Since scheduling a repeating calendar event every N days is not reliably
 * supported across platforms, we schedule discrete notifications for the
 * next `horizonDays` days spaced by `alternateInterval` days.
 * This produces predictable results and supports multiple times per day.
 */
async function scheduleAlternateDaysForTimes(Notif: any, task: Task): Promise<string[]> {
  const notificationIds: string[] = [];
  const horizonDays = 365; // schedule for next year
  const interval = Math.max(1, task.alternateInterval || 1);

  const createdDate = new Date(task.createdAt);
  const now = new Date();

  // For each time of day, generate occurrences starting from createdDate
  for (const time of task.timesInDay) {
    const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));

    // iterate over occurrences spaced by `interval` days
    for (let offset = 0; offset <= horizonDays; offset += interval) {
      const occ = new Date(createdDate);
      occ.setDate(createdDate.getDate() + offset);
      occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);

      if (occ <= now) continue; // skip past occurrences

      try {
        const id = await Notif.scheduleNotificationAsync({
          content: {
            title: `Reminder: ${task.title}`,
            body: task.details || `Time for ${task.title}`,
            sound: 'default',
            priority: 'high',
            android: {
              vibrate: [0, 250, 250, 250],
              priority: 'high',
            },
          },
          trigger: occ,
        });
        notificationIds.push(id);
        // Schedule follow-up persistent reminders every 5 minutes for next 6 hours
        try {
          const followupIds: string[] = [];
          const followupMinutes = 6 * 60; // 6 hours
          const step = 5; // every 5 minutes
          for (let m = step; m <= followupMinutes; m += step) {
            const f = new Date(occ);
            f.setMinutes(f.getMinutes() + m);
            if (f <= new Date()) continue;
            try {
              const fid = await Notif.scheduleNotificationAsync({
                content: {
                  title: `Reminder: ${task.title}`,
                  body: task.details || `Time for ${task.title}`,
                  sound: 'default',
                  priority: 'high',
                  android: { vibrate: [0, 250, 250, 250], priority: 'high' },
                },
                trigger: f,
              });
              followupIds.push(fid);
            } catch (e) {
              console.error('Failed scheduling followup', e);
            }
          }
          if (followupIds.length) {
            const occurrenceKey = occ.toISOString();
            await savePersistentSchedule(task.id, occurrenceKey, followupIds);
          }
        } catch (e) {
          console.error('Error scheduling persistent followups', e);
        }
      } catch (err) {
        console.error('Failed scheduling alternate-day occurrence', err);
      }
    }
  }

  return notificationIds;
}

/**
 * Cancel all notifications for a task
 */
export async function cancelTaskNotifications(notificationIds: string[]): Promise<void> {
  const Notif = await getNotifications();
  if (!Notif) return;

  for (const id of notificationIds) {
    try {
      await Notif.cancelScheduledNotificationAsync(id);
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
export async function getAllScheduledNotifications(): Promise<any[]> {
  const Notif = await getNotifications();
  if (!Notif) return [];

  try {
    return await Notif.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}

/**
 * Compute number of occurrences for a task within the next 24 hours.
 * Mirror the logic used in Upcoming screen so counts match the list.
 */
export function getUpcomingCountForTask(task: import('../_types/Task').Task): number {
  const now = new Date();
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  let count = 0;

  if (task.scheduleType === 'daily' || task.scheduleType === 'alternateDays') {
    const daysToCheck = 2;
    const isAlternate = task.scheduleType === 'alternateDays';
    for (let d = 0; d < daysToCheck; d++) {
      const base = new Date();
      base.setDate(base.getDate() + d);
      base.setHours(0, 0, 0, 0);
      for (const time of task.timesInDay) {
        const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
        const occ = new Date(base);
        occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
        if (occ >= now && occ <= end) {
          if (isAlternate) {
            const diffDays = Math.floor((occ.getTime() - new Date(task.createdAt).setHours(0,0,0,0)) / (24*60*60*1000));
            if (diffDays % Math.max(1, task.alternateInterval || 1) !== 0) continue;
          }
          count++;
        }
      }
    }
  }

  if (task.scheduleType === 'customTimes') {
    if (task.customDateTimes && task.customDateTimes.length) {
      for (const dt of task.customDateTimes) {
        try {
          const d = new Date(dt);
          if (d >= now && d <= end) count++;
        } catch {}
      }
    } else {
      for (const time of task.timesInDay) {
        const [hh, mm] = time.split(':').map((v) => parseInt(v, 10));
        const occ = new Date();
        occ.setHours(isNaN(hh) ? 9 : hh, isNaN(mm) ? 0 : mm, 0, 0);
        if (occ >= now && occ <= end) count++;
      }
    }
  }

  return count;
}
