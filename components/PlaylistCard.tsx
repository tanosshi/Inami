import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
      borderRadius: RADIUS.lg,
      overflow: "hidden" as const,
    },
    artworkContainer: {
      width: "100%" as const,
      aspectRatio: 1,
      backgroundColor: COLORS.primaryContainer,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    artworkImage: {
      width: "100%" as const,
      height: "100%" as const,
    },
    vignette: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: 10,
      paddingBottom: SPACING.sm,
      paddingHorizontal: SPACING.sm,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    name: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleSmall,
      color: "#FFFFFF",
      textShadowColor: "rgba(0, 0, 0, 0.75)",
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
  }));

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.artworkContainer}>
        {playlist.artwork ? (
          <Image
            source={{ uri: playlist.artwork }}
            style={styles.artworkImage}
            contentFit="cover"
          />
        ) : (
          <MaterialIcons
            name="queue-music"
            size={40}
            color={themeValues.COLORS.primary}
          />
        )}
        <View style={styles.vignette}>
          <Text style={styles.name} numberOfLines={1}>
            {playlist.name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
