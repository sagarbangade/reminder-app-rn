/**
 * TaskForm component for adding/editing tasks with validation
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors, Radii } from '../_styles/theme';
import { ScheduleType, Task } from '../_types/Task';
import { isValidTimeFormat } from '../_utils/scheduleUtils';
import { showErrorToast } from '../_utils/toastUtils';
import { JellyButton } from './JellyButton';
import { NotificationCalendar } from './NotificationCalendar';

interface TaskFormProps {
  initialTask?: Task | null;
  onSave: (task: Task) => Promise<void>;
  onCancel: () => void;
}

interface WebDatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  disabled?: boolean;
  index: number;
}

const WebDatePicker: React.FC<WebDatePickerProps> = ({
  value,
  onChange,
  disabled,
  index,
}) => {
  if (Platform.OS === 'web') {
    const dateString = value 
      ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
      : '';

    return (
      <View style={webDatePickerStyles.webContainer}>
        <input
          type="date"
          value={dateString}
          onChange={(e: any) => {
            if (e.target.value) {
              const [year, month, day] = e.target.value.split('-');
              onChange(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
            }
          }}
          disabled={disabled}
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #E0E0E0',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
            width: '100%',
            maxWidth: '200px',
            boxSizing: 'border-box',
          } as any}
        />
      </View>
    );
  }

  return (
    <>
      <Pressable
        onPress={() => !disabled}
        disabled={disabled}
        style={webDatePickerStyles.selectButton}
      >
        <Text style={webDatePickerStyles.selectText}>
          {value ? value.toLocaleDateString() : 'Select date'}
        </Text>
      </Pressable>
      {Platform.OS === 'ios' ? (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="spinner"
          onChange={(e, date) => {
            if (date) onChange(date);
          }}
        />
      ) : (
        <DateTimePicker
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={(e, date) => {
            if (date) onChange(date);
          }}
        />
      )}
    </>
  );
};

const webDatePickerStyles = StyleSheet.create({
  webContainer: {
    flex: 1,
    maxWidth: 200,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
});

/**
 * TaskForm - Form for creating/editing tasks with schedule configuration
 */
export const TaskForm: React.FC<TaskFormProps> = ({ initialTask, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  // timesInDay stores internal 24-hour times (HH:MM). uiTimes + meridiems are for user editing.
  const [timesInDay, setTimesInDay] = useState<string[]>(['09:00']);
  const [uiTimes, setUiTimes] = useState<string[]>(['9:00']);
  const [meridiems, setMeridiems] = useState<string[]>(['AM']);
  // For customTimes: optional per-entry selected dates
  const [customDates, setCustomDates] = useState<(Date | null)[]>([null]);
  const [alternateInterval, setAlternateInterval] = useState('2');
  // For alternateDays: start date for N-day calculation
  // Initialize to noon to avoid timezone issues
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // Load initial task data if editing
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDetails(initialTask.details);
      setScheduleType(initialTask.scheduleType);
      setTimesInDay(initialTask.timesInDay);
      // convert stored 24-hour times to uiTimes + meridiems
      const uiT: string[] = [];
      const mer: string[] = [];
      for (const t of initialTask.timesInDay) {
        const [hhS, mmS] = t.split(':');
        const hh = parseInt(hhS, 10);
        const mm = mmS;
        const isPM = hh >= 12;
        let displayHour = hh % 12;
        if (displayHour === 0) displayHour = 12;
        uiT.push(`${displayHour}:${mm}`);
        mer.push(isPM ? 'PM' : 'AM');
      }
      setUiTimes(uiT);
      setMeridiems(mer);
      // load custom dates if present
      if (initialTask.customDateTimes && initialTask.customDateTimes.length) {
        const dates = initialTask.customDateTimes.map((d) => {
          try {
            return new Date(d);
          } catch {
            return null;
          }
        });
        setCustomDates(dates);
      } else {
        setCustomDates(uiT.map(() => null));
      }
      setAlternateInterval(initialTask.alternateInterval.toString());
      // Load startDate if present, otherwise use createdAt or current date
      if (initialTask.startDate) {
        // Normalize to noon to avoid timezone issues
        const d = new Date(initialTask.startDate);
        d.setHours(12, 0, 0, 0);
        setStartDate(d);
      } else if (initialTask.createdAt) {
        setStartDate(new Date(initialTask.createdAt));
      }
    }
  }, [initialTask]);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    if (!title.trim()) {
      showErrorToast('Please enter a title');
      return false;
    }

    // validate uiTimes + meridiems by converting to 24-hour then validating
    if (uiTimes.length === 0) {
      showErrorToast('Please enter at least one time');
      return false;
    }
    const converted = uiTimes.map((t, i) => {
      const m = meridiems[i] || 'AM';
      return convertTo24Hour(t.trim(), m);
    });
    if (converted.some((ct) => !isValidTimeFormat(ct))) {
      showErrorToast('Please enter valid times (HH:MM format)');
      return false;
    }

    if (scheduleType === 'alternateDays') {
      const interval = parseInt(alternateInterval);
      if (isNaN(interval) || interval < 1) {
        showErrorToast('Please enter a valid interval (1 or more)');
        return false;
      }
    }

    if (scheduleType === 'customTimes') {
      // ensure each custom entry has a selected date
      if (!customDates || customDates.length !== uiTimes.length || customDates.some((d) => !d)) {
        showErrorToast('Please select a date for each custom time');
        return false;
      }
      // ensure dates are in the future
      const now = new Date();
      for (let i = 0; i < customDates.length; i++) {
        const d = customDates[i];
        if (!d) continue;
        // combine date + time to check
        const [hh, mm] = convertTo24Hour(uiTimes[i], meridiems[i] || 'AM').split(':').map((v) => parseInt(v, 10));
        const dt = new Date(d);
        dt.setHours(hh, mm, 0, 0);
        if (dt <= now) {
          showErrorToast('Custom date/time must be in the future');
          return false;
        }
      }
    }

    return true;
  };

  /**
   * Handle form submission
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);

      // convert uiTimes + meridiems into 24-hour times
      const convertedTimes = uiTimes.map((t, i) => convertTo24Hour(t.trim(), meridiems[i] || 'AM'));
        // build task object
      const task: Task = {
        id: initialTask?.id || Date.now().toString(),
        title: title.trim(),
        details: details.trim(),
        scheduleType,
        timesInDay: convertedTimes,
        alternateInterval: parseInt(alternateInterval),
        startDate: scheduleType === 'alternateDays' ? startDate.getTime() : undefined,
        customDateTimes: scheduleType === 'customTimes' ? uiTimes.map((t, i) => {
          const date = customDates[i] ? new Date(customDates[i] as Date) : new Date();
          const [hh, mm] = convertTo24Hour(t.trim(), meridiems[i] || 'AM').split(':').map((v) => parseInt(v, 10));
          date.setHours(hh, mm, 0, 0);
          return date.toISOString();
        }) : undefined,
        createdAt: initialTask?.createdAt || Date.now(),
        lastReminderTime: initialTask?.lastReminderTime,
      };

      await onSave(task);
      setIsSaving(false);
    } catch {
      setIsSaving(false);
      showErrorToast('Failed to save task. Please try again');
    }
  };

  /**
   * Add a new time to the schedule
   */
  const addTime = () => {
    setTimesInDay([...timesInDay, '12:00']);
    setUiTimes([...uiTimes, '12:00']);
    setMeridiems([...meridiems, 'PM']);
    setCustomDates([...customDates, null]);
  };

  /**
   * Remove a time from the schedule
   */
  const removeTime = (index: number) => {
    setTimesInDay(timesInDay.filter((_, i) => i !== index));
    setUiTimes(uiTimes.filter((_, i) => i !== index));
    setMeridiems(meridiems.filter((_, i) => i !== index));
    setCustomDates(customDates.filter((_, i) => i !== index));
  };

  /**
   * Update a time in the schedule
   */
  const updateTime = (index: number, value: string) => {
    const newUi = [...uiTimes];
    newUi[index] = value;
    setUiTimes(newUi);
  };

  const toggleMeridiem = (index: number) => {
    const newMer = [...meridiems];
    newMer[index] = newMer[index] === 'AM' ? 'PM' : 'AM';
    setMeridiems(newMer);
  };

  // helper to convert 12-hour UI time + meridiem to 24-hour string 'HH:MM'
  const convertTo24Hour = (time12: string, meridiem: string) => {
    const parts = time12.split(':');
    let h = parseInt(parts[0], 10);
    const m = parts[1] ? parts[1].padStart(2, '0') : '00';
    if (isNaN(h)) h = 0;
    if (meridiem === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h = h + 12;
    }
    const hh = h.toString().padStart(2, '0');
    return `${hh}:${m}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Morning walk, Take vitamins"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
          editable={!isSaving}
        />
      </View>

      {/* Details Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Details/Notes</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g., Take with food, 500mg"
          placeholderTextColor="#999"
          value={details}
          onChangeText={setDetails}
          multiline
          numberOfLines={3}
          editable={!isSaving}
        />
      </View>

      {/* Schedule Type Picker */}
      <View style={styles.section}>
        <Text style={styles.label}>Schedule Type *</Text>
        <Pressable
          style={styles.scheduleTypeButton}
          onPress={() => setShowSchedulePicker(true)}
          disabled={isSaving}
        >
          <Text style={styles.scheduleTypeButtonText}>
            {scheduleType === 'daily'
              ? 'Daily'
              : scheduleType === 'alternateDays'
              ? 'Every N Days'
              : 'Custom Times'}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={24} color="#0A84FF" />
        </Pressable>

        {/* Schedule Type Modal */}
        <Modal
          visible={showSchedulePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSchedulePicker(false)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setShowSchedulePicker(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Schedule Type</Text>
              {(['daily', 'alternateDays', 'customTimes'] as ScheduleType[]).map((type) => (
                <Pressable
                  key={type}
                  style={[
                    styles.modalOption,
                    scheduleType === type && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setScheduleType(type);
                    setShowSchedulePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      scheduleType === type && styles.modalOptionTextSelected,
                    ]}
                  >
                    {type === 'daily'
                      ? 'Daily'
                      : type === 'alternateDays'
                      ? 'Every N Days'
                      : 'Custom Times'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>

      {/* Times Configuration */}
      <View style={styles.section}>
        <View style={styles.timesHeader}>
          <Text style={styles.label}>Times *</Text>
          <Pressable onPress={addTime} disabled={isSaving}>
            <Text style={styles.addTimeButton}>+ Add Time</Text>
          </Pressable>
        </View>

        {uiTimes.map((uiTime, index) => (
          <View key={index} style={styles.timeEntryContainer}>
            <View style={styles.timeInputRow}>
              <TextInput
                style={styles.timeInput}
                placeholder="HH:MM"
                placeholderTextColor="#999"
                value={uiTime}
                onChangeText={(value) => updateTime(index, value)}
                editable={!isSaving}
                maxLength={5}
              />
              <Pressable
                style={[styles.meridiemButton, meridiems[index] === 'AM' && styles.meridiemButtonAM]}
                onPress={() => toggleMeridiem(index)}
                disabled={isSaving}
              >
                <Text style={styles.meridiemButtonText}>{meridiems[index]}</Text>
              </Pressable>
              {uiTimes.length > 1 && (
                <Pressable
                  onPress={() => removeTime(index)}
                  disabled={isSaving}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              )}
            </View>
            {scheduleType === 'customTimes' && (
              <View style={styles.datePickerRow}>
                <Text style={styles.dateLabel}>Date:</Text>
                <WebDatePicker
                  value={customDates[index]}
                  onChange={(date) => {
                    const newDates = [...customDates];
                    newDates[index] = date;
                    setCustomDates(newDates);
                  }}
                  disabled={isSaving}
                  index={index}
                />
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Alternate Days Configuration */}
      {scheduleType === 'alternateDays' && (
        <>
          <View style={styles.section}>
            <Text style={styles.label}>Interval (days) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2 (for every 2 days)"
              placeholderTextColor="#999"
              value={alternateInterval}
              onChangeText={setAlternateInterval}
              keyboardType="number-pad"
              editable={!isSaving}
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.label}>Start Date</Text>
            <Text style={styles.helperText}>The N-day interval will be calculated from this date</Text>
            {Platform.OS === 'web' ? (
              <View style={webDatePickerStyles.webContainer}>
                <input
                  type="date"
                  value={`${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`}
                  onChange={(e: any) => {
                    if (e.target.value) {
                      const [year, month, day] = e.target.value.split('-');
                      // Normalize to noon to avoid timezone issues
                      const normalized = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0, 0);
                      setStartDate(normalized);
                    }
                  }}
                  disabled={isSaving}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    opacity: isSaving ? 0.6 : 1,
                    width: '100%',
                    maxWidth: '200px',
                    boxSizing: 'border-box',
                  } as any}
                />
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => setShowStartDatePicker(true)}
                  disabled={isSaving}
                  style={styles.scheduleTypeButton}
                >
                  <Text style={styles.scheduleTypeButtonText}>
                    {startDate.toLocaleDateString()}
                  </Text>
                  <MaterialCommunityIcons name="calendar" size={20} color="#0A84FF" />
                </Pressable>
                {showStartDatePicker && (
                  <Modal
                    visible={showStartDatePicker}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowStartDatePicker(false)}
                  >
                    <View style={styles.datePickerModal}>
                      <View style={styles.datePickerContainer}>
                        <View style={styles.datePickerHeader}>
                          <Pressable onPress={() => setShowStartDatePicker(false)}>
                            <Text style={styles.datePickerCancel}>Cancel</Text>
                          </Pressable>
                          <Pressable onPress={() => setShowStartDatePicker(false)}>
                            <Text style={styles.datePickerDone}>Done</Text>
                          </Pressable>
                        </View>
                        <DateTimePicker
                          value={startDate}
                          mode="date"
                          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                          onChange={(e, date) => {
                            if (Platform.OS !== 'ios') {
                              setShowStartDatePicker(false);
                            }
                            if (date) {
                              // Normalize to noon local time to avoid timezone issues
                              const normalized = new Date(date);
                              normalized.setHours(12, 0, 0, 0);
                              setStartDate(normalized);
                            }
                          }}
                        />
                      </View>
                    </View>
                  </Modal>
                )}
              </>
            )}
          </View>
        </>
      )}

        {/* Calendar Preview */}
        {title.trim() && (
          <View style={styles.section}>
            <Text style={styles.label}>Notification Schedule Preview</Text>
            <NotificationCalendar
              task={{
                id: initialTask?.id || 'preview',
                title: title.trim(),
                details: details.trim(),
                scheduleType,
                timesInDay: uiTimes.map((t, i) => convertTo24Hour(t.trim(), meridiems[i] || 'AM')),
                customDateTimes: scheduleType === 'customTimes' ? uiTimes.map((t, i) => {
                  const date = customDates[i] ? new Date(customDates[i] as Date) : new Date();
                  const [hh, mm] = convertTo24Hour(t.trim(), meridiems[i] || 'AM').split(':').map((v) => parseInt(v, 10));
                  date.setHours(hh, mm, 0, 0);
                  return date.toISOString();
                }) : undefined,
                alternateInterval: parseInt(alternateInterval) || 1,
                startDate: scheduleType === 'alternateDays' ? startDate.getTime() : undefined,
                createdAt: initialTask?.createdAt || Date.now(),
                lastReminderTime: initialTask?.lastReminderTime,
              }}
            />
          </View>
        )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable style={styles.cancelButtonContainer} onPress={onCancel} disabled={isSaving}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <View style={styles.saveButtonContainer}>
          <JellyButton
            label={isSaving ? 'Saving...' : initialTask ? 'Update Task' : 'Add Task'}
            onPress={handleSave}
            disabled={isSaving}
            variant="primary"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: -4,
  },
  input: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: Radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  multilineInput: {
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  scheduleTypeButton: {
    borderWidth: 0,
    borderRadius: Radii.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTypeButtonText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingVertical: 8,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalOptionSelected: {
    backgroundColor: '#E8F4FF',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#666',
  },
  modalOptionTextSelected: {
    color: '#0A84FF',
    fontWeight: '600',
  },
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addTimeButton: {
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 14,
  },
  timeEntryContainer: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  timeInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    minWidth: 45,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  selectDateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderWidth: 0,
    borderRadius: Radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 110,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  selectDateText: {
    color: Colors.textPrimary,
    fontSize: 14,
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#666',
  },
  datePickerDone: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  datePicker: {
    height: 200,
  },
  meridiemButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.neon,
    borderRadius: 10,
    minWidth: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meridiemButtonAM: {
    backgroundColor: Colors.primary,
  },
  meridiemButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  cancelButtonContainer: {
    flex: 0.4,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 12,
  },
  saveButtonContainer: {
    flex: 0.6,
  },
});
