import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { usePlaylistStore } from "../../store/playlistStore";
import PlaylistCard from "../PlaylistCard";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

import { CreatePlaylistModal } from "../playlists/modals";

export default function Playlists() {
  const router = useRouter();
  const themeValues = useThemeValues();
  const { playlists, fetchPlaylists, createPlaylist } = usePlaylistStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistDescription, setPlaylistDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineMedium,
      color: COLORS.onSurface,
    },
    headerActions: {
      flexDirection: "row" as const,
      gap: SPACING.sm,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.surfaceContainerHigh,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    fabButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.lg,
      backgroundColor: themeValues.COLORS.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    row: {
      justifyContent: "space-between" as const,
      paddingHorizontal: SPACING.md,
      marginBottom: SPACING.md,
    },
    listContent: {
      paddingTop: SPACING.sm,
      paddingBottom: 140,
    },
    emptyState: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: 80,
    },
    emptyTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurface,
      marginTop: SPACING.md,
    },
    emptyText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
      marginTop: SPACING.sm,
    },
  }));

  useEffect(() => {
    if (playlists.length === 0) {
      fetchPlaylists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlaylists();
    setRefreshing(false);
  };

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      Alert.alert("Error", "Please enter a playlist name");
      return;
    }

    setCreating(true);
    try {
      await createPlaylist({
        name: playlistName.trim(),
        description: playlistDescription.trim(),
      });
      await fetchPlaylists();
      setShowCreateModal(false);
      setPlaylistName("");
      setPlaylistDescription("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create playlist");
    } finally {
      setCreating(false);
    }
  };

  const ImportM3U = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        await FileSystem.readAsStringAsync(asset.uri);
        const importedPlaylistName = asset.name.replace(/\.[^/.]+$/, "");

        await createPlaylist({
          name: importedPlaylistName,
          description: "Imported from M3U",
        });
        await fetchPlaylists();
        Alert.alert("Success", "Playlist created from M3U file");
      }
    } catch (error: any) {
      console.error("Error importing M3U:", error);
      Alert.alert("Error", "Failed to import M3U file");
    }
  };

  const PlaylistPress = (playlist: any) => {
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Playlists</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={ImportM3U}>
            <MaterialIcons
              name="file-upload"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={() => setShowCreateModal(true)}
          >
            <MaterialIcons
              name="add"
              size={24}
              color={themeValues.COLORS.onPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Playlists Grid */}
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PlaylistCard playlist={item} onPress={() => PlaylistPress(item)} />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeValues.COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons
              name="queue-music"
              size={64}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <Text style={styles.emptyTitle}>No playlists yet</Text>
            <Text style={styles.emptyText}>
              Create a playlist or import from M3U
            </Text>
          </View>
        }
      />

      <CreatePlaylistModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        playlistName={playlistName}
        setPlaylistName={setPlaylistName}
        playlistDescription={playlistDescription}
        setPlaylistDescription={setPlaylistDescription}
        creating={creating}
        onCreate={handleCreatePlaylist}
      />
    </SafeAreaView>
  );
}
