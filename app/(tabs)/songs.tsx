import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as FileSystem from "expo-file-system/legacy";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import SongCard from "../../components/SongCard";
import { COLORS, RADIUS, SPACING, TAB_CONFIG } from "../../constants/theme";
import { extractMetadata } from "../../utils/metadataExtractor";

import {
  isAudioFile,
  sanitizeFileName,
  scanDirectoryForAudio,
} from "../../components/songs/helpers";
import { FolderScanModal, ImportUrlModal } from "../../components/songs/modals";
import { styles } from "../../components/songs/styles";

export default function SongsScreen() {
  const router = useRouter();
  const { songs, fetchSongs, addSong, importFromURL } = useSongStore();
  const { playSong, setQueue, currentSong } = usePlayerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importing, setImporting] = useState(false);
  const [scanningFolder, setScanningFolder] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);

  const toggleSearch = () => {
    const toValue = searchExpanded ? 0 : 1;
    Animated.timing(searchAnimation, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (toValue === 1) {
        searchInputRef.current?.focus();
      } else {
        setSearchQuery("");
      }
    });
    setSearchExpanded(!searchExpanded);
  };

  const searchBarHeight = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 72],
  });

  const searchBarOpacity = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  useEffect(() => {
    fetchSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSongs();
    setRefreshing(false);
  };

  const filteredSongs = songs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePlaySong = (song: any, index: number) => {
    setQueue(filteredSongs);
    playSong(song);
    router.push("/player");
  };

  const handlePickFolder = async () => {
    try {
      if (Platform.OS === "android") {
        const permissions =
          await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          Alert.alert(
            "Permission Denied",
            "Please grant folder access permission to scan for music"
          );
          return;
        }

        setScanningFolder(true);
        setScanProgress({ current: 0, total: 0 });

        const audioFiles = await scanDirectoryForAudio(
          permissions.directoryUri
        );

        if (audioFiles.length === 0) {
          Alert.alert(
            "No Music Found",
            "No audio files found in the selected folder"
          );
          setScanningFolder(false);
          return;
        }

        setScanProgress({ current: 0, total: audioFiles.length });
        let addedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < audioFiles.length; i++) {
          const fileUri = audioFiles[i];
          setScanProgress({ current: i + 1, total: audioFiles.length });

          try {
            const decodedUri = decodeURIComponent(fileUri);
            const fileName = decodedUri.substring(
              decodedUri.lastIndexOf("/") + 1
            );
            const baseName = fileName.replace(/\.[^/.]+$/, "");

            const safeFileName = sanitizeFileName(fileName);
            const cacheFileName = `${Date.now()}_${i}_${safeFileName}`;
            const cacheUri = FileSystem.cacheDirectory + cacheFileName;

            await FileSystem.StorageAccessFramework.copyAsync({
              from: fileUri,
              to: cacheUri,
            });

            let metadata;
            try {
              metadata = await extractMetadata(cacheUri, baseName);
            } catch (metadataError) {
              console.warn(
                `Metadata extraction failed for ${fileName}, using fallback:`,
                metadataError
              );
              metadata = {
                title: baseName,
                artist: "Unknown Artist",
                album: "Unknown Album",
                duration: 0,
                artwork: undefined,
                palette: undefined,
              };
            }

            await addSong({
              title: metadata.title,
              artist: metadata.artist,
              album: metadata.album,
              uri: cacheUri,
              duration: metadata.duration,
              artwork: metadata.artwork,
              palette: metadata.palette,
            });
            addedCount++;
          } catch (error) {
            console.error(`Error processing ${fileUri}:`, error);
            errorCount++;
          }
        }

        setScanningFolder(false);
        await fetchSongs();

        if (errorCount > 0) {
          Alert.alert(
            "Import Complete",
            `Added ${addedCount} song(s). ${errorCount} file(s) could not be imported.`
          );
        } else {
          Alert.alert("Success", `Added ${addedCount} song(s) from folder`);
        }
      }
    } catch (error) {
      console.error("Error picking folder:", error);
      setScanningFolder(false);
      Alert.alert("Error", "Failed to import music files");
    }
  };

  const handleImportURL = async () => {
    if (!importUrl.trim()) {
      Alert.alert("Error", "Please enter a URL");
      return;
    }

    setImporting(true);
    try {
      await importFromURL(importUrl.trim(), importTitle.trim() || undefined);
      await fetchSongs();
      setShowImportModal(false);
      setImportUrl("");
      setImportTitle("");
      Alert.alert("Success", "Song imported successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to import song");
    } finally {
      setImporting(false);
    }
  };

  const handleShuffleAll = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playSong(shuffled[0]);
    router.push("/player");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
            <MaterialIcons
              name="search"
              size={24}
              color={COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.iconButton,
            {
              flexDirection: "row",
              borderRadius: RADIUS.xxl,
              paddingHorizontal: SPACING.md,
              width: "auto",
              gap: SPACING.lg,
            },
          ]}
        >
          <TouchableOpacity onPress={handlePickFolder}>
            <MaterialIcons
              name="folder-open"
              size={24}
              color={COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowImportModal(true)}>
            <MaterialIcons
              name="link"
              size={24}
              color={COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.title}>{TAB_CONFIG.songs.name}</Text>

      <Animated.View
        style={[
          styles.searchWrapper,
          {
            height: searchBarHeight,
            opacity: searchBarOpacity,
          },
        ]}
      >
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={24}
            color={COLORS.onSurfaceVariant}
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search songs, artists, albums"
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons
                name="close"
                size={24}
                color={COLORS.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={toggleSearch}>
            <MaterialIcons
              name="close"
              size={24}
              color={COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Text style={styles.songCount}>
        {filteredSongs.length} {filteredSongs.length === 1 ? "song" : "songs"}
      </Text>

      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <SongCard
            song={item}
            onPress={() => handlePlaySong(item, index)}
            showOptions
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons
              name="library-music"
              size={64}
              color={COLORS.onSurfaceVariant}
            />
            <Text style={styles.emptyTitle}>No songs found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Try a different search"
                : "Add songs from your device or import from URL"}
            </Text>
          </View>
        }
      />

      <ImportUrlModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        importUrl={importUrl}
        setImportUrl={setImportUrl}
        importTitle={importTitle}
        setImportTitle={setImportTitle}
        importing={importing}
        onImport={handleImportURL}
      />

      <FolderScanModal show={scanningFolder} scanProgress={scanProgress} />

      <TouchableOpacity
        style={[
          styles.shuffleButton,
          currentSong && styles.shuffleButtonWithMiniPlayer,
        ]}
        onPress={handleShuffleAll}
      >
        <MaterialIcons name="shuffle" size={28} color={COLORS.onPrimary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
