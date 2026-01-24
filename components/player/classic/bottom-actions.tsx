import React from "react";
import { View, TouchableOpacity } from "react-native";
import {
  MaterialIcons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
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

interface BottomActionsProps {
  song?: Song;
  onLike?: () => void;
}

export default function BottomActions({ song, onLike }: BottomActionsProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    bottomActions: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.lg + 9,
      marginTop: SPACING.xxl,
    },
    bottomButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      backgroundColor: "transparent" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  }));

  return (
    <View style={styles.bottomActions}>
      <TouchableOpacity style={styles.bottomButton}>
        <MaterialCommunityIcons
          name="playlist-music"
          size={24}
          color={themeValues.COLORS.onSurfaceVariant}
        />
      </TouchableOpacity>
      {song && onLike && (
        <TouchableOpacity style={styles.bottomButton} onPress={onLike}>
          <MaterialIcons
            name={song.is_liked ? "favorite" : "favorite-border"}
            size={24}
            color={
              song.is_liked
                ? themeValues.COLORS.liked
                : themeValues.COLORS.onSurfaceVariant
            }
          />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.bottomButton}>
        <Feather name="plus" size={20} color={COLORS.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
}
