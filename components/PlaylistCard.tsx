import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface Playlist {
  id: string;
  name: string;
  description: string;
  song_count: number;
  artwork?: string;
}

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: () => void;
}

export default function PlaylistCard({ playlist, onPress }: PlaylistCardProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    container: {
      width: CARD_WIDTH,
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },
    artwork: {
      width: "100%" as const,
      height: 100,
      backgroundColor: COLORS.primaryContainer,
      borderRadius: RADIUS.md,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginBottom: SPACING.md,
    },
    name: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleSmall,
      color: COLORS.onSurface,
    },
    count: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.onSurfaceVariant,
      marginTop: SPACING.xs,
    },
  }));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.artwork}>
        <MaterialIcons
          name="queue-music"
          size={40}
          color={themeValues.COLORS.primary}
        />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {playlist.name}
      </Text>
      <Text style={styles.count}>
        {playlist.song_count} {playlist.song_count === 1 ? "song" : "songs"}
      </Text>
    </TouchableOpacity>
  );
}
