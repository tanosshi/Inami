import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useSongStore } from "../store/songStore";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
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

export default function SongCard({
  song,
  onPress,
  onLongPress,
  showOptions,
}: SongCardProps) {
  const { toggleLike } = useSongStore();
  const themeValues = useThemeValues();

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
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    subtitle: {
      fontFamily: "Inter_400Regular",
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
      fontFamily: "Inter_400Regular",
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

  const formatDuration = (ms: number) => {
    if (!ms) return "";
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const safeString = (value: any): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return value.toString();
    if (typeof value === "boolean") return value.toString();
    try {
      return String(value);
    } catch {
      return "";
    }
  };

  const handleLike = async () => {
    await toggleLike(song.id);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => {
        onPress();
        triggerHaptic();
      }}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Artwork */}
      <View style={styles.artworkContainer}>
        {song.artwork ? (
          <Image
            source={{ uri: song.artwork }}
            style={styles.artwork}
            contentFit="cover"
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
          {safeString(song.artist) || "Unknown Artist"}
          {song.album && song.album !== "Unknown Album"
            ? ` • ${safeString(song.album)}`
            : ""}
        </Text>
      </View>

      {/* Actions (todo fix duration display) */}
      <View style={styles.actions}>
        {song.duration &&
          formatDuration(song.duration).toString() !== "0:00" && (
            <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
          )}
        {/* probably plans to replace like with the 3 dots */}
        {showOptions && (
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => {
              triggerHaptic();
              handleLike();
            }}
          >
            <MaterialIcons
              name={song.is_liked ? "favorite" : "favorite-border"}
              size={22}
              color={
                song.is_liked
                  ? themeValues.COLORS.liked
                  : themeValues.COLORS.onSurfaceVariant
              }
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}
