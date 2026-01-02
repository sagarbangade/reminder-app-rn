# Medicine Reminder App

A React Native mobile application built with Expo and TypeScript for scheduling and managing medicine reminders with local notifications.

## 📥 Download

[![Download APK](https://img.shields.io/badge/Download-APK-green?style=for-the-badge&logo=android)](https://github.com/sagarbangade/reminder-app-rn/releases/latest/download/AthvanNara.apk)

**[⬇️ Download Latest APK](https://github.com/sagarbangade/reminder-app-rn/releases/latest/download/AthvanNara.apk)**

> **Note:** This is an Android APK. Enable "Install from unknown sources" in your device settings to install.

## Features

- ✅ **Create Medicine Reminders** - Add medication tasks with flexible scheduling
- ✅ **Three Scheduling Options**:
  - **Daily** - Take medicine at specified times every day
  - **Every N Days** - Take medicine every X days (e.g., every 2 days)
  - **Custom Times** - Specify multiple times during a day
- ✅ **Local Notifications** - Automatic push notifications at scheduled times
- ✅ **Persistent Storage** - Tasks saved locally using AsyncStorage
- ✅ **Edit/Delete** - Manage your medication reminders
- ✅ **Animated UI** - Smooth, engaging jelly button animations using Moti
- ✅ **Comprehensive Validation** - Form validation for times and intervals
- ✅ **Fully Typed** - Built with TypeScript for type safety

## Project Structure

```
app/
├── index.tsx                    # Main app entry point
├── navigation/
│   └── RootNavigator.tsx       # Navigation setup with Stack Navigator
├── screens/
│   ├── TaskListScreen.tsx      # Main task list view
│   ├── TaskFormScreen.tsx      # Add/edit task screen
│   └── TaskDetailScreen.tsx    # View task details (optional)
├── components/
│   ├── JellyButton.tsx         # Animated button component
│   ├── TaskCard.tsx            # Task display card
│   └── TaskForm.tsx            # Task input form with validation
├── hooks/
│   ├── useTaskStorage.ts       # Hook for task management
│   └── useNotifications.ts     # Hook for notification setup
├── utils/
│   ├── scheduleUtils.ts        # Notification scheduling logic
│   └── storageUtils.ts         # AsyncStorage utilities
└── types/
    └── Task.ts                 # TypeScript interfaces
```

## Installation

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`

### Setup

1. **Navigate to project directory:**
```bash
cd reminder-app
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the Expo development server:**
```bash
npm start
```

4. **Run on device/emulator:**
   - For iOS: Press `i` or scan QR code with iPhone Camera
   - For Android: Press `a` or scan QR code with Expo Go app
   - For Web: Press `w`

## Permissions Setup

### iOS
The app requires notification permissions. When first launched, users will see a system prompt requesting notification access. The app uses:
- Alert notifications
- Badge counts
- Sounds
- Critical alerts (if available)

### Android
The app requires `android.permission.POST_NOTIFICATIONS` (Android 13+). Expo handles this automatically. Users can grant/revoke notification permissions in device settings:
- Settings → Apps → Medicine Reminder → Notifications

## Usage Guide

### Creating a Reminder

1. **Tap the "+" button** on the main screen or in the header
2. **Enter medication name** (e.g., "Aspirin")
3. **Add details** (optional) - e.g., "Take with food, 500mg"
4. **Choose schedule type**:
   - **Daily**: Notifications at specified times every day
   - **Every N Days**: Notifications every X days
   - **Custom Times**: Different times throughout the day
5. **Specify times** in HH:MM format (e.g., "09:00", "15:30")
6. **Tap "Add Task"** to save

### Editing a Reminder

1. **Tap the pencil icon** on any task card
2. **Modify the details**
3. **Tap "Update Task"** to save changes

### Deleting a Reminder

1. **Tap the trash icon** on any task card
2. **Confirm deletion** in the alert dialog

### Viewing Task Details

- Tap on a task card to view complete details
- See all scheduled times and interval information

## Data Model

### Task Interface

```typescript
interface Task {
  id: string;                    // Unique identifier
  title: string;                 // Medication name
  details: string;               // Notes/details
  scheduleType: ScheduleType;    // 'daily' | 'alternateDays' | 'customTimes'
  timesInDay: string[];          // Array of times like ["09:00", "15:00"]
  alternateInterval: number;     // Days interval (e.g., 2 for every 2 days)
  createdAt: number;             // Timestamp when created
  lastReminderTime?: number;     // Last reminder timestamp
}
```

## Notification Scheduling

### Daily Schedule
- Schedules a notification at each specified time, repeating every 24 hours
- Example: `["09:00", "15:00"]` = notifications at 9 AM and 3 PM daily

### Alternate Days Schedule
- Schedules a notification every N days at the first specified time
- Example: `alternateInterval: 2, timesInDay: ["10:00"]` = every 2 days at 10 AM

### Custom Times Schedule
- Schedules notifications for each specified time, repeating daily
- Same as daily schedule but explicitly for custom times

## Local Storage

Tasks and notification IDs are stored in AsyncStorage:
- **TASKS_KEY**: `@medicine_reminder_tasks` - All task data
- **NOTIFICATIONS_KEY**: `@medicine_reminder_notifications` - Notification IDs for cancellation

## Development

### Running Tests

```bash
npm test
```

### Building for Production

#### iOS
```bash
eas build --platform ios
```

#### Android
```bash
eas build --platform android
```

### Debugging

1. **Enable React Native debugger:**
   - Press `Shift + m` in Expo CLI

2. **View logs:**
```bash
expo start --no-dev --minify
```

3. **Console errors:**
   - Check device console or Expo Go app logs

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: @react-navigation/native with Stack Navigator
- **Storage**: @react-native-async-storage/async-storage
- **Notifications**: expo-notifications
- **Animations**: Moti (Reanimated 2 wrapper)
- **Icons**: Expo Vector Icons (MaterialCommunityIcons)
- **State Management**: React Hooks (useState, useCallback, useEffect)

## Dependencies

### Core
- `expo`: Managed development framework
- `expo-notifications`: Local notifications
- `react`: UI library
- `react-native`: Native mobile development
- `react-navigation`: Navigation library

### Storage & Async
- `@react-native-async-storage/async-storage`: Persistent data storage

### Animations
- `moti`: Animation library powered by Reanimated
- `react-native-reanimated`: Native animation library

### UI
- `@expo/vector-icons`: Icon library
- `expo-constants`: App metadata

## Troubleshooting

### Notifications not appearing
- **iOS**: Check Settings → Notifications → Medicine Reminder → Notifications enabled
- **Android**: Check app notification settings in device settings
- Ensure permissions are granted when app first launches

### Tasks not saving
- Check AsyncStorage permissions
- Verify device has sufficient storage
- Clear app data and reinstall if needed

### Schedule not working
- Verify time format is HH:MM (24-hour)
- Ensure device time is correct
- Check system notification settings

### Build errors
- Run `npm install` to ensure all dependencies
- Clear cache: `npm start -- --clear`
- Delete `node_modules` and reinstall if persists

## Known Limitations

- Notifications require device to be on (background notifications depend on OS)
- Very precise time scheduling may vary by ±1 minute depending on device load
- App requires device notification permissions to function
- Alternate day reminders calculated from task creation time

## Future Enhancements

- [ ] Recurring notification patterns (weekly, monthly)
- [ ] Medication history and adherence tracking
- [ ] Multiple reminder sounds
- [ ] Cloud backup and sync
- [ ] Doctor/prescription integration
- [ ] Family notifications and monitoring
- [ ] Smart reminders based on device location
- [ ] Integration with health apps

## License

MIT License - Feel free to use this project for personal or commercial use.

## Support

For issues, feature requests, or contributions, please create an issue or pull request in the project repository.

---

**Version**: 1.0.0  
**Last Updated**: November 2024  
**Built with ❤️ using Expo and TypeScript**
