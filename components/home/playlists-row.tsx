import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";

interface PlaylistDemo {
  id: string;
  artwork?: string | null;
}

interface PlaylistsRowProps {
  playlists: PlaylistDemo[];
}

export default function PlaylistsRow({ playlists }: PlaylistsRowProps) {
  const router = useRouter();

  const handlePlaylistPress = (playlist: PlaylistDemo) => {
    router.push(`/playlist/${playlist.id}`);
  };
  const styles = useDynamicStyles(() => ({
    container: {
      marginTop: -SPACING.xl + 8,
      marginBottom: 45,
    },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurface,
      marginBottom: SPACING.md,
    },
    scrollContent: {
      paddingHorizontal: 4,
    },
    playlistItem: {
      marginRight: 16,
    },
    playlistImage: {
      width: 102,
      height: 102,
      borderRadius: 24,
      backgroundColor: "#eee",
    },
  }));

  const playlistsWithArtwork = playlists.filter((p) => p.artwork);
  if (!playlistsWithArtwork || playlistsWithArtwork.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Playlists</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {playlistsWithArtwork.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            style={styles.playlistItem}
            onPress={() => handlePlaylistPress(playlist)}
          >
            <Image
              source={{ uri: playlist.artwork! }}
              style={styles.playlistImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
