/**
 * Type-safe router helpers for Expo Router
 */

import { Router } from 'expo-router';

/**
 * Type-safe navigation helper for task form
 */
export function navigateToTaskForm(router: Router, taskId?: string) {
  if (taskId) {
    router.push(`/task-form?taskId=${taskId}` as any);
  } else {
    router.push('/task-form' as any);
  }
}

/**
 * Type-safe navigation helper for task detail
 */
export function navigateToTaskDetail(router: Router, taskId: string) {
  router.push(`/task-detail?taskId=${taskId}` as any);
}

/**
 * Type-safe navigation helper for home
 */
export function navigateToHome(router: Router) {
  router.push('/' as any);
}

/**
 * Type-safe navigation helper for upcoming
 */
export function navigateToUpcoming(router: Router) {
  router.push('/upcoming' as any);
}
