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

interface RecentlyAddedProps {
  songs: Song[];
  onPlaySong: (song: Song) => void;
}

export default function RecentlyAdded({
  songs,
  onPlaySong,
}: RecentlyAddedProps) {
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

  if (songs.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recently added</Text>
      {songs.slice(0, 5).map((song) => (
        <SongCard key={song.id} song={song} onPress={() => onPlaySong(song)} />
      ))}
    </View>
  );
}
