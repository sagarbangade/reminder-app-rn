/**
 * MMKV Storage - Fast, synchronous storage replacement for AsyncStorage
 * 30x faster than AsyncStorage with synchronous operations
 */

import { createMMKV } from 'react-native-mmkv';

// Initialize MMKV instance
export const storage = createMMKV({
  id: 'reminder-app-storage',
  // encryptionKey: 'your-encryption-key', // Add encryption key if needed for sensitive data
});

// Storage keys
export const STORAGE_KEYS = {
  TASKS: 'tasks',
  NOTIFICATIONS: 'notifications',
  PERSISTENT: 'persistent',
  ACKNOWLEDGED: 'acknowledged',
} as const;

/**
 * Generic get function with type safety
 */
export function getItem<T>(key: string): T | null {
  try {
    const data = storage.getString(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return null;
  }
}

/**
 * Generic set function with type safety
 */
export function setItem<T>(key: string, value: T): void {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    throw error;
  }
}

/**
 * Remove item from storage
 */
export function removeItem(key: string): void {
  try {
    storage.remove(key);
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    throw error;
  }
}

/**
 * Clear all storage (use with caution)
 */
export function clearAll(): void {
  try {
    storage.clearAll();
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
}

/**
 * Check if key exists
 */
export function hasKey(key: string): boolean {
  return storage.contains(key);
}
