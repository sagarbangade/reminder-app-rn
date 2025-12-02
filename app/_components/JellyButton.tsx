/**
 * Reusable animated JellyButton component with Reanimated bounce effect
 */

import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface JellyButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * JellyButton - Animated button with jelly-like bounce effect using react-native-reanimated
 * The button squashes when pressed and bounces back with a fun effect
 */
export const JellyButton = React.forwardRef<any, JellyButtonProps>(
  ({ onPress, label, disabled = false, style, variant = 'primary' }, ref) => {
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);

    const handlePressIn = () => {
      if (!disabled) {
        scale.value = withSpring(0.92);
        rotation.value = withSpring(2);
      }
    };

    const handlePressOut = () => {
      if (!disabled) {
        scale.value = withSpring(1);
        rotation.value = withSpring(0);
      }
    };

    const handlePress = () => {
      if (!disabled) {
        onPress();
      }
    };

    const getBackgroundColor = () => {
      switch (variant) {
        case 'primary':
          return '#7C3AED';
        case 'secondary':
          return '#00D1FF';
        case 'danger':
          return '#FF6B6B';
        default:
          return '#7C3AED';
      }
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scale.value },
        { rotateZ: `${rotation.value}deg` },
      ],
    }));

    return (
      <Pressable
        ref={ref}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[styles.pressable, style]}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: disabled ? '#CCCCCC' : getBackgroundColor(),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
              elevation: 6,
            },
            animatedStyle,
          ]}
        >
          <Text style={styles.buttonText}>{label}</Text>
        </Animated.View>
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
