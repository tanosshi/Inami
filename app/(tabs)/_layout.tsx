import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import {
  View,
  StyleSheet,
  Animated,
  Text,
  Platform,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import MiniPlayer from "../../components/MiniPlayer";
import { usePlayerStore } from "../../store/playerStore";
import { useTabStore } from "../../store/tabStore";
import { COLORS, RADIUS, TAB_CONFIG } from "../../constants/theme";
import { getThemeSettings } from "../../utils/database";
import SwipeableTabs, {
  SwipeableTabsRef,
} from "../../components/SwipeableTabs";

import { Home, Songs, Playlists, Discover } from "../../components/tabs";

const AnimatedTabIcon = ({
  name,
  color,
  focused,
  previousFocused,
  dragProgress,
  isNextTab,
  isPrevTab,
}: {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
  focused: boolean;
  previousFocused: React.MutableRefObject<boolean>;
  dragProgress: number;
  isNextTab: boolean;
  isPrevTab: boolean;
}) => {
  const scale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const bgOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;

  const pillScaleX = useRef(new Animated.Value(1)).current;
  const pillTranslateX = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    if (focused && dragProgress !== 0) {
      const stretchAmount = 1 + Math.abs(dragProgress) * 0.4;
      const translateAmount = -dragProgress * 8;

      pillScaleX.setValue(stretchAmount);
      pillTranslateX.setValue(translateAmount);
    } else if (focused) {
      Animated.parallel([
        Animated.spring(pillScaleX, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
        Animated.spring(pillTranslateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
      ]).start();
    }
  }, [dragProgress, focused, pillScaleX, pillTranslateX]);

  const iconContainerStyle = useMemo(
    () => ({
      width: 64,
      height: 32,
      borderRadius: RADIUS.lg,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      overflow: "visible" as const,
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
          {
            opacity: bgOpacity,
            transform: [{ scaleX: pillScaleX }, { translateX: pillTranslateX }],
          },
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

const TabBarItem = ({
  name,
  title,
  iconName,
  focused,
  onPress,
  previousFocused,
  showLabel,
  dragProgress,
  isNextTab,
  isPrevTab,
}: {
  name: string;
  title: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
  onPress: () => void;
  previousFocused: React.MutableRefObject<boolean>;
  showLabel: boolean;
  dragProgress: number;
  isNextTab: boolean;
  isPrevTab: boolean;
}) => {
  return (
    <TouchableOpacity
      style={tabBarStyles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <AnimatedTabIcon
        name={iconName}
        color={focused ? COLORS.primary : COLORS.onSurfaceVariant}
        focused={focused}
        previousFocused={previousFocused}
        dragProgress={dragProgress}
        isNextTab={isNextTab}
        isPrevTab={isPrevTab}
      />
      {showLabel && focused && (
        <Text style={tabBarStyles.tabLabel}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const tabBarStyles = StyleSheet.create({
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tabLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 8,
    marginTop: 5,
    color: COLORS.primary,
    opacity: 0.5,
  },
});

export default function TabLayout() {
  const currentSong = usePlayerStore((state) => state.currentSong);
  const swipeableRef = useRef<SwipeableTabsRef>(null);
  const storeTabIndex = useTabStore((state) => state.currentTabIndex);
  const setStoreTabIndex = useTabStore((state) => state.setTabIndex);
  const prevStoreTabIndex = useRef(storeTabIndex);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragProgress, setDragProgress] = useState(0);
  const [navToggle, setNavToggle] = useState<boolean>(true);
  const [showNavTextToggle, setShowNavTextToggle] = useState<boolean>(true);

  useEffect(() => {
    if (storeTabIndex !== prevStoreTabIndex.current) {
      prevStoreTabIndex.current = storeTabIndex;
      if (storeTabIndex !== currentIndex) {
        swipeableRef.current?.goToIndex(storeTabIndex);
      }
    }
  }, [storeTabIndex, currentIndex]);

  const homePrevFocused = useRef(true);
  const songsPrevFocused = useRef(false);
  const playlistsPrevFocused = useRef(false);
  const discoverPrevFocused = useRef(false);

  const prevFocusRefs = useMemo(
    () => [
      homePrevFocused,
      songsPrevFocused,
      playlistsPrevFocused,
      discoverPrevFocused,
    ],
    []
  );

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getThemeSettings();

      const navToggle = settings?.navToggle ?? false;
      setNavToggle(navToggle);

      const showNavTextToggle = settings?.showNavTextToggle ?? false;
      setShowNavTextToggle(showNavTextToggle);
    };
    if (Platform.OS !== "web") {
      fetchSettings();
    }
  }, []);

  const handleIndexChange = useCallback(
    (index: number) => {
      setCurrentIndex(index);

      setStoreTabIndex(index);
      prevStoreTabIndex.current = index;
    },
    [setStoreTabIndex]
  );

  const handleDragProgress = useCallback((progress: number) => {
    setDragProgress(progress);
  }, []);

  const handleTabPress = useCallback((index: number) => {
    swipeableRef.current?.goToIndex(index);
  }, []);

  const tabConfigs = useMemo(
    () => [
      {
        name: "index",
        title: TAB_CONFIG.forYou.name,
        icon: TAB_CONFIG.forYou.icon,
      },
      {
        name: "songs",
        title: TAB_CONFIG.songs.name,
        icon: TAB_CONFIG.songs.icon,
      },
      {
        name: "playlists",
        title: TAB_CONFIG.playlists.name,
        icon: TAB_CONFIG.playlists.icon,
      },
      {
        name: "discover",
        title: TAB_CONFIG.discover.name,
        icon: TAB_CONFIG.discover.icon,
      },
    ],
    []
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: COLORS.background,
        },
        contentContainer: {
          flex: 1,
        },
        tabBar: {
          flexDirection: "row",
          backgroundColor: navToggle
            ? COLORS.surfaceContainer
            : COLORS.background,
          height: 80,
          paddingTop: 12,
          paddingBottom: 16,
          borderTopWidth: 0,
        },
      }),
    [navToggle]
  );

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.contentContainer}>
        <SwipeableTabs
          ref={swipeableRef}
          currentIndex={currentIndex}
          onIndexChange={handleIndexChange}
          onDragProgress={handleDragProgress}
          enabled={true}
        >
          <Home />
          <Songs />
          <Playlists />
          <Discover />
        </SwipeableTabs>
      </View>

      {currentSong && (
        <MiniPlayer tabBarColor={dynamicStyles.tabBar.backgroundColor} />
      )}

      <View style={dynamicStyles.tabBar}>
        {tabConfigs.map((tab, index) => (
          <TabBarItem
            key={tab.name}
            name={tab.name}
            title={tab.title}
            iconName={tab.icon}
            focused={currentIndex === index}
            onPress={() => handleTabPress(index)}
            previousFocused={prevFocusRefs[index]}
            showLabel={showNavTextToggle}
            dragProgress={dragProgress}
            isNextTab={index === currentIndex + 1}
            isPrevTab={index === currentIndex - 1}
          />
        ))}
      </View>
    </View>
  );
}
