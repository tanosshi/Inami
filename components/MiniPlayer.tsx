import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
// @ts-ignore
import { useRouter } from "expo-router";
import { usePlayerStore } from "../store/playerStore";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";

export default function MiniPlayer() {
  const router = useRouter();
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
  } = usePlayerStore();

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
                  color={COLORS.primary}
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
                color={COLORS.onSurface}
              />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    overflow: "hidden",
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
    flexDirection: "row",
    alignItems: "center",
    left: 0,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  contentTouchable: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
  },
  controlButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
