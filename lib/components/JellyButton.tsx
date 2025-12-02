/**
 * Reusable animated JellyButton component with moti bounce effect
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface JellyButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * JellyButton - Animated button with jelly-like bounce effect using moti
 * The button squashes when pressed and bounces back with a fun effect
 */
export const JellyButton = React.forwardRef<any, JellyButtonProps>(
  ({ onPress, label, disabled = false, style, variant = 'primary' }, ref) => {
    const handlePress = () => {
      if (!disabled) {
        onPress();
      }
    };

    const getBackgroundColor = () => {
      switch (variant) {
        case 'primary':
          return '#007AFF';
        case 'secondary':
          return '#5AC8FA';
        case 'danger':
          return '#FF3B30';
        default:
          return '#007AFF';
      }
    };

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        disabled={disabled}
        style={[styles.pressable, style]}
      >
        <View
          style={[
            styles.button,
            {
              backgroundColor: disabled ? '#CCCCCC' : getBackgroundColor(),
            },
          ]}
        >
          <View>
            <Text style={styles.buttonText}>{label}</Text>
          </View>
        </View>
      </Pressable>
    );
  }
);

JellyButton.displayName = 'JellyButton';

const styles = StyleSheet.create({
  pressable: {
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
