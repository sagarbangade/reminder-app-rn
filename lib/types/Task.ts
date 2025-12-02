/**
 * Task type definitions for the Medicine Reminder app
 */

export type ScheduleType = 'daily' | 'alternateDays' | 'customTimes';

export interface Task {
  id: string;
  title: string;
  details: string;
  scheduleType: ScheduleType;
  // Array of time strings like "09:00", "15:00"
  timesInDay: string[];
  // For alternateDays: every N days (e.g., 2 for every 2 days)
  alternateInterval: number;
  // When the task was created (for calculating alternate days)
  createdAt: number;
  // Last reminder time (for tracking alternate day logic)
  lastReminderTime?: number;
}

export interface NotificationSchedule {
  taskId: string;
  notificationIds: string[];
}
