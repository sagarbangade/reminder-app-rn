/**
 * Main task list screen - entry point for the Medicine Reminder app
 */

import React from 'react';
import { useNotifications } from './_hooks/useNotifications';
import { TaskListScreen } from './_screens/TaskListScreen';

export default function Home() {
  // Initialize notifications
  useNotifications();

  return <TaskListScreen />;
}

