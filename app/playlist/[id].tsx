import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { usePlaylistStore } from "../../store/playlistStore";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import SongCard from "../../components/SongCard";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const themeValues = useThemeValues();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    playlists,
    fetchPlaylists,
    getPlaylistSongs,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    updatePlaylist,
  } = usePlaylistStore();
  const { songs, fetchSongs } = useSongStore();
  const { playSong, setQueue, showPlayerOverlay } = usePlayerStore();
  const [showAddSongsModal, setShowAddSongsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [playlistSongs, setPlaylistSongs] = useState<any[]>([]);

  const styles = useDynamicStyles(() => ({
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
    playlistArtImage: {
      width: "100%",
      height: "100%",
      borderRadius: RADIUS.lg,
    },
    editOverlay: {
      position: "absolute",
      bottom: 5,
      right: 5,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      borderRadius: RADIUS.full,
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
    },
  }));

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please allow access to your photo library to change the playlist cover."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri && playlist) {
      try {
        await updatePlaylist(playlist.id, { artwork: result.assets[0].uri });
        await fetchPlaylists();
      } catch (error) {
        console.error("Failed to update playlist artwork:", error);
        Alert.alert("Error", "Failed to update playlist cover.");
      }
    }
  };

  const PlayAll = () => {
    if (playlistSongs.length > 0) {
      setQueue(playlistSongs);
      playSong(playlistSongs[0]);
      showPlayerOverlay();
    }
  };

  const PlaySong = (song: any) => {
    setQueue(playlistSongs);
    playSong(song);
    showPlayerOverlay();
  };

  const ShufflePlay = () => {
    if (playlistSongs.length > 0) {
      const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
      playSong(shuffled[0]);
      showPlayerOverlay();
    }
  };

  const AddSong = async (songId: string) => {
    if (playlist) {
      await addSongToPlaylist(playlist.id, songId);
      const songsInPlaylist = await getPlaylistSongs(playlist.id);
      setPlaylistSongs(songsInPlaylist);
      await fetchPlaylists();
    }
  };

  const RemoveSong = async (songId: string) => {
    if (playlist) {
      Alert.alert("Remove Song", "Remove this song from the playlist?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await triggerHaptic();
            await removeSongFromPlaylist(playlist.id, songId);
            const songsInPlaylist = await getPlaylistSongs(playlist.id);
            setPlaylistSongs(songsInPlaylist);
            await fetchPlaylists();
          },
        },
      ]);
    }
  };

  const DeletePlaylist = () => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlist?.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await triggerHaptic();
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
          <ActivityIndicator size="large" color={themeValues.COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Playlist not found</Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              router.back();
            }}
          >
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
          onPress={() => {
            triggerHaptic();
            router.back();
          }}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={themeValues.COLORS.onSurface}
          />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              triggerHaptic();
              DeletePlaylist();
            }}
          >
            <MaterialIcons
              name="delete-outline"
              size={22}
              color={themeValues.COLORS.error}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.playlistInfo}>
        <TouchableOpacity
          style={styles.playlistArt}
          onPress={() => {
            triggerHaptic();
            pickImage();
          }}
          activeOpacity={0.7}
        >
          {playlist.artwork ? (
            <Image
              source={{ uri: playlist.artwork }}
              style={styles.playlistArtImage}
              contentFit="cover"
            />
          ) : (
            <MaterialIcons
              name="queue-music"
              size={48}
              color={themeValues.COLORS.primary}
            />
          )}
          <View style={styles.editOverlay}>
            <MaterialIcons name="camera-alt" size={10} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
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
          onPress={() => {
            triggerHaptic();
            ShufflePlay();
          }}
        >
          <MaterialIcons
            name="shuffle"
            size={20}
            color={themeValues.COLORS.onSurface}
          />
          <Text style={styles.shuffleText}>Shuffle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.playAllButton}
          onPress={() => {
            triggerHaptic();
            PlayAll();
          }}
        >
          <MaterialIcons
            name="play-arrow"
            size={22}
            color={themeValues.COLORS.onPrimary}
          />
          <Text style={styles.playAllText}>Play All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            triggerHaptic();
            setShowAddSongsModal(true);
          }}
        >
          <MaterialIcons
            name="add"
            size={24}
            color={themeValues.COLORS.onSurface}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={playlistSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SongCard
            song={item}
            onPress={() => {
              triggerHaptic();
              PlaySong(item);
            }}
            onLongPress={() => RemoveSong(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons
              name="music-off"
              size={48}
              color={themeValues.COLORS.onSurfaceVariant}
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
          onPress={() => {
            triggerHaptic();
            setShowAddSongsModal(false);
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Songs</Text>
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic();
                  setShowAddSongsModal(false);
                }}
              >
                <MaterialIcons
                  name="close"
                  size={24}
                  color={themeValues.COLORS.onSurface}
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
                  onPress={() => {
                    triggerHaptic();
                    AddSong(item.id);
                  }}
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
                  <Feather
                    name="plus"
                    size={16}
                    color={themeValues.COLORS.onSurface}
                  />
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
