/**
 * NotificationCalendar - Displays a calendar highlighting notification days and times
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Task } from '../_types/Task';

interface NotificationCalendarProps {
  task: Task;
}

/**
 * Generate marked dates for the calendar based on task schedule
 */
const generateMarkedDates = (task: Task): Record<string, any> => {
  const marked: Record<string, any> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generate notifications for the next 90 days
  const horizon = 90;

  // Helper for color per time index
  const timeColors = ['#FF3B30', '#FF9500', '#FFD60A', '#34C759', '#0A84FF'];
  const getColorForIndex = (i: number) => timeColors[i % timeColors.length];

  if (task.scheduleType === 'daily') {
    // Mark every day for the next 90 days with dots for each time
    for (let i = 0; i < horizon; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dots = task.timesInDay.map((_, idx) => ({ key: `t${idx}`, color: getColorForIndex(idx) }));
      marked[dateStr] = { dots };
    }
  } else if (task.scheduleType === 'alternateDays') {
    // Mark every N days starting from today, showing dots for each configured time
    const interval = Math.max(1, task.alternateInterval || 1);
    for (let i = 0; i < horizon; i += interval) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dots = task.timesInDay.map((_, idx) => ({ key: `t${idx}`, color: getColorForIndex(idx) }));
      marked[dateStr] = { dots };
    }
  } else if (task.scheduleType === 'customTimes') {
    // If explicit customDateTimes provided, mark those exact dates
    if (task.customDateTimes && task.customDateTimes.length > 0) {
      task.customDateTimes.forEach((dtIso, idx) => {
        try {
          const d = new Date(dtIso);
          const dateStr = d.toISOString().split('T')[0];
          if (!marked[dateStr]) marked[dateStr] = { dots: [] };
          // push dot for this time index
          const dots = marked[dateStr].dots as any[];
          dots.push({ key: `t${idx}`, color: getColorForIndex(idx) });
        } catch {
          // ignore parse errors
        }
      });
    } else {
      // Fallback: mark today with dots for each time
      const dateStr = today.toISOString().split('T')[0];
      const dots = task.timesInDay.map((_, idx) => ({ key: `t${idx}`, color: getColorForIndex(idx) }));
      marked[dateStr] = { dots };
    }
  }

  return marked;
};

/**
 * NotificationCalendar component
 */
export const NotificationCalendar: React.FC<NotificationCalendarProps> = ({ task }) => {
  const markedDates = useMemo(() => generateMarkedDates(task), [task]);
  const today = new Date().toISOString().split('T')[0];

  const getScheduleDescription = (): string => {
    if (task.scheduleType === 'daily') {
      return `Daily at ${task.timesInDay.join(', ')}`;
    } else if (task.scheduleType === 'alternateDays') {
      return `Every ${task.alternateInterval} days at ${task.timesInDay.join(', ')}`;
    } else {
      return `Custom times: ${task.timesInDay.join(', ')}`;
    }
  };

  const getColorIndicator = (): string => {
    if (task.scheduleType === 'daily') return '#0A84FF';
    if (task.scheduleType === 'alternateDays') return '#34C759';
    return '#FF9500';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.colorDot,
            { backgroundColor: getColorIndicator() },
          ]}
        />
        <Text style={styles.scheduleText}>{getScheduleDescription()}</Text>
      </View>

      <Calendar
        current={today}
        markedDates={markedDates}
        markingType="multi-dot"
        theme={calendarTheme}
        hideExtraDays={false}
      />

      <View style={styles.legend}>
        {task.timesInDay && task.timesInDay.length > 1 ? (
          task.timesInDay.map((time, idx) => (
            <View key={idx} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: ['#FF3B30', '#FF9500', '#FFD60A', '#34C759', '#0A84FF'][idx % 5] }]} />
              <Text style={styles.legendText}>{time}</Text>
            </View>
          ))
        ) : (
          <>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#0A84FF' }]} />
              <Text style={styles.legendText}>Daily</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#34C759' }]} />
              <Text style={styles.legendText}>Alternate Days</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
              <Text style={styles.legendText}>Custom</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const calendarTheme = {
  backgroundColor: '#FFF',
  calendarBackground: '#FFF',
  textSectionTitleColor: '#6B7280',
  textSectionTitleDisabledColor: '#CCC',
  selectedDayBackgroundColor: '#7C3AED',
  selectedDayTextColor: '#FFF',
  todayTextColor: '#7C3AED',
  todayBackgroundColor: 'transparent',
  todayBorderColor: '#7C3AED',
  dayTextColor: '#0F172A',
  textDisabledColor: '#CCC',
  dotColor: '#7C3AED',
  selectedDotColor: '#FFF',
  arrowColor: '#7C3AED',
  disabledArrowColor: '#CCC',
  monthTextColor: '#0F172A',
  indicatorColor: '#7C3AED',
  weekVerticalMargin: 8,
  'stylesheet.calendar.header': {
    week: {
      marginTop: 7,
      marginBottom: 7,
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
  },
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  scheduleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
