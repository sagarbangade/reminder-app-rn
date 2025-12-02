import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors } from './_styles/theme';

const AnimatedView = Animated.View;

function makeToastComponent(bgColor: string, iconName: string) {
  const Component = ({ text1 }: { text1?: string }) => {
    const translateY = useRef(new Animated.Value(-12)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }, [translateY, opacity]);

    return (
      <AnimatedView style={[styles.toastWrap, { transform: [{ translateY }], opacity }]}> 
        <View style={[styles.toast, { backgroundColor: bgColor }]}> 
          <MaterialCommunityIcons name={iconName as any} size={18} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.toastText}>{text1}</Text>
        </View>
      </AnimatedView>
    );
  };
  Component.displayName = `${iconName}-toast`;
  return Component;
}

const toastConfig: any = {
  success: makeToastComponent(Colors.neon, 'sparkles'),
  info: makeToastComponent(Colors.primary, 'information-outline'),
  error: makeToastComponent(Colors.accent, 'alert-circle'),
};

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="task-form" />
        <Stack.Screen name="task-detail" />
      </Stack>
      <Toast config={toastConfig} />
    </>
  );
}

const styles = StyleSheet.create({
  toast: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  toastText: {
    color: '#fff',
    fontWeight: '700',
  },
  toastWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
});
