import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Colors, Radii } from '../_styles/theme';

export function BottomTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const tabs = [
    { label: 'All', icon: 'view-list', route: '/', key: 'all' },
    { label: 'Upcoming', icon: 'clock-outline', route: '/upcoming', key: 'upcoming' },
    { label: 'Add', icon: 'plus', route: '/task-form', key: 'add' },
  ];

  const TabItem: React.FC<{ tab: typeof tabs[0]; isActive: boolean }> = ({ tab, isActive }) => {
    const scale = useSharedValue(isActive ? 1.05 : 1);
    const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: withTiming(scale.value, { duration: 160 }) }] }));
    return (
      <Pressable
        key={tab.key}
        style={styles.tabButton}
        onPress={() => (router.push as any)(tab.route)}
        onPressIn={() => { scale.value = 0.96; }}
        onPressOut={() => { scale.value = isActive ? 1.05 : 1; }}
      >
        {tab.key === 'add' ? (
          <Animated.View style={[styles.addPill, isActive && styles.activePill, iconStyle]}>
            <MaterialCommunityIcons name={tab.icon as any} size={18} color="#FFF" />
          </Animated.View>
        ) : (
          <Animated.View style={[styles.iconWrap, iconStyle]}>
            <MaterialCommunityIcons name={tab.icon as any} size={20} color={isActive ? Colors.neon : Colors.textMuted} />
            {isActive && <View style={styles.activeDot} />}
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
    paddingVertical: 12,
    borderRadius: Radii.lg,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 6,
    fontWeight: '700',
  },
  tabTextActive: {
    color: Colors.neon,
  },
  addPill: {
    backgroundColor: Colors.neon,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.neon,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  activePill: {
    backgroundColor: Colors.primary,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.neon, marginTop: 6 },
});
