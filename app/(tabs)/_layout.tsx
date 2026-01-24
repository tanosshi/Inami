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
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import MiniPlayer from "../../components/MiniPlayer";
import { usePlayerStore } from "../../store/playerStore";
import { useTabStore } from "../../store/tabStore";
import { COLORS, RADIUS, TAB_CONFIG } from "../../constants/theme";
import { useThemeValues } from "../../hooks/useDynamicStyles";
import { getThemeSettings } from "../../utils/database";
import SwipeableTabs, {
  SwipeableTabsRef,
} from "../../components/SwipeableTabs";

import Discover from "../../components/tabs/discover";

import { Home, Songs, Playlists, Artists } from "../../components/tabs";

import UserModal from "../../components/UserModal";

const AnimatedTabIcon = React.memo(
  ({
    name,
    color,
    focused,
    previousFocused,
    dragProgress,
    isNextTab,
    isPrevTab,
    themeValues,
  }: {
    name: keyof typeof MaterialIcons.glyphMap;
    color: string;
    focused: boolean;
    previousFocused: React.MutableRefObject<boolean>;
    dragProgress: number;
    isNextTab: boolean;
    isPrevTab: boolean;
    themeValues: any;
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
        overflow: "visible" as const,
      }),
      []
    );

    const iconBackgroundStyle = useMemo(
      () => ({
        backgroundColor: themeValues.COLORS.primary,
        borderRadius: RADIUS.lg,
      }),
      [themeValues]
    );

    return (
      <View style={iconContainerStyle}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            iconBackgroundStyle,
            {
              opacity: bgOpacity,
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
  }
);

AnimatedTabIcon.displayName = "AnimatedTabIcon";

const TabBarItem = React.memo(
  ({
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
    themeValues,
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
    themeValues: any;
  }) => {
    return (
      <TouchableOpacity
        style={tabBarStyles.tabItem}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <AnimatedTabIcon
          name={iconName}
          color={focused ? COLORS.onPrimary : COLORS.onSurfaceVariant}
          focused={focused}
          previousFocused={previousFocused}
          dragProgress={dragProgress}
          isNextTab={isNextTab}
          isPrevTab={isPrevTab}
          themeValues={themeValues}
        />
        {showLabel && focused && (
          <Text style={[tabBarStyles.tabLabel, { color: COLORS.onPrimary }]}>
            {title}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
);

TabBarItem.displayName = "TabBarItem";

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
  const themeValues = useThemeValues();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const showPlayer = usePlayerStore((s) => s.showPlayer);
  const swipeableRef = useRef<SwipeableTabsRef>(null);
  const storeTabIndex = useTabStore((state) => state.currentTabIndex);
  const setStoreTabIndex = useTabStore((state) => state.setTabIndex);
  const prevStoreTabIndex = useRef(storeTabIndex);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [navToggle, setNavToggle] = useState<boolean>(true);
  const [showNavTextToggle, setShowNavTextToggle] = useState<boolean>(true);
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [showDiscoverOverlay, setShowDiscoverOverlay] =
    useState<boolean>(false);

  const userPrevFocused = useRef(false);

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
  const artistsPrevFocused = useRef(false);
  const playlistsPrevFocused = useRef(false);

  const prevFocusRefs = useMemo(
    () => [
      homePrevFocused,
      songsPrevFocused,
      artistsPrevFocused,
      playlistsPrevFocused,
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
        name: "artists",
        title: TAB_CONFIG.artists.name,
        icon: TAB_CONFIG.artists.icon,
      },
      {
        name: "playlists",
        title: TAB_CONFIG.playlists.name,
        icon: TAB_CONFIG.playlists.icon,
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
          enabled={true}
        >
          <Home />
          <Songs />
          <Artists />
          <Playlists />
        </SwipeableTabs>
      </View>

      {currentSong && (isPlaying || showPlayer) && (
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
            dragProgress={0}
            isNextTab={index === currentIndex + 1}
            isPrevTab={index === currentIndex - 1}
            themeValues={themeValues}
          />
        ))}

        <TabBarItem
          key="user"
          name="user"
          title="You"
          iconName={"face"}
          focused={showUserModal}
          onPress={() => setShowUserModal(true)}
          previousFocused={userPrevFocused}
          showLabel={showNavTextToggle}
          dragProgress={0}
          isNextTab={false}
          isPrevTab={false}
          themeValues={themeValues}
        />
      </View>

      <UserModal
        show={showUserModal}
        onClose={() => setShowUserModal(false)}
        onOpenDiscover={() => {
          setShowUserModal(false);
          setShowDiscoverOverlay(true);
        }}
      />

      <Modal
        visible={showDiscoverOverlay}
        animationType="slide"
        onRequestClose={() => setShowDiscoverOverlay(false)}
        statusBarTranslucent={true}
      >
        <View style={{ flex: 1, backgroundColor: COLORS.background }}>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: Platform.OS === "ios" ? 50 : 20,
              right: 20,
              zIndex: 20,
            }}
            onPress={() => setShowDiscoverOverlay(false)}
          >
            <MaterialIcons name="close" size={28} color={COLORS.onSurface} />
          </TouchableOpacity>
          <Discover />
        </View>
      </Modal>
    </View>
  );
}
