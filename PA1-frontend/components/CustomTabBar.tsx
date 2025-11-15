import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors } from "../constants/colors";
import { shadows } from "../constants/shadows";
// Icons
import SearchIcon from "@/assets/icons/search.svg";
import SearchIconFilled from "@/assets/icons/search-filled.svg";
import ClubsIcon from "@/assets/icons/clubs.svg";
import ClubsIconFilled from "@/assets/icons/clubs-filled.svg";
import SpacesIcon from "@/assets/icons/building.svg";
import SpacesIconFilled from "@/assets/icons/building-filled.svg";
import CompassIcon from "@/assets/icons/compass.svg";
import CompassIconFilled from "@/assets/icons/compass-filled.svg";
import ProfileIcon from "@/assets/icons/user.svg";
import ProfileIconFilled from "@/assets/icons/user-filled.svg";
import PlusIcon from "@/assets/icons/plus.svg";

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  
  // Filter out the index route
  const filteredRoutes = state.routes.filter(route => route.name !== 'index');
  
  const circleSize = 60; // Size of each circle
  const pillWidth = circleSize * 5; // width based on number of tabs
  // no screen width needed with row layout

  // translateX for absolute positioned action button; clamp so menu doesn't overflow off right edge
  // previously used to position absolute action; no longer needed after row layout
  
  // Find the index of the focused tab in filtered routes
  const focusedIndex = filteredRoutes.findIndex(route => {
    const originalIndex = state.routes.findIndex(r => r.key === route.key);
    return state.index === originalIndex;
  });
  
  // Animated values
  const translateX = useSharedValue(focusedIndex * circleSize);
  const menuOpen = useSharedValue(0); // 0 = closed, 1 = open
  
  // Update animation when tab changes
  useEffect(() => {
    translateX.value = withSpring(focusedIndex * circleSize, {
      damping: 15,        // Lower = more bouncy (10-30)
      stiffness: 200,     // Lower = slower/smoother (50-200)
      mass: 0.25,            // Higher = heavier feel (0.5-2)
      velocity: 0,        // Initial velocity (usually 0)
    });
  }, [focusedIndex, translateX]);
  
  // Animated style for the sliding circle
  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const menuStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: withTiming(menuOpen.value ? -10 : 12, { duration: 250, easing: Easing.out(Easing.cubic) }) }
      ],
      opacity: withTiming(menuOpen.value ? 1 : 0, { duration: 200 }),
    };
  });
  
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    const next = !isOpen;
    setIsOpen(next);
    menuOpen.value = next ? 1 : 0;
  };

  return (
    <View 
      /* Let this container size to its children instead of stretching left/right:0 */
      className="absolute bottom-0 left-0 right-0 items-center"
      style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }}
    >
      {/* Center a row that contains the pill and the standalone action button to its right */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        <View 
          className="relative flex-row items-center bg-backgroundLight rounded-full"
          style={{
            width: pillWidth,
            height: circleSize,
            alignSelf: 'center',
            ...shadows.medium,
          }}
        >
          {/* Animated sliding circle */}
          <Animated.View 
            className="absolute bg-primary rounded-full"
            style={[
              {
                width: circleSize,
                height: circleSize,
              },
              animatedCircleStyle,
              shadows.medium,
            ]}
          />
          
          {/* Tab icons */}
          {filteredRoutes.map((route, index) => {
            const originalIndex = state.routes.findIndex(r => r.key === route.key);
            const isFocused = state.index === originalIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            let Icon: React.ComponentType<any> | undefined;
            // Map the new tab names to existing icons
            if (route.name === "community") Icon = isFocused ? ClubsIconFilled : ClubsIcon;
            else if (route.name === "spaces") Icon = isFocused ? SpacesIconFilled : SpacesIcon;
            // For search, use the normal and filled SVGs; render slightly larger so it 'feels' the same size
            else if (route.name === "search") Icon = isFocused ? SearchIconFilled : SearchIcon;
            else if (route.name === "resources") Icon = isFocused ? CompassIconFilled : CompassIcon;
            else if (route.name === "profile") Icon = isFocused ? ProfileIconFilled : ProfileIcon;

            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                className="items-center justify-center relative z-10"
                style={{
                  width: circleSize,
                  height: circleSize,
                }}
              >
                {Icon ? (
                  <Icon 
                    width={route.name === 'search' || route.name === 'resources' ? 25 : 20} 
                    height={route.name === 'search' || route.name === 'resources' ? 25 : 20} 
                    fill={isFocused ? colors.backgroundLight : colors.accent} 
                  />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
        {/* Spacer between pill and action button */}
        <View style={{ width: 12 }} />
        {/* Action button container */}
        <View style={{ width: circleSize, height: circleSize, alignItems: 'center', justifyContent: 'center' }}>
          {/* Options: positioned above button, anchored to right so they expand left */}
          <Animated.View style={[{ position: 'absolute', bottom: circleSize + 8, right: 0, alignItems: 'flex-end', width: 160 }, menuStyle]} pointerEvents={isOpen ? 'auto' : 'none'}>
            <TouchableOpacity className="rounded-xl shadow-lg" style={{ backgroundColor: colors.backgroundLight, paddingVertical: 8, paddingHorizontal: 14, marginBottom: 8, width: 160, alignItems: 'center' }} onPress={() => { /* placeholder */ }}>
              <Text style={{ color: colors.textOnBgLight }} className="font-inter-bold text-sm">New Club</Text>
            </TouchableOpacity>
            <TouchableOpacity className="rounded-xl shadow-lg" style={{ backgroundColor: colors.backgroundLight, paddingVertical: 8, paddingHorizontal: 14, width: 160, alignItems: 'center' }} onPress={() => { /* placeholder */ }}>
              <Text style={{ color: colors.textOnBgLight }} className="font-inter-bold text-sm">New Post</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            onPress={toggleMenu}
            className="rounded-full items-center justify-center"
            style={{ width: circleSize, height: circleSize, backgroundColor: colors.secondary, ...shadows.medium }}
          >
            <PlusIcon width={22} height={22} color={colors.primary} fill={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}