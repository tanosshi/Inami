import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, PanResponder } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
// @ts-ignore
import { useRouter } from "expo-router";
import { usePlayerStore } from "../store/playerStore";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";
import { getThemeSettings } from "../utils/database";

export default function MiniPlayer() {
  const router = useRouter();
  const themeValues = useThemeValues();
  const [navToggle, setNavToggle] = useState<boolean>(true);
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
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
      backgroundColor: navToggle ? COLORS.surfaceContainer : COLORS.background,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      overflow: "hidden" as const,
    },
    progressBar: {
      height: 2,
      backgroundColor: COLORS.surfaceVariant,
    },
    progressFill: {
      height: "100%",
      backgroundColor: COLORS.primary,
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

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // gently move it
      },
      onPanResponderMove: (evt, gestureState) => {
        // gently move it
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        const threshold = 50;

        if (Math.abs(dx) > threshold) {
          if (dx > 0) {
            playPrevious();
          } else {
            playNext();
          }
        }
      },
      onPanResponderTerminate: () => {
        // snap back
      },
    })
  ).current;

  if (!currentSong) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <TouchableOpacity
        style={styles.contentTouchable}
        onPress={() => router.push("/player")}
        activeOpacity={0.95}
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
              {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentSong.artist}
            </Text>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={togglePlayPause}
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
    </View>
  );
}
