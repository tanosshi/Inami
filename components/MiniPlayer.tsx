import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
// @ts-ignore
import { useRouter } from "expo-router";
import { usePlayerStore } from "../store/playerStore";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";
import { useDynamicTheme } from "../contexts/DynamicThemeContext";
import { safeString } from "../utils/safeString";
import { getThemeSettings } from "../utils/database";
import { triggerHaptic } from "../utils/haptics";

interface MiniPlayerProps {
  tabBarColor?: string;
}

function MiniPlayerContent({ tabBarColor }: MiniPlayerProps) {
  const router = useRouter();
  const themeValues = useThemeValues();
  const { dynamicColors } = useDynamicTheme();
  const [navToggle, setNavToggle] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragAnim = useRef(new Animated.Value(0)).current;
  const hapticInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    showPlayerOverlay,
  } = usePlayerStore();

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getThemeSettings();

      const navToggle = settings?.navToggle ?? false;
      setNavToggle(navToggle);
    };
    fetchSettings();
  }, []);

  const styles = useDynamicStyles(() => ({
    container: {
      position: "absolute" as const,
      bottom: 80,
      left: 0,
      right: 0,
      backgroundColor: COLORS.background,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      overflow: "hidden" as const,
    },
    progressBar: {
      height: 2,
      backgroundColor: dynamicColors.surface,
    },
    progressFill: {
      backgroundColor: dynamicColors.primary,
    },
    content: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      left: 0,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    contentTouchable: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.sm + 8,
      paddingVertical: SPACING.sm,
      flex: 1,
    },
    artworkContainer: {
      marginRight: SPACING.sm,
    },
    artwork: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.sm,
    },
    artworkPlaceholder: {
      backgroundColor: COLORS.primaryContainer,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    info: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    title: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurface,
    },
    artist: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.onSurfaceVariant,
      marginTop: 2,
    },
    controls: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    controlButton: {
      width: 44,
      height: 44,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  }));

  const showPlayer = usePlayerStore((s) => s.showPlayer);

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 5 || Math.abs(dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        hapticInterval.current = setInterval(() => {
          triggerHaptic();
        }, 25);
      },
      onPanResponderMove: (evt, gestureState) => {
        const { dx } = gestureState;
        dragAnim.setValue(dx);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        const threshold = 50;

        if (hapticInterval.current) {
          clearInterval(hapticInterval.current);
          hapticInterval.current = null;
        }

        if (Math.abs(dx) > threshold) {
          if (dx > 0) {
            playPrevious();
          } else {
            playNext();
          }
        } else {
          showPlayerOverlay();
        }

        setIsDragging(false);
        Animated.spring(dragAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        if (hapticInterval.current) {
          clearInterval(hapticInterval.current);
          hapticInterval.current = null;
        }
        setIsDragging(false);
        Animated.spring(dragAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
      onShouldBlockNativeResponder: () => false,
    })
  ).current;

  if (!currentSong || (!isPlaying && !showPlayer)) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const OpenPlayer = () => {
    triggerHaptic();
    showPlayerOverlay();
  };

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${progress}%`, height: 2 }]}
        />
      </View>

      <Animated.View
        style={[
          styles.contentTouchable,
          { transform: [{ translateX: dragAnim }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={0.8}
          onPress={OpenPlayer}
        >
          <View style={styles.content}>
            {/* Artwork */}
            <View style={styles.artworkContainer}>
              {currentSong.artwork ? (
                <Image
                  source={{ uri: currentSong.artwork }}
                  style={styles.artwork}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.artwork, styles.artworkPlaceholder]}>
                  <MaterialIcons
                    name="music-note"
                    size={18}
                    color={themeValues.COLORS.primary}
                  />
                </View>
              )}
            </View>

            {/* Song Info */}
            <View style={styles.info}>
              <Text style={styles.title} numberOfLines={1}>
                {safeString(currentSong.title)}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {safeString(currentSong.artist)}
              </Text>
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => {
                  triggerHaptic();
                  togglePlayPause();
                }}
              >
                <MaterialIcons
                  name={isPlaying ? "pause" : "play-arrow"}
                  size={32}
                  color={themeValues.COLORS.onSurface}
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function MiniPlayer({ tabBarColor }: MiniPlayerProps) {
  return <MiniPlayerContent tabBarColor={tabBarColor} />;
}
