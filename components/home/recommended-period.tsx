import React from "react";
import { View, Text } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import SongCard from "../SongCard";
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

interface Stats {
  total_songs: number;
  liked_songs: number;
  total_playlists: number;
  total_play_count: number;
  top_artist?: string;
  most_played_song?: Song;
}

interface RecommendedPeriodProps {
  stats: Stats | null;
  onPlaySong: (song: Song) => void;
}

export default function RecommendedPeriod({
  stats,
  onPlaySong,
}: RecommendedPeriodProps) {
  const styles = useDynamicStyles(() => ({
    section: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurface,
      marginBottom: SPACING.md,
    },
  }));

  if (!stats?.most_played_song || stats.most_played_song.play_count === 0)
    return null;
  // edit when the logic is there
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommended Right Now</Text>
      <SongCard
        song={stats.most_played_song}
        onPress={() => onPlaySong(stats.most_played_song!)}
      />
      <SongCard
        song={stats.most_played_song}
        onPress={() => onPlaySong(stats.most_played_song!)}
      />
      <SongCard
        song={stats.most_played_song}
        onPress={() => onPlaySong(stats.most_played_song!)}
      />
    </View>
  );
}
