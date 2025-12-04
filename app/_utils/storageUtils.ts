/**
 * Storage utility functions for persisting tasks and notification IDs
 * Using MMKV for 30x faster performance than AsyncStorage
 */

import { NotificationSchedule, Task } from '../_types/Task';
import { getItem, setItem, STORAGE_KEYS } from './mmkvStorage';

/**
 * Save a task to storage
 */
export async function saveTask(task: Task): Promise<void> {
  try {
    const tasks = await getAllTasks();
    const existingIndex = tasks.findIndex((t) => t.id === task.id);

    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }

    setItem(STORAGE_KEYS.TASKS, tasks);
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
}

/**
 * Get all tasks from storage
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    return getItem<Task[]>(STORAGE_KEYS.TASKS) || [];
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const tasks = await getAllTasks();
    return tasks.find((t) => t.id === id) || null;
  } catch (error) {
    console.error('Error getting task by ID:', error);
    return null;
  }
}

/**
 * Delete a task from storage
 */
export async function deleteTask(id: string): Promise<void> {
  try {
    const tasks = await getAllTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    setItem(STORAGE_KEYS.TASKS, filtered);
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

/**
 * Save notification IDs for a task
 */
export async function saveNotificationSchedule(schedule: NotificationSchedule): Promise<void> {
  try {
    const schedules = await getAllNotificationSchedules();
    const existingIndex = schedules.findIndex((s) => s.taskId === schedule.taskId);

    if (existingIndex >= 0) {
      schedules[existingIndex] = schedule;
    } else {
      schedules.push(schedule);
    }

    setItem(STORAGE_KEYS.NOTIFICATIONS, schedules);
  } catch (error) {
    console.error('Error saving notification schedule:', error);
    throw error;
  }
}

/**
 * Get notification IDs for a task
 */
export async function getNotificationSchedule(taskId: string): Promise<string[]> {
  try {
    const schedules = await getAllNotificationSchedules();
    const schedule = schedules.find((s) => s.taskId === taskId);
    return schedule ? schedule.notificationIds : [];
  } catch (error) {
    console.error('Error getting notification schedule:', error);
    return [];
  }
}

/**
 * Get all notification schedules
 */
export async function getAllNotificationSchedules(): Promise<NotificationSchedule[]> {
  try {
    return getItem<NotificationSchedule[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
  } catch (error) {
    console.error('Error getting all notification schedules:', error);
    return [];
  }
}

/**
 * Delete notification schedule for a task
 */
export async function deleteNotificationSchedule(taskId: string): Promise<void> {
  try {
    const schedules = await getAllNotificationSchedules();
    const filtered = schedules.filter((s) => s.taskId !== taskId);
    setItem(STORAGE_KEYS.NOTIFICATIONS, filtered);
  } catch (error) {
    console.error('Error deleting notification schedule:', error);
    throw error;
  }
}

// Persistent per-occurrence schedules (for repeated reminders until acknowledged)

export async function savePersistentSchedule(taskId: string, occurrenceKey: string, notificationIds: string[]): Promise<void> {
  try {
    const all = await getAllPersistentSchedules();
    const existingIndex = all.findIndex((s) => s.taskId === taskId && s.occurrenceKey === occurrenceKey);
    if (existingIndex >= 0) {
      all[existingIndex] = { taskId, occurrenceKey, notificationIds };
    } else {
      all.push({ taskId, occurrenceKey, notificationIds });
    }
    setItem(STORAGE_KEYS.PERSISTENT, all);
  } catch (error) {
    console.error('Error saving persistent schedule:', error);
    throw error;
  }
}

export async function getPersistentSchedule(taskId: string, occurrenceKey: string): Promise<string[]> {
  try {
    const all = await getAllPersistentSchedules();
    const found = all.find((s) => s.taskId === taskId && s.occurrenceKey === occurrenceKey);
    return found ? found.notificationIds : [];
  } catch (error) {
    console.error('Error getting persistent schedule:', error);
    return [];
  }
}

export async function deletePersistentSchedule(taskId: string, occurrenceKey: string): Promise<void> {
  try {
    const all = await getAllPersistentSchedules();
    const filtered = all.filter((s) => !(s.taskId === taskId && s.occurrenceKey === occurrenceKey));
    setItem(STORAGE_KEYS.PERSISTENT, filtered);
  } catch (error) {
    console.error('Error deleting persistent schedule:', error);
    throw error;
  }
}

export async function getAllPersistentSchedules(): Promise<{ taskId: string; occurrenceKey: string; notificationIds: string[] }[]> {
  try {
    return getItem<{ taskId: string; occurrenceKey: string; notificationIds: string[] }[]>(STORAGE_KEYS.PERSISTENT) || [];
  } catch (error) {
    console.error('Error getting all persistent schedules:', error);
    return [];
  }
}

// Acknowledged occurrences tracking

export async function acknowledgeOccurrence(taskId: string, occurrenceKey: string): Promise<void> {
  try {
    const all = await getAcknowledgedOccurrences();
    const exists = all.find((a) => a.taskId === taskId && a.occurrenceKey === occurrenceKey);
    if (!exists) {
      all.push({ taskId, occurrenceKey });
      setItem(STORAGE_KEYS.ACKNOWLEDGED, all);
    }
  } catch (error) {
    console.error('Error acknowledging occurrence:', error);
    throw error;
  }
}

export async function isOccurrenceAcknowledged(taskId: string, occurrenceKey: string): Promise<boolean> {
  try {
    const all = await getAcknowledgedOccurrences();
    return all.some((a) => a.taskId === taskId && a.occurrenceKey === occurrenceKey);
  } catch (error) {
    console.error('Error checking acknowledged occurrence:', error);
    return false;
  }
}

export async function getAcknowledgedOccurrences(): Promise<{ taskId: string; occurrenceKey: string }[]> {
  try {
    return getItem<{ taskId: string; occurrenceKey: string }[]>(STORAGE_KEYS.ACKNOWLEDGED) || [];
  } catch (error) {
    console.error('Error getting acknowledged occurrences:', error);
    return [];
  }
}

export async function unacknowledgeOccurrence(taskId: string, occurrenceKey: string): Promise<void> {
  try {
    const all = await getAcknowledgedOccurrences();
    const filtered = all.filter((a) => !(a.taskId === taskId && a.occurrenceKey === occurrenceKey));
    setItem(STORAGE_KEYS.ACKNOWLEDGED, filtered);
  } catch (error) {
    console.error('Error unacknowledging occurrence:', error);
    throw error;
  }
}

/**
 * Clear all stored data (use with caution)
 */
export async function clearAllData(): Promise<void> {
  try {
    const { clearAll } = await import('./mmkvStorage');
    clearAll();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}
