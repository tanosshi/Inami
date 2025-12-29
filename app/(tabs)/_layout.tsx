import React, { useRef, useEffect, useMemo, useState } from "react";
import { Tabs } from "expo-router";
import { View, StyleSheet, Animated, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import MiniPlayer from "../../components/MiniPlayer";
import { usePlayerStore } from "../../store/playerStore";
import { COLORS, RADIUS, ANIMATION, TAB_CONFIG } from "../../constants/theme";
import { getThemeSettings } from "../../utils/database";

const AnimatedTabIcon = ({
  name,
  color,
  focused,
  previousFocused,
}: {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
  focused: boolean;
  previousFocused: React.MutableRefObject<boolean>;
}) => {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    const wasNotFocused = !previousFocused.current;
    const justBecameFocused = focused && wasNotFocused;
    const justBecameUnfocused = !focused && previousFocused.current;

    if (justBecameFocused) {
      translateY.setValue(-6);
      scale.setValue(0.8);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 10,
          stiffness: 120,
          mass: 0.7,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 8,
          stiffness: 150,
          mass: 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(bgOpacity, {
          toValue: 1,
          damping: 12,
          stiffness: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (justBecameUnfocused) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 0.9,
          damping: 15,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    previousFocused.current = focused;
  }, [focused, bgOpacity, opacity, scale, translateY, previousFocused]);

  const iconContainerStyle = useMemo(
    () => ({
      width: 64,
      height: 32,
      borderRadius: RADIUS.lg,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      overflow: "hidden" as const,
    }),
    []
  );

  const iconBackgroundStyle = useMemo(
    () => ({
      backgroundColor: COLORS.secondaryContainer,
      borderRadius: RADIUS.lg,
    }),
    []
  );

  return (
    <View style={iconContainerStyle}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          iconBackgroundStyle,
          { opacity: bgOpacity },
        ]}
      />
      <Animated.View
        style={{
          transform: [{ scale }, { translateY }],
          opacity,
        }}
      >
        <MaterialIcons name={name} size={24} color={color} />
      </Animated.View>
    </View>
  );
};

export default function TabLayout() {
  const currentSong = usePlayerStore((state) => state.currentSong);

  const homePrevFocused = useRef(true);
  const songsPrevFocused = useRef(false);
  const playlistsPrevFocused = useRef(false);

  const [navToggle, setNavToggle] = useState<boolean>(true);
  const [showNavTextToggle, setShowNavTextToggle] = useState<boolean>(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getThemeSettings();

      const navToggle = settings?.navToggle ?? false;
      setNavToggle(navToggle);

      const showNavTextToggle = settings?.showNavTextToggle ?? false;
      setShowNavTextToggle(showNavTextToggle);
    };
    fetchSettings();
  }, []);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: COLORS.background,
        },
        tabBar: {
          backgroundColor: navToggle
            ? COLORS.surfaceContainer
            : COLORS.background,
          borderTopWidth: 0,
          elevation: 0,
          height: 80,
          paddingTop: 12,
          paddingBottom: 16,
        },
        tabLabel: {
          fontFamily: "Inter_500Medium",
          fontSize: 8,
          marginTop: 5,
          color: COLORS.primary,
          opacity: 0.5,
        },
        tabItem: {
          paddingVertical: 0,
        },
        iconContainer: {
          width: 64,
          height: 32,
          borderRadius: RADIUS.lg,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        },
        iconBackground: {
          backgroundColor: COLORS.secondaryContainer,
          borderRadius: RADIUS.lg,
        },
        iconContainerActive: {
          backgroundColor: COLORS.secondaryContainer,
        },
      }),
    [navToggle]
  );

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarStyle: dynamicStyles.tabBar,
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.onSurfaceVariant,
      tabBarLabelStyle: dynamicStyles.tabLabel,
      tabBarItemStyle: dynamicStyles.tabItem,
      tabBarShowLabel: showNavTextToggle,
      animation: ANIMATION.tabTransition,
      sceneStyle: { backgroundColor: COLORS.background },
      lazy: false,
      freezeOnBlur: true,
      tabBarLabel: ({
        focused,
        children,
      }: {
        focused: boolean;
        children: React.ReactNode;
      }) => {
        if (!showNavTextToggle) return null;
        if (!focused) return null;

        return <Text style={dynamicStyles.tabLabel}>{children}</Text>;
      },
    }),
    [dynamicStyles, showNavTextToggle]
  );

  return (
    <View style={dynamicStyles.container}>
      <Tabs screenOptions={screenOptions}>
        <Tabs.Screen
          name="index"
          options={{
            title: TAB_CONFIG.forYou.name,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name={TAB_CONFIG.forYou.icon}
                color={color}
                focused={focused}
                previousFocused={homePrevFocused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="songs"
          options={{
            title: TAB_CONFIG.songs.name,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name={TAB_CONFIG.songs.icon}
                color={color}
                focused={focused}
                previousFocused={songsPrevFocused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="playlists"
          options={{
            title: TAB_CONFIG.playlists.name,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name={TAB_CONFIG.playlists.icon}
                color={color}
                focused={focused}
                previousFocused={playlistsPrevFocused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: TAB_CONFIG.discover.name,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                name={TAB_CONFIG.discover.icon}
                color={color}
                focused={focused}
                previousFocused={playlistsPrevFocused}
              />
            ),
          }}
        />
      </Tabs>
      {currentSong && <MiniPlayer />}
    </View>
  );
}
