import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePlayerStore } from "../../../store/playerStore";
import { COLORS, SPACING, TYPOGRAPHY } from "../../../constants/theme";
import { useDynamicStyles } from "../../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../../utils/haptics";
import { safeString } from "../../../utils/safeString";

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
  const router = useRouter();
  const { hidePlayerOverlay } = usePlayerStore();
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

  return (
    <View style={styles.songInfo}>
      <View style={styles.titleContainer}>
        <Text style={styles.songTitle} numberOfLines={1}>
          {safeString(song.title)}
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            triggerHaptic();
            const artistName = safeString(song.artist);
            if (!artistName) return;
            hidePlayerOverlay();
            setTimeout(() => {
              router.push(`/artist/${encodeURIComponent(artistName)}`);
            }, 260);
          }}
        >
          <Text style={styles.songArtist} numberOfLines={1}>
            {safeString(song.artist)}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
