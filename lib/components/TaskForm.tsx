/**
 * TaskForm component for adding/editing tasks with validation
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { ScheduleType, Task } from '../types/Task';
import { isValidTimeFormat } from '../utils/scheduleUtils';
import { JellyButton } from './JellyButton';

interface TaskFormProps {
  initialTask?: Task | null;
  onSave: (task: Task) => Promise<void>;
  onCancel: () => void;
}

/**
 * TaskForm - Form for creating/editing tasks with schedule configuration
 */
export const TaskForm: React.FC<TaskFormProps> = ({ initialTask, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [timesInDay, setTimesInDay] = useState<string[]>(['09:00']);
  const [alternateInterval, setAlternateInterval] = useState('2');
  const [isSaving, setIsSaving] = useState(false);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  // Load initial task data if editing
  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDetails(initialTask.details);
      setScheduleType(initialTask.scheduleType);
      setTimesInDay(initialTask.timesInDay);
      setAlternateInterval(initialTask.alternateInterval.toString());
    }
  }, [initialTask]);

  /**
   * Validate form inputs
   */
  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a title');
      return false;
    }

    if (timesInDay.length === 0 || timesInDay.some((t) => !isValidTimeFormat(t))) {
      Alert.alert('Validation Error', 'Please enter valid times (HH:MM format)');
      return false;
    }

    if (scheduleType === 'alternateDays') {
      const interval = parseInt(alternateInterval);
      if (isNaN(interval) || interval < 1) {
        Alert.alert('Validation Error', 'Please enter a valid interval (1 or more)');
        return false;
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

      const task: Task = {
        id: initialTask?.id || Date.now().toString(),
        title: title.trim(),
        details: details.trim(),
        scheduleType,
        timesInDay,
        alternateInterval: parseInt(alternateInterval),
        createdAt: initialTask?.createdAt || Date.now(),
        lastReminderTime: initialTask?.lastReminderTime,
      };

      await onSave(task);
      setIsSaving(false);
    } catch {
      setIsSaving(false);
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };

  /**
   * Add a new time to the schedule
   */
  const addTime = () => {
    setTimesInDay([...timesInDay, '12:00']);
  };

  /**
   * Remove a time from the schedule
   */
  const removeTime = (index: number) => {
    setTimesInDay(timesInDay.filter((_, i) => i !== index));
  };

  /**
   * Update a time in the schedule
   */
  const updateTime = (index: number, value: string) => {
    const newTimes = [...timesInDay];
    newTimes[index] = value;
    setTimesInDay(newTimes);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Title Input */}
      <View style={styles.section}>
        <Text style={styles.label}>Medication Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Aspirin, Vitamin D"
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
          <Text style={styles.label}>
            {scheduleType === 'alternateDays' ? 'Notification Time *' : 'Times *'}
          </Text>
          {scheduleType !== 'alternateDays' && (
            <Pressable onPress={addTime} disabled={isSaving}>
              <Text style={styles.addTimeButton}>+ Add Time</Text>
            </Pressable>
          )}
        </View>

        {timesInDay.map((time, index) => (
          <View key={index} style={styles.timeInputRow}>
            <TextInput
              style={styles.timeInput}
              placeholder="HH:MM"
              value={time}
              onChangeText={(value) => updateTime(index, value)}
              editable={!isSaving}
              maxLength={5}
            />
            {(scheduleType !== 'alternateDays' && timesInDay.length > 1) && (
              <Pressable
                onPress={() => removeTime(index)}
                disabled={isSaving}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {/* Alternate Days Configuration */}
      {scheduleType === 'alternateDays' && (
        <View style={styles.section}>
          <Text style={styles.label}>Interval (days) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 2 (for every 2 days)"
            value={alternateInterval}
            onChangeText={setAlternateInterval}
            keyboardType="number-pad"
            editable={!isSaving}
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
    color: '#000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  multilineInput: {
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  scheduleTypeButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9F9F9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scheduleTypeButtonText: {
    fontSize: 16,
    color: '#000',
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
  timeInputRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
    alignItems: 'center',
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
    color: '#0A84FF',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 12,
  },
  saveButtonContainer: {
    flex: 0.6,
  },
});
