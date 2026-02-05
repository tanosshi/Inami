import React, { useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSongStore } from "../store/songStore";
import { safeString } from "../utils/safeString";
import {
  COLORS,
  SPACING,
  RADIUS,
  TYPOGRAPHY,
  getFontFamily,
} from "../constants/theme";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";
import { triggerHaptic } from "../utils/haptics";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork?: string;
  is_liked: boolean;
  play_count: number;
}

interface SongCardProps {
  song: Song;
  onPress: () => void;
  onLongPress?: () => void;
  showOptions?: boolean;
}

const formatDuration = (ms: number) => {
  if (!ms) return "";
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

function SongCard({ song, onPress, onLongPress, showOptions }: SongCardProps) {
  const { toggleLike } = useSongStore();
  const themeValues = useThemeValues();
  const heartOpacity = useRef(
    new Animated.Value(song.is_liked ? 1 : 0)
  ).current;

  useEffect(() => {
    Animated.timing(heartOpacity, {
      toValue: song.is_liked ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [song.is_liked, heartOpacity]);

  const styles = useDynamicStyles(() => ({
    container: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
      borderRadius: RADIUS.md,
    },
    artworkContainer: {
      marginRight: SPACING.md,
    },
    artwork: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.sm,
    },
    artworkPlaceholder: {
      backgroundColor: COLORS.surfaceContainerHigh,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    info: {
      flex: 1,
      marginRight: SPACING.sm,
    },
    title: {
      fontFamily: getFontFamily("500"),
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    subtitle: {
      fontFamily: getFontFamily("400"),
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
      marginTop: 2,
    },
    actions: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.sm,
    },
    duration: {
      display: "none" as const,
      fontFamily: getFontFamily("400"),
      ...TYPOGRAPHY.labelMedium,
      color: COLORS.onSurfaceVariant,
    },
    likeButton: {
      width: 40,
      height: 40,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  }));

  const handleLike = useCallback(async () => {
    await toggleLike(song.id);
  }, [song.id, toggleLike]);

  const handlePress = useCallback(() => {
    onPress();
    triggerHaptic();
  }, [onPress]);

  const handleLongPress = useCallback(() => {
    triggerHaptic();
    if (onLongPress) onLongPress();
  }, [onLongPress]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      {/* Artwork */}
      <View style={styles.artworkContainer}>
        {song.artwork ? (
          <Image
            source={{ uri: song.artwork }}
            style={styles.artwork}
            contentFit="cover"
            recyclingKey={song.id}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <MaterialIcons
              name="music-note"
              size={20}
              color={themeValues.COLORS.primary}
            />
          </View>
        )}
      </View>

      {/* Song Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {safeString(song.title) || "Unknown Title"}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {safeString(song.artist).split(",")[0] || "Unknown Artist"}
          {song.album && song.album !== "Unknown Album"
            ? ` • ${safeString(song.album)}`
            : ""}
        </Text>
      </View>

      <View style={styles.actions}>
        {song.duration > 0 && formatDuration(song.duration) !== "0:00" && (
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
        )}
        {showOptions && (
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => {
              triggerHaptic();
              handleLike();
            }}
          >
            <View style={{ position: "relative" }}>
              <MaterialIcons
                name="favorite-border"
                size={22}
                color={themeValues.COLORS.onSurfaceVariant}
              />
              <Animated.View
                style={{
                  position: "absolute",
                  opacity: heartOpacity,
                }}
              >
                <MaterialIcons
                  name="favorite"
                  size={22}
                  color={themeValues.COLORS.liked}
                />
              </Animated.View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default React.memo(SongCard, (prev, next) => {
  return (
    prev.song.id === next.song.id &&
    prev.song.title === next.song.title &&
    prev.song.artist === next.song.artist &&
    prev.song.artwork === next.song.artwork &&
    prev.song.is_liked === next.song.is_liked &&
    prev.onPress === next.onPress &&
    prev.onLongPress === next.onLongPress &&
    prev.showOptions === next.showOptions
  );
});
