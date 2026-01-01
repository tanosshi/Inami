import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";

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

interface SongInfoProps {
  song: Song;
}

export default function SongInfo({ song }: SongInfoProps) {
  const styles = useDynamicStyles(() => ({
    songInfo: {
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    },
    titleContainer: {
      alignItems: "center" as const,
    },
    songTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineSmall,
      color: COLORS.onSurface,
    },
    songArtist: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurfaceVariant,
      marginTop: 4,
    },
  }));

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

  return (
    <View style={styles.songInfo}>
      <View style={styles.titleContainer}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {safeString(song.title)}
        </Text>
        <Text style={styles.songArtist} numberOfLines={1}>
          {safeString(song.artist)}
        </Text>
      </View>
    </View>
  );
}
