/**
 * ConfirmDialog - A custom confirmation dialog component
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors, Radii } from '../_styles/theme';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'danger',
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'danger':
        return { icon: 'alert-circle', color: Colors.danger };
      case 'warning':
        return { icon: 'alert', color: Colors.warning };
      case 'info':
        return { icon: 'information', color: Colors.primary };
      default:
        return { icon: 'help-circle', color: Colors.primary };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: color + '20' }]}>
              <MaterialCommunityIcons name={icon as any} size={40} color={color} />
            </View>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              accessibilityRole="button"
              accessibilityLabel={cancelText}
              accessibilityHint="Cancels this action"
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.confirmButton, { backgroundColor: color }]}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel={confirmText}
              accessibilityHint="Confirms this action"
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: Colors.card,
    borderRadius: Radii.lg,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.bgLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});
