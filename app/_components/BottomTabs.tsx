import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Radii } from '../_styles/theme';
import { navigateToHome, navigateToTaskForm, navigateToUpcoming } from '../_utils/navigationHelpers';

export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = [
    { label: 'All Tasks', icon: 'format-list-bulleted', route: '/', key: 'all' },
    { label: 'Upcoming', icon: 'clock-time-four-outline', route: '/upcoming', key: 'upcoming' },
    { label: 'Add New', icon: 'plus-circle', route: '/task-form', key: 'add' },
  ];

  const TabItem: React.FC<{ tab: typeof tabs[0]; isActive: boolean }> = ({ tab, isActive }) => {
    const scale = useSharedValue(isActive ? 1.05 : 1);
    const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: withTiming(scale.value, { duration: 160 }) }] }));
    
    return (
      <Pressable
        key={tab.key}
        style={[styles.tabButton, isActive && styles.tabButtonActive]}
        onPress={() => {
          if (tab.key === 'all') navigateToHome(router);
          else if (tab.key === 'upcoming') navigateToUpcoming(router);
          else if (tab.key === 'add') navigateToTaskForm(router);
        }}
        accessibilityRole="button"
        accessibilityLabel={tab.label}
        accessibilityHint={`Navigate to ${tab.label} screen`}
        onPressIn={() => { scale.value = 0.94; }}
        onPressOut={() => { scale.value = isActive ? 1.05 : 1; }}
      >
        {tab.key === 'add' ? (
          <Animated.View style={[styles.addPill, isActive && styles.activePill, iconStyle]}>
            <MaterialCommunityIcons name={tab.icon as any} size={24} color="#FFF" />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <MaterialCommunityIcons 
              name={tab.icon as any} 
              size={24} 
              color={isActive ? Colors.primary : Colors.textMuted} 
            />
          </Animated.View>
        )}
        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.bottomTabs}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route || (tab.route === '/' && pathname === '/index');
        return <TabItem key={tab.key} tab={tab} isActive={isActive} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabs: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: Radii.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    minWidth: 80,
  },
  tabButtonActive: {
    backgroundColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  addPill: {
    backgroundColor: Colors.neon,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  activePill: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
  },
  iconWrap: { 
    alignItems: 'center', 
    justifyContent: 'center',
    width: 44,
    height: 44,
  },
});
