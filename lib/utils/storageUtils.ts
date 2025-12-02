/**
 * AsyncStorage utility functions for persisting tasks and notification IDs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationSchedule, Task } from '../types/Task';

const TASKS_KEY = '@medicine_reminder_tasks';
const NOTIFICATIONS_KEY = '@medicine_reminder_notifications';

/**
 * Save a task to AsyncStorage
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

    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
}

/**
 * Get all tasks from AsyncStorage
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    const data = await AsyncStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
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
 * Delete a task from AsyncStorage
 */
export async function deleteTask(id: string): Promise<void> {
  try {
    const tasks = await getAllTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(filtered));
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

    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(schedules));
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
    const data = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
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
    await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting notification schedule:', error);
    throw error;
  }
}

/**
 * Clear all stored data (use with caution)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TASKS_KEY, NOTIFICATIONS_KEY]);
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
}
