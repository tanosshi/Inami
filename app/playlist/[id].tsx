import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { usePlaylistStore } from "../../store/playlistStore";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import SongCard from "../../components/SongCard";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    playlists,
    fetchPlaylists,
    getPlaylistSongs,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
  } = usePlaylistStore();
  const { songs, fetchSongs } = useSongStore();
  const { playSong, setQueue } = usePlayerStore();
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playlistSongs, setPlaylistSongs] = useState<any[]>([]);

  const playlist = playlists.find((p) => p.id === id);
  const playlistSongIds = playlistSongs.map((s) => s.id);
  const availableSongs = songs.filter((s) => !playlistSongIds.includes(s.id));

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchPlaylists(), fetchSongs()]);
    if (id) {
      const songsInPlaylist = await getPlaylistSongs(id);
      setPlaylistSongs(songsInPlaylist);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      setQueue(playlistSongs);
      playSong(playlistSongs[0]);
      router.push("/player");
    }
  };

  const handlePlaySong = (song: any) => {
    setQueue(playlistSongs);
    playSong(song);
    router.push("/player");
  };

  const handleShufflePlay = () => {
    if (playlistSongs.length > 0) {
      const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      playSong(shuffled[0]);
      router.push("/player");
    }
  };

  const handleAddSong = async (songId: string) => {
    if (playlist) {
      await addSongToPlaylist(playlist.id, songId);
      const songsInPlaylist = await getPlaylistSongs(playlist.id);
      setPlaylistSongs(songsInPlaylist);
      await fetchPlaylists();
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (playlist) {
      Alert.alert("Remove Song", "Remove this song from the playlist?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await removeSongFromPlaylist(playlist.id, songId);
            const songsInPlaylist = await getPlaylistSongs(playlist.id);
            setPlaylistSongs(songsInPlaylist);
            await fetchPlaylists();
          },
        },
      ]);
    }
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (playlist) {
              await deletePlaylist(playlist.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Playlist not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleDeletePlaylist}
          >
            <MaterialIcons
              name="delete-outline"
              size={22}
              color={COLORS.error}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.playlistInfo}>
        <View style={styles.playlistArt}>
          <MaterialIcons name="queue-music" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.playlistName}>{playlist.name}</Text>
        {playlist.description && (
          <Text style={styles.playlistDescription}>{playlist.description}</Text>
        )}
        <Text style={styles.songCount}>
          {playlistSongs.length} {playlistSongs.length === 1 ? "song" : "songs"}
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.shuffleButton}
          onPress={handleShufflePlay}
        >
          <MaterialIcons name="shuffle" size={20} color={COLORS.onSurface} />
          <Text style={styles.shuffleText}>Shuffle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.playAllButton} onPress={handlePlayAll}>
          <MaterialIcons name="play-arrow" size={22} color={COLORS.onPrimary} />
          <Text style={styles.playAllText}>Play All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddSongsModal(true)}
        >
          <MaterialIcons name="add" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlistSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard
            song={item}
            onPress={() => handlePlaySong(item)}
            onLongPress={() => handleRemoveSong(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons
              name="music-off"
              size={48}
              color={COLORS.onSurfaceVariant}
            />
            <Text style={styles.emptyTitle}>No songs yet</Text>
            <Text style={styles.emptyText}>Add songs to this playlist</Text>
          </View>
        }
      />

      <Modal
        visible={showAddSongsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSongsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddSongsModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Songs</Text>
              <TouchableOpacity onPress={() => setShowAddSongsModal(false)}>
                <MaterialIcons
                  name="close"
                  size={24}
                  color={COLORS.onSurface}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{
                alignSelf: "center",
                width: 40,
                height: 4,
                borderRadius: 2,
                backgroundColor: COLORS.outlineVariant,
                marginBottom: SPACING.md,
              }}
            />
            <FlatList
              data={availableSongs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.addSongItem}
                  onPress={() => handleAddSong(item.id)}
                >
                  <View style={styles.addSongInfo}>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Image
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: RADIUS.sm,
                          marginRight: SPACING.md,
                        }}
                        source={item.artwork}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.addSongTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.addSongArtist} numberOfLines={1}>
                          {item.artist}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Feather name="plus" size={16} color={COLORS.onSurface} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>
                    No songs available to add
                  </Text>
                </View>
              }
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  linkText: {
    fontSize: 16,
    color: COLORS.primary,
    marginTop: SPACING.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  playlistInfo: {
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  playlistArt: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.onSurface,
    textAlign: "center",
  },
  playlistDescription: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  songCount: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: SPACING.sm,
  },
  shuffleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  shuffleText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onSurface,
  },
  playAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.xl,
    gap: SPACING.sm,
  },
  playAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.onPrimary,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.onSurface,
    marginTop: SPACING.sm,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: SPACING.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.surfaceContainer,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: "70%",
    paddingBottom: SPACING.xxl,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.onSurface,
  },
  addSongItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  addSongInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  addSongTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.onSurface,
  },
  addSongArtist: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginTop: 2,
  },
  modalEmpty: {
    padding: SPACING.xxl,
    alignItems: "center",
  },
  modalEmptyText: {
    fontSize: 16,
    color: COLORS.onSurfaceVariant,
  },
});
