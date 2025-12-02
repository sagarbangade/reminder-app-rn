import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Colors, Radii } from './_styles/theme';

const AnimatedView = Animated.View;

function makeToastComponent(bgColor: string, iconName: string, iconColor?: string) {
  const Component = ({ text1 }: { text1?: string }) => {
    const translateY = useRef(new Animated.Value(-20)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;
    
    useEffect(() => {
      Animated.parallel([
        Animated.spring(translateY, { 
          toValue: 0, 
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, { 
          toValue: 1, 
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }, [translateY, opacity, scale]);

    return (
      <AnimatedView style={[styles.toastWrap, { transform: [{ translateY }, { scale }], opacity }]}> 
        <View style={[styles.toast, { backgroundColor: bgColor }]}> 
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={iconName as any} size={24} color={iconColor || '#fff'} />
          </View>
          <Text style={styles.toastText}>{text1}</Text>
        </View>
      </AnimatedView>
    );
  };
  Component.displayName = `${iconName}-toast`;
  return Component;
}

const toastConfig: any = {
  success: makeToastComponent(Colors.success, 'check-circle'),
  info: makeToastComponent(Colors.primary, 'information'),
  error: makeToastComponent(Colors.danger, 'alert-circle'),
  warning: makeToastComponent(Colors.warning, 'alert', '#FFF'),
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginHorizontal: 16,
    minWidth: 200,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  toastText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    letterSpacing: 0.2,
  },
  toastWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
});
