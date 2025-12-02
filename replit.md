# Medicine Reminder App - Replit Setup

## Project Overview

This is a React Native mobile application built with Expo and TypeScript for scheduling and managing medicine reminders with local notifications. The app has been configured to run on Replit's web environment using Expo's web target.

**Version**: 1.0.0  
**Framework**: React Native with Expo (~54.0.25)  
**Language**: TypeScript  
**Primary Target**: Web (also supports iOS/Android via Expo Go)

## Purpose

A smart reminder application that helps users stay on track with medication schedules. Features include:
- Create medicine reminders with flexible scheduling options
- Three scheduling modes: Daily, Every N Days, and Custom Times
- Local push notifications at scheduled times
- Persistent storage using AsyncStorage
- Edit and delete reminders
- Animated UI with smooth transitions

## Current State

✅ **Fully Configured for Replit**
- Development server running on port 5000 (required for Replit webview)
- Metro bundler configured for web platform
- Expo Router for file-based routing
- All dependencies installed and working
- Deployment configured for static export

## Recent Changes

### December 2, 2025 - Delete Functionality Fix (FINAL)
- **Root Cause**: React Native's `Alert.alert()` component doesn't properly handle button callbacks on web platforms
- **Solution**: 
  1. Fixed useTaskStorage deleteTask with functional setState and empty dependency array
  2. Replaced `Alert.alert()` with `window.confirm()` in task-detail.tsx for web compatibility
- Delete buttons now properly remove reminders from the app on all screens

### December 2, 2025 - Web Date Picker Implementation  
- Implemented fully functional date picker for "Custom Times" schedule type
- Created WebDatePicker component with platform-specific rendering:
  - **Web**: Uses native HTML `<input type="date">` for optimal UX
  - **iOS/Android**: Uses @react-native-community/datetimepicker
- Removed react-native-modal-datetime-picker (no web support)
- Date selection now works seamlessly on web with native browser date picker
- Dates are properly formatted and stored

### December 2, 2025 - Initial Replit Setup
- Configured Expo to run web server on port 5000 using `RCT_METRO_PORT` environment variable
- Set up metro.config.js to respect PORT environment variable
- Configured app.json with metro bundler for web
- Created workflow "Expo Web Dev Server" for development
- Set up deployment configuration for static web build
- Added build script for production deployment

## Project Architecture

### Technology Stack
- **Framework**: React Native 0.81.5 + Expo SDK 54
- **Routing**: Expo Router 6.0 (file-based routing)
- **State Management**: React Hooks
- **Storage**: AsyncStorage (@react-native-async-storage/async-storage)
- **Notifications**: expo-notifications
- **Animations**: react-native-reanimated 4.1 + lottie-react-native
- **UI Components**: react-native-paper, react-native-calendars
- **Navigation**: @react-navigation/native with bottom tabs
- **Toast Notifications**: react-native-toast-message

### File Structure
```
app/
├── _components/       # Reusable UI components (not routes)
│   ├── BottomTabs.tsx
│   ├── JellyButton.tsx
│   ├── NotificationCalendar.tsx
│   ├── TaskCard.tsx
│   └── TaskForm.tsx
├── _hooks/           # Custom React hooks
│   ├── useNotifications.ts
│   └── useTaskStorage.ts
├── _navigation/      # Navigation components
│   └── RootNavigator.tsx
├── _screens/         # Screen components
│   ├── TaskDetailScreen.tsx
│   ├── TaskFormScreen.tsx
│   └── TaskListScreen.tsx
├── _styles/          # Theme and styling
│   └── theme.ts
├── _types/           # TypeScript type definitions
│   └── Task.ts
├── _utils/           # Utility functions
│   ├── scheduleUtils.ts
│   ├── storageUtils.ts
│   └── toastUtils.ts
├── _layout.tsx       # Root layout with Stack navigation
├── index.tsx         # Main entry/home screen
├── task-detail.tsx   # Task detail route
├── task-form.tsx     # Task form route
└── upcoming.tsx      # Upcoming tasks route
```

**Note**: Files/folders prefixed with `_` are not treated as routes by Expo Router.

### Key Dependencies
- `expo`: ~54.0.25 - Development framework
- `expo-router`: ~6.0.15 - File-based routing
- `expo-notifications`: ~0.32.13 - Local notifications
- `react-native`: 0.81.5 - Mobile framework
- `react-native-web`: ~0.21.0 - Web support
- `@react-navigation/*`: Navigation libraries
- `react-native-reanimated`: ~4.1.1 - Animations

## Development Workflow

### Running the Development Server
The app runs automatically via the "Expo Web Dev Server" workflow. To manually start:
```bash
npm run dev
```

The server will start on port 5000 and bundle the app for web using Metro bundler.

### Building for Production
```bash
npm run build
```

This exports a static build to the `dist/` directory suitable for deployment.

### Available Scripts
- `npm run dev` - Start development server on port 5000 (Replit-configured)
- `npm run web` - Start standard Expo web server
- `npm start` - Start Expo dev server (mobile/web selector)
- `npm run android` - Start for Android (requires Expo Go app)
- `npm run ios` - Start for iOS (requires Expo Go app)
- `npm run build` - Build static web export
- `npm run lint` - Run ESLint

## Replit-Specific Configuration

### Port Configuration
- **Port 5000**: Required for Replit webview
- Set via `RCT_METRO_PORT=5000` and `--port 5000` flags
- Metro config respects PORT environment variable

### Metro Configuration (metro.config.js)
```javascript
config.server = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 8081,
};
```

### App Configuration (app.json)
- `web.bundler`: "metro" - Uses Metro instead of Webpack
- `web.output`: "static" - Generates static build for deployment
- `experiments.reactCompiler`: true - Uses new React compiler

### Deployment
- **Target**: Static site
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Deployment Type**: Static export from Expo

## Known Limitations

### Web-Specific
- Push notifications limited on web (expo-notifications shows warning)
- Some native features (haptics, etc.) don't work on web
- Notification scheduling may not work same as mobile

### Development Warnings
The following warnings in console are expected and don't affect functionality:
- Routes with `_` prefix showing "missing default export" - these are intentionally not routes
- "shadow*" style props deprecated - legacy styling from original code
- "[expo-notifications] not fully supported on web" - expected for web platform

## User Preferences

None configured yet.

## Data Model

### Task Interface
```typescript
interface Task {
  id: string;              // Unique identifier
  title: string;           // Medication name
  details: string;         // Notes/instructions
  scheduleType: ScheduleType; // 'daily' | 'alternateDays' | 'customTimes'
  timesInDay: string[];    // Array of times ["09:00", "15:00"]
  alternateInterval: number; // Days interval (for alternateDays)
  createdAt: number;       // Creation timestamp
  lastReminderTime?: number; // Last notification timestamp
}
```

### Storage
- **Storage Key**: `@medicine_reminder_tasks`
- **Notifications Key**: `@medicine_reminder_notifications`
- **Storage Type**: AsyncStorage (browser localStorage on web)

## Troubleshooting

### Server Won't Start
- Check that port 5000 is not in use
- Verify workflow is configured correctly
- Check console logs for Metro bundler errors

### Build Errors
- Run `npm install` to ensure dependencies are current
- Clear cache: `rm -rf .expo node_modules && npm install`
- Check that `dist/` folder exists and is in .gitignore

### App Not Loading
- Ensure workflow "Expo Web Dev Server" is running
- Check browser console for JavaScript errors
- Verify Metro bundling completed (check workflow logs)

## Future Enhancements

Potential improvements from original README:
- [ ] Recurring notification patterns (weekly, monthly)
- [ ] Medication history and adherence tracking
- [ ] Multiple reminder sounds
- [ ] Cloud backup and sync
- [ ] Doctor/prescription integration
- [ ] Family notifications and monitoring
- [ ] Integration with health apps
