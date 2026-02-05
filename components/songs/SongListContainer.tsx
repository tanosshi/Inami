import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
  Animated,
} from "react-native";
import { FlashList, type FlashListRef } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import { useThemeValues, useDynamicStyles } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";
import { validateAllImages } from "../../utils/imageValidation";
import { extractMetadata } from "../../utils/metadataExtractor";
import { saveToStorage, getFromStorage } from "../../utils/database";
import { sanitizeFileName, scanDirectoryForAudio } from "./helpers";
import { FolderScanModal, ImportUrlModal } from "./modals";
import SongListItem from "./SongListItem";
import SearchBar from "./SearchBar";
import SortModal from "./SortModal";
import EmptyState from "./EmptyState";
import AlphabetScrollbar from "./AlphabetScrollbar";
import SongOptionsModal from "../SongOptionsModal";
import {
  COLORS,
  RADIUS,
  SPACING,
  TAB_CONFIG,
  TYPOGRAPHY,
} from "../../constants/theme";

export default function SongListContainer() {
  const themeValues = useThemeValues();
  const { songs, fetchSongs, addSong, importFromURL } = useSongStore();
  const { playSong, setQueue, currentSong, showPlayerOverlay } =
    usePlayerStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchAnimation = useRef(new Animated.Value(0)).current;

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (searchQuery === "") {
      setDebouncedSearchQuery("");
      if (searchDebounceRef.current !== null) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => {
      if (searchDebounceRef.current !== null) {
        clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [searchQuery]);

  const [refreshing, setRefreshing] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importing, setImporting] = useState(false);

  const [scanningFolder, setScanningFolder] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<"title" | "created_at" | "artist">(
    "title"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const flatListRef = useRef<FlashListRef<any>>(null);
  const viewportHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const [maxScroll, setMaxScroll] = useState(1);

  const [dragging, setDragging] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const letterIndexMapRef = useRef<Map<string, number>>(new Map());
  const filteredSongsRef = useRef<any[]>([]);
  const [optionsSong, setOptionsSong] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getFromStorage("songSortPrefs");
        if (saved) {
          if (saved.sortBy) setSortBy(saved.sortBy);
          if (saved.sortDirection) setSortDirection(saved.sortDirection);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    saveToStorage("songSortPrefs", { sortBy, sortDirection }).catch(() => {});
  }, [sortBy, sortDirection]);

  const pickRandomArtist = useCallback(() => {
    try {
      if (songs && songs.length > 0) {
        const unique = Array.from(
          new Set(
            songs.map((s: any) => (s.artist || "").trim()).filter(Boolean)
          )
        );
        if (unique.length > 0) {
          return unique[Math.floor(Math.random() * unique.length)];
        }
      }
    } catch {}
    return "Search songs, artists etc.";
  }, [songs]);

  const [placeholderArtist, setPlaceholderArtist] = useState<string>(() =>
    pickRandomArtist()
  );

  useEffect(() => {
    setPlaceholderArtist(pickRandomArtist());
  }, [songs.length, pickRandomArtist]);

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
      position: "relative" as const,
    },
    headerLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.sm,
      position: "relative" as const,
      flex: 1,
    },
    searchButton: {
      width: 40,
      height: 40,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineLarge,
      fontWeight: "100" as const,
      color: COLORS.onSurface,
      marginTop: 12,
      marginLeft: 27,
      marginBottom: 17,
    },
    titleContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingRight: SPACING.md,
    },
    sortButton: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.lg,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginTop: 12,
      marginBottom: 17,
      paddingRight: 12,
    },
    headerActions: {
      flexDirection: "row" as const,
      gap: SPACING.xs,
    },
    iconButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.surfaceContainerHigh,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    songCount: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
      paddingHorizontal: SPACING.md,
      display: "none" as const,
      paddingVertical: SPACING.md,
    },
    listContent: {
      paddingHorizontal: SPACING.md,
      paddingBottom: 140,
    },
    shuffleButton: {
      position: "absolute" as const,
      bottom: 22,
      right: SPACING.lg,
      width: 56,
      height: 56,
      borderRadius: RADIUS.lg,
      backgroundColor: themeValues.COLORS.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.27,
      shadowRadius: 4.65,
    },
    shuffleButtonWithMiniPlayer: {
      bottom: 95,
    },
  }));

  const filteredSongs = useMemo(() => {
    const query = debouncedSearchQuery.toLowerCase();
    return songs
      .filter(
        (song) =>
          song.title.toLowerCase().includes(query) ||
          song.artist.toLowerCase().includes(query) ||
          song.album.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
          case "title":
            aValue = a.title.toLowerCase();
            bValue = b.title.toLowerCase();
            break;
          case "artist":
            aValue = a.artist.toLowerCase();
            bValue = b.artist.toLowerCase();
            break;
          case "created_at":
            aValue = new Date(a.created_at || 0).getTime();
            bValue = new Date(b.created_at || 0).getTime();
            break;
          default:
            return 0;
        }

        if (aValue < bValue) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
  }, [songs, debouncedSearchQuery, sortBy, sortDirection]);

  filteredSongsRef.current = filteredSongs;

  useEffect(() => {
    const map = new Map<string, number>();

    for (let i = 0; i < filteredSongs.length; i++) {
      const item = filteredSongs[i];
      const source = sortBy === "artist" ? item.artist || "" : item.title || "";
      const ch = (source?.[0] || "#").toUpperCase();
      const key = /[A-Z]/.test(ch) ? ch : "#";
      if (!map.has(key)) map.set(key, i);
    }

    letterIndexMapRef.current = map;
  }, [filteredSongs, sortBy, sortDirection]);

  const updateMaxScroll = useCallback(() => {
    const ch = contentHeightRef.current;
    const vh = viewportHeightRef.current;
    setMaxScroll(Math.max(1, ch - vh));
  }, []);

  const formatDateLabel = (v?: string | number | null) => {
    if (!v) return "";
    const d = new Date(v);
    try {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d.toDateString();
    }
  };

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 10 }).current;
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (dragging) return;
      if (viewableItems && viewableItems.length > 0) {
        const first = viewableItems[0].item;
        if (sortBy === "created_at") {
          setActiveLetter(formatDateLabel(first.created_at));
        } else {
          const source =
            sortBy === "artist" ? first.artist || "" : first.title || "";
          const ch = (source?.[0] || "#").toUpperCase();
          const key = /[A-Z]/.test(ch) ? ch : "#";
          setActiveLetter(key);
        }
      }
    },
    [dragging, sortBy]
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSongs();
      await validateAllImages();
    } catch (error) {
      console.warn("[Songs] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const playSongHandler = useCallback(
    (song: any, index: number) => {
      setQueue(filteredSongsRef.current);
      playSong(song);
      showPlayerOverlay();
    },
    [setQueue, playSong, showPlayerOverlay]
  );

  const pickFolder = async () => {
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

  const importURL = async () => {
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

  const shuffleAll = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playSong(shuffled[0]);
    showPlayerOverlay();
  };

  const keyExtractor = useCallback((item: any) => item.id, []);

  const handleScroll = useCallback(
    (e: any) => {
      scrollY.setValue(e.nativeEvent.contentOffset.y);
    },
    [scrollY]
  );

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeightRef.current = h;
      updateMaxScroll();
    },
    [updateMaxScroll]
  );

  const handleLayout = useCallback(
    (e: any) => {
      viewportHeightRef.current = e.nativeEvent.layout.height;
      updateMaxScroll();
    },
    [updateMaxScroll]
  );

  const handleOpenOptions = useCallback((song: any) => {
    setOptionsSong(song);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <SongListItem
        song={item}
        onPress={() => {
          triggerHaptic();
          playSongHandler(item, index);
        }}
        onLongPress={() => handleOpenOptions(item)}
        showOptions
      />
    ),
    [playSongHandler, handleOpenOptions]
  );

  useEffect(() => {
    if (songs.length === 0) fetchSongs();
  }, [fetchSongs, songs.length]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!searchExpanded && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => {
                triggerHaptic();
                setSearchExpanded(!searchExpanded);
              }}
            >
              <MaterialIcons
                name="search"
                size={24}
                color={themeValues.COLORS.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
        </View>

        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchExpanded={searchExpanded}
          setSearchExpanded={setSearchExpanded}
          placeholderArtist={placeholderArtist}
          searchAnimation={searchAnimation}
        />
        <View
          style={[
            styles.iconButton,
            {
              flexDirection: "row" as const,
              borderRadius: RADIUS.xxl,
              paddingHorizontal: SPACING.md,
              width: "auto",
              gap: SPACING.lg,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              pickFolder();
            }}
          >
            <MaterialIcons
              name="folder-open"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              setShowImportModal(true);
            }}
          >
            <MaterialIcons
              name="link"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{TAB_CONFIG.songs.name}</Text>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            triggerHaptic();
            setShowSortModal(true);
          }}
        >
          <MaterialIcons
            name="sort"
            size={20}
            color={themeValues.COLORS.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.songCount}>
        {filteredSongs.length} {filteredSongs.length === 1 ? "song" : "songs"}
      </Text>

      <FlashList
        ref={flatListRef}
        data={filteredSongs}
        keyExtractor={keyExtractor}
        drawDistance={300}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeValues.COLORS.primary}
          />
        }
        ListEmptyComponent={<EmptyState searchQuery={searchQuery} />}
      />

      <ImportUrlModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        importUrl={importUrl}
        setImportUrl={setImportUrl}
        importTitle={importTitle}
        setImportTitle={setImportTitle}
        importing={importing}
        onImport={importURL}
      />

      <FolderScanModal show={scanningFolder} scanProgress={scanProgress} />

      <AlphabetScrollbar
        sortBy={sortBy}
        sortDirection={sortDirection}
        filteredSongs={filteredSongs}
        letterIndexMap={letterIndexMapRef.current}
        maxScroll={maxScroll}
        scrollY={scrollY}
        flatListRef={flatListRef}
        dragging={dragging}
        setDragging={setDragging}
        activeLetter={activeLetter}
        setActiveLetter={setActiveLetter}
      />

      <SortModal
        show={showSortModal}
        onClose={() => setShowSortModal(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
      />

      {optionsSong && (
        <SongOptionsModal
          visible={!!optionsSong}
          onClose={() => setOptionsSong(null)}
          song={optionsSong}
        />
      )}

      <TouchableOpacity
        style={[
          styles.shuffleButton,
          currentSong && styles.shuffleButtonWithMiniPlayer,
        ]}
        onPress={() => {
          triggerHaptic();
          shuffleAll();
        }}
      >
        <MaterialIcons
          name="shuffle"
          size={28}
          color={themeValues.COLORS.onPrimary}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
