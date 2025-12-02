/**
 * Custom hook for managing task storage and notifications
 */

import { useCallback, useEffect, useState } from 'react';
import { Task } from '../types/Task';
import {
    cancelTaskNotifications,
    rescheduleTaskNotifications,
    scheduleTaskNotifications,
} from '../utils/scheduleUtils';
import {
    deleteNotificationSchedule,
    getAllTasks,
    getNotificationSchedule,
    getTaskById,
    saveNotificationSchedule,
    saveTask as storageAddTask,
    deleteTask as storageDeleteTask,
} from '../utils/storageUtils';

export function useTaskStorage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Reload tasks from storage
   */
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const loadedTasks = await getAllTasks();
      setTasks(loadedTasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load all tasks from storage on mount
   */
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  /**
   * Add or update a task with notification scheduling
   */
  const saveTask = useCallback(
    async (task: Task) => {
      try {
        // Get old notification IDs if updating
        const oldNotificationIds = task.id ? await getNotificationSchedule(task.id) : [];

        // If updating, reschedule; if new, schedule fresh
        let newNotificationIds: string[] = [];
        if (oldNotificationIds.length > 0) {
          newNotificationIds = await rescheduleTaskNotifications(task, oldNotificationIds);
        } else {
          newNotificationIds = await scheduleTaskNotifications(task);
        }

        // Save task to storage
        await storageAddTask(task);

        // Save notification schedule
        await saveNotificationSchedule({
          taskId: task.id,
          notificationIds: newNotificationIds,
        });

        // Update local state
        const updatedTasks = tasks.some((t) => t.id === task.id)
          ? tasks.map((t) => (t.id === task.id ? task : t))
          : [...tasks, task];
        setTasks(updatedTasks);
      } catch (error) {
        console.error('Error saving task:', error);
        throw error;
      }
    },
    [tasks]
  );

  /**
   * Delete a task and cancel its notifications
   */
  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        // Get notification IDs and cancel them
        const notificationIds = await getNotificationSchedule(taskId);
        if (notificationIds.length > 0) {
          await cancelTaskNotifications(notificationIds);
        }

        // Delete from storage
        await storageDeleteTask(taskId);
        await deleteNotificationSchedule(taskId);

        // Update local state
        setTasks(tasks.filter((t) => t.id !== taskId));
      } catch (error) {
        console.error('Error deleting task:', error);
        throw error;
      }
    },
    [tasks]
  );

  /**
   * Get a single task by ID
   */
  const fetchTaskById = useCallback(async (taskId: string): Promise<Task | null> => {
    try {
      return await getTaskById(taskId);
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }, []);

  return {
    tasks,
    loading,
    saveTask,
    deleteTask,
    loadTasks,
    fetchTaskById,
  };
}
