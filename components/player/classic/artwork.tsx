import React from "react";
import { View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { COLORS, SPACING, RADIUS } from "../../../constants/theme";
import {
  useDynamicStyles,
  useThemeValues,
} from "../../../hooks/useDynamicStyles";

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

interface ArtworkProps {
  song: Song;
  artworkSize: number;
}

export default function Artwork({ song, artworkSize }: ArtworkProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    artworkContainer: {
      alignItems: "center" as const,
      paddingHorizontal: 40,
      paddingVertical: SPACING.lg,
    },
    artwork: {
      borderRadius: RADIUS.xl,
    },
    artworkPlaceholder: {
      backgroundColor: COLORS.surfaceContainerHigh,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  }));

  return (
    <View style={styles.artworkContainer}>
      {song.artwork ? (
        <Image
          source={{ uri: song.artwork }}
          style={[styles.artwork, { width: artworkSize, height: artworkSize }]}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.artwork,
            styles.artworkPlaceholder,
            { width: artworkSize, height: artworkSize },
          ]}
        >
          <MaterialIcons
            name="music-note"
            size={80}
            color={themeValues.COLORS.primary}
          />
        </View>
      )}
    </View>
  );
}
