
import { BlurView } from 'expo-blur';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Href } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 8,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: '500',
  },
  indicator: {
    position: 'absolute',
    height: 3,
    bottom: 0,
    borderRadius: 1.5,
  },
});

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 32,
  borderRadius = 24,
  bottomMargin = 16,
}: FloatingTabBarProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const themeColors = colors[colorScheme ?? 'light'];
  const router = useRouter();
  const pathname = usePathname();

  const activeIndex = tabs.findIndex((tab) => pathname.includes(tab.name));
  const indicatorPosition = useSharedValue(activeIndex >= 0 ? activeIndex : 0);

  const handleTabPress = (route: Href, index: number) => {
    console.log('Tab pressed:', route);
    indicatorPosition.value = withSpring(index, {
      damping: 20,
      stiffness: 200,
    });
    router.push(route);
  };

  const indicatorStyle = useAnimatedStyle(() => {
    const tabWidth = containerWidth / tabs.length;
    return {
      transform: [
        {
          translateX: interpolate(
            indicatorPosition.value,
            [0, tabs.length - 1],
            [0, tabWidth * (tabs.length - 1)]
          ),
        },
      ],
      width: tabWidth,
    };
  });

  return (
    <View style={[styles.container, { bottom: bottomMargin }]}>
      <BlurView
        intensity={80}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={[
          styles.tabBar,
          {
            width: containerWidth,
            borderRadius,
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(26, 47, 26, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)',
            borderColor: themeColors.border,
          },
        ]}
      >
        {tabs.map((tab, index) => {
          const isActive = pathname.includes(tab.name);
          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabButton}
              onPress={() => handleTabPress(tab.route, index)}
            >
              <IconSymbol
                ios_icon_name={tab.icon}
                android_material_icon_name={tab.icon}
                size={24}
                color={isActive ? themeColors.primary : themeColors.textSecondary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? themeColors.primary : themeColors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
        <Animated.View
          style={[
            styles.indicator,
            indicatorStyle,
            { backgroundColor: themeColors.primary },
          ]}
        />
      </BlurView>
    </View>
  );
}
