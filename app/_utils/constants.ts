/**
 * Constants used throughout the application
 */

export const CONSTANTS = {
  // Time constants
  HOURS_IN_DAY: 24,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  
  // UI constants
  BOTTOM_TAB_HEIGHT: 80,
  BOTTOM_TAB_PADDING: 100,
  CONTENT_BOTTOM_PADDING: 220,
  
  // Toast durations
  TOAST_DURATION_SHORT: 1500,
  TOAST_DURATION_DEFAULT: 2500,
  TOAST_DURATION_LONG: 4000,
  
  // Notification constants
  FOLLOWUP_INTERVALS: [5, 15, 30], // minutes
  
  // Validation
  MAX_TITLE_LENGTH: 100,
  MAX_DETAILS_LENGTH: 500,
  MIN_ALTERNATE_INTERVAL: 1,
  MAX_ALTERNATE_INTERVAL: 365,
} as const;

export type Constants = typeof CONSTANTS;
