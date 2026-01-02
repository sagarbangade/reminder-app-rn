/**
 * Task Context - Global state management for tasks using React Context + useReducer
 * This is a lightweight, performant solution with zero dependencies
 */

import React, { createContext, ReactNode, useCallback, useContext, useReducer } from 'react';
import type { Task } from '../_types/Task';
import { deleteTask as deleteTaskFromStorage, getAllTasks, saveTask as saveTaskToStorage } from '../_utils/storageUtils';

// State type
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

// Action types
type TaskAction =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: Task[] }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string };

// Initial state
const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
};

// Reducer
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, loading: true, error: null };
    
    case 'LOAD_SUCCESS':
      return { ...state, loading: false, tasks: action.payload, error: null };
    
    case 'LOAD_ERROR':
      return { ...state, loading: false, error: action.payload };
    
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t),
      };
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(t => t.id !== action.payload),
      };
    
    default:
      return state;
  }
}

// Context type
interface TaskContextType {
  state: TaskState;
  loadTasks: () => Promise<void>;
  addTask: (task: Task) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  fetchTaskById: (taskId: string) => Promise<Task | null>;
}

// Create context
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Provider component
export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  const loadTasks = useCallback(async () => {
    dispatch({ type: 'LOAD_START' });
    try {
      const tasks = await getAllTasks();
      dispatch({ type: 'LOAD_SUCCESS', payload: tasks });
    } catch {
      dispatch({ type: 'LOAD_ERROR', payload: 'Failed to load tasks' });
    }
  }, []);

  const addTask = useCallback(async (task: Task) => {
    try {
      await saveTaskToStorage(task);
      
      // Schedule notifications for the new task
      const { scheduleTaskNotifications } = await import('../_utils/scheduleUtils');
      const { saveNotificationSchedule } = await import('../_utils/storageUtils');
      const notificationIds = await scheduleTaskNotifications(task);
      await saveNotificationSchedule({ taskId: task.id, notificationIds });
      
      dispatch({ type: 'ADD_TASK', payload: task });
    } catch {
      throw new Error('Failed to add task');
    }
  }, []);

  const updateTask = useCallback(async (task: Task) => {
    try {
      await saveTaskToStorage(task);
      
      // Reschedule notifications for the updated task
      const { rescheduleTaskNotifications } = await import('../_utils/scheduleUtils');
      const { getNotificationSchedule, saveNotificationSchedule } = await import('../_utils/storageUtils');
      
      const oldIds = await getNotificationSchedule(task.id);
      const newIds = await rescheduleTaskNotifications(task, oldIds);
      await saveNotificationSchedule({ taskId: task.id, notificationIds: newIds });
      
      dispatch({ type: 'UPDATE_TASK', payload: task });
    } catch {
      throw new Error('Failed to update task');
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      // Cancel scheduled notifications before deleting
      const { cancelTaskNotifications } = await import('../_utils/scheduleUtils');
      const { getNotificationSchedule, deleteNotificationSchedule } = await import('../_utils/storageUtils');
      
      const notificationIds = await getNotificationSchedule(taskId);
      if (notificationIds.length > 0) {
        await cancelTaskNotifications(notificationIds);
      }
      await deleteNotificationSchedule(taskId);
      
      // Delete task from storage
      await deleteTaskFromStorage(taskId);
      dispatch({ type: 'DELETE_TASK', payload: taskId });
    } catch {
      throw new Error('Failed to delete task');
    }
  }, []);

  const fetchTaskById = useCallback(async (taskId: string): Promise<Task | null> => {
    try {
      // Check in-memory state first for better performance
      const inMemory = state.tasks.find(t => t.id === taskId);
      if (inMemory) return inMemory;
      
      // Fallback to storage if not in state
      const { getTaskById } = await import('../_utils/storageUtils');
      return await getTaskById(taskId);
    } catch {
      throw new Error('Failed to fetch task');
    }
  }, [state.tasks]);

  const value = {
    state,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    fetchTaskById,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

// Custom hook to use the context
export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}

// Convenience hooks for specific parts of state
export function useTasks() {
  const { state } = useTaskContext();
  return state.tasks;
}

export function useTasksLoading() {
  const { state } = useTaskContext();
  return state.loading;
}

export function useTaskActions() {
  const { state, loadTasks, addTask, updateTask, deleteTask, fetchTaskById } = useTaskContext();
  
  // Add saveTask as an alias for addTask/updateTask for backward compatibility
  const saveTask = useCallback(async (task: Task) => {
    // If task exists in state, update it, otherwise add it
    const exists = state.tasks.some(t => t.id === task.id);
    if (exists) {
      await updateTask(task);
    } else {
      await addTask(task);
    }
  }, [state.tasks, addTask, updateTask]);

  return { loadTasks, addTask, updateTask, deleteTask, fetchTaskById, saveTask };
}
