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
  Modal,
  Pressable,
  PanResponder,
  Dimensions,
  Easing,
  UIManager,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import SongCard from "../SongCard";
import {
  COLORS,
  RADIUS,
  SPACING,
  TAB_CONFIG,
  TYPOGRAPHY,
} from "../../constants/theme";
import { extractMetadata } from "../../utils/metadataExtractor";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";

import { sanitizeFileName, scanDirectoryForAudio } from "../songs/helpers";
import { FolderScanModal, ImportUrlModal } from "../songs/modals";
import { validateAllImages } from "../../utils/imageValidation";
import { blendColors } from "../../utils/colorUtils";

const AnimatedSongCard = ({ song, onPress, showOptions, sortKey }: any) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.7,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -5,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [sortKey, fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <SongCard song={song} onPress={onPress} showOptions={showOptions} />
    </Animated.View>
  );
};

export default function Songs() {
  const themeValues = useThemeValues();
  const { songs, fetchSongs, addSong, importFromURL } = useSongStore();
  const { playSong, setQueue, currentSong, showPlayerOverlay } =
    usePlayerStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importTitle, setImportTitle] = useState("");
  const [importing, setImporting] = useState(false);
  const [scanningFolder, setScanningFolder] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState<"title" | "created_at" | "artist">(
    "created_at"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const searchAnimation = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const [sortKey, setSortKey] = useState(`${sortBy}-${sortDirection}`);

  const pickRandomArtist = () => {
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
  };

  const [placeholderArtist, setPlaceholderArtist] = useState<string>(() =>
    pickRandomArtist()
  );

  useEffect(() => {
    setPlaceholderArtist(pickRandomArtist());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs.length]);

  useEffect(() => {
    if (Platform.OS === "android") {
      UIManager.setLayoutAnimationEnabledExperimental &&
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const flatListRef = useRef<FlatList<any>>(null);
  const scrollbarRef = useRef<any>(null);
  const ALPHABET_LETTERS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];

  const getVisibleAlphabet = () => {
    return sortDirection === "asc"
      ? ["#", ...ALPHABET_LETTERS]
      : [...ALPHABET_LETTERS].slice().reverse().concat(["#"]);
  };
  const [dragging, setDragging] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const scrollbarLayout = useRef({ top: 0, height: 0 });
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const scrollbarAnim = useRef(new Animated.Value(0)).current;
  const PILL_HEIGHT = 120;
  const pillY = useRef(new Animated.Value(0)).current;

  const letterIndexMapRef = useRef<Map<string, number>>(new Map());

  const scrollToLetter = (letter: string) => {
    let index = letterIndexMapRef.current.get(letter);
    const alpha = getVisibleAlphabet();
    if (index === undefined) {
      const start = alpha.indexOf(letter);
      for (let i = start + 1; i < alpha.length; i++) {
        const idx = letterIndexMapRef.current.get(alpha[i]);
        if (idx !== undefined) {
          index = idx;
          break;
        }
      }
      if (index === undefined) {
        for (let i = start - 1; i >= 0; i--) {
          const idx = letterIndexMapRef.current.get(alpha[i]);
          if (idx !== undefined) {
            index = idx;
            break;
          }
        }
      }
    }
    if (index === undefined) return;
    try {
      flatListRef.current?.scrollToIndex({
        index,
        animated: true,
        viewPosition: 0.05,
      });
    } catch {
      flatListRef.current?.scrollToOffset({
        offset: Math.max(0, (index - 1) * 60),
        animated: true,
      });
    }
  };

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

  const handleTouchAtY = (pageY: number) => {
    const { top, height } = scrollbarLayout.current;
    if (!height || filteredSongs.length === 0) return;
    let rel = (pageY - top) / height;
    rel = Math.max(0, Math.min(0.999, rel));

    if (sortBy === "created_at") {
      const idx = Math.floor(rel * (filteredSongs.length - 1));
      const clamped = Math.max(0, Math.min(filteredSongs.length - 1, idx));
      const item = filteredSongs[clamped];
      const label = formatDateLabel(item?.created_at);
      setActiveLetter(label);
      try {
        flatListRef.current?.scrollToIndex({
          index: clamped,
          animated: true,
          viewPosition: 0.05,
        });
      } catch {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, (clamped - 1) * 60),
          animated: true,
        });
      }

      const maxOffset = Math.max(
        0,
        (scrollbarLayout.current.height || 0) - PILL_HEIGHT
      );
      const raw = rel * maxOffset - 50;
      const toValue = Math.max(0, Math.min(maxOffset, raw));
      Animated.timing(pillY, {
        toValue,
        duration: 220,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    const alpha = getVisibleAlphabet();
    const idx = Math.floor(rel * alpha.length);
    const letter = alpha[idx];
    setActiveLetter(letter);
    scrollToLetter(letter);

    const maxOffset = Math.max(
      0,
      (scrollbarLayout.current.height || 0) - PILL_HEIGHT
    );
    const raw = rel * maxOffset - 50; // move pill ~50px up
    const toValue = Math.max(0, Math.min(maxOffset, raw));
    Animated.timing(pillY, {
      toValue,
      duration: 220,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        setDragging(true);
        handleTouchAtY(e.nativeEvent.pageY);
        Animated.parallel([
          Animated.timing(overlayAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(scrollbarAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }),
        ]).start();
      },
      onPanResponderMove: (e) => {
        handleTouchAtY(e.nativeEvent.pageY);
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.timing(overlayAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scrollbarAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDragging(false);
          setActiveLetter(null);
        });
      },
    })
  ).current;

  const viewabilityConfig = { itemVisiblePercentThreshold: 10 };
  const onViewableItemsChanged = React.useCallback(
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
    headerLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.sm,
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
    searchWrapper: {
      overflow: "hidden" as const,
    },
    searchContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainer,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
      borderRadius: RADIUS.xl,
      paddingHorizontal: SPACING.md,
      height: 56,
      gap: SPACING.md,
    },
    searchInput: {
      flex: 1,
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    searchInputPlaceholder: {
      fontStyle: "italic" as const,
      opacity: 0.3,
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
      textAlign: "center" as const,
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
    sortModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sortModalBackdrop: {
      flex: 1,
    },
    sortModalContainer: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: blendColors(COLORS.background, COLORS.primary, 0.06),
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingBottom: SPACING.xl,
    },
    sortModalHandle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.onSurfaceVariant,
      borderRadius: RADIUS.full,
      alignSelf: "center" as const,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
      opacity: 0.5,
    },
    sortModalContent: {
      paddingHorizontal: SPACING.lg,
    },
    sortHeader: {
      marginBottom: SPACING.lg,
    },
    sortModalTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineSmall,
      color: COLORS.onSurface,
      textAlign: "left" as const,
    },
    sortOptions: {
      marginBottom: SPACING.lg,
    },
    sortOption: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.xs,
    },
    sortOptionLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.md,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: COLORS.outline,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    radioButtonSelected: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: themeValues.COLORS.primary,
    },
    sortOptionText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    sortDirectionContainer: {
      paddingTop: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: COLORS.outlineVariant,
    },
    sortDirectionLabel: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
      marginBottom: SPACING.sm,
      letterSpacing: 0.5,
    },
    sortDirectionOptions: {
      flexDirection: "row" as const,
    },
    sortDirectionButtonLeft: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderTopLeftRadius: RADIUS.lg,
      borderBottomLeftRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.outline,
      gap: SPACING.xs,
      backgroundColor: COLORS.surface,
      borderRightWidth: 0,
    },
    sortDirectionButtonRight: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderTopRightRadius: RADIUS.lg,
      borderBottomRightRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.outline,
      gap: SPACING.xs,
      backgroundColor: COLORS.surface,
      borderLeftWidth: 0,
    },
    sortDirectionButtonActive: {
      backgroundColor: themeValues.COLORS.primary,
      borderColor: themeValues.COLORS.primary,
    },
    sortDirectionText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelMedium,
      color: COLORS.onSurfaceVariant,
    },
    sortDirectionTextActive: {
      fontFamily: "Inter_600SemiBold",
      color: themeValues.COLORS.onPrimary,
    },

    scrollbarContainer: {
      position: "absolute" as const,
      right: SPACING.sm,
      top: 120,
      bottom: 120,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.xs,
    },
    scrollbarTouchArea: {
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: "transparent",
      paddingVertical: SPACING.sm,
    },
    // legacy alphabet letters removed; we now show a pill instead
    scrollbarPillWrap: {
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingVertical: SPACING.sm,
    },
    scrollbarPill: {
      width: 6,
      height: 120,
      borderRadius: 99,
      backgroundColor: COLORS.onSurfaceVariant,
      opacity: 0.45,
    },
    letterOverlay: {
      position: "absolute" as const,
      right: 90,
      top: Dimensions.get("window").height * 0.45,
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: themeValues.COLORS.surface,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    letterOverlayText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineLarge,
      color: themeValues.COLORS.onSurface,
    },
  }));

  const toggleSearch = () => {
    const toValue = searchExpanded ? 0 : 1;
    Animated.timing(searchAnimation, {
      toValue,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      if (toValue === 1) {
        searchInputRef.current?.focus();
        setPlaceholderArtist(pickRandomArtist());
      } else setSearchQuery("");
    });
    if (toValue === 1) {
      searchInputRef.current?.focus();
      setPlaceholderArtist(pickRandomArtist());
    } else setSearchQuery("");
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
    if (songs.length === 0) fetchSongs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const filteredSongs = songs
    .filter(
      (song) =>
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.album.toLowerCase().includes(searchQuery.toLowerCase())
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

  const PlaySong = (song: any, index: number) => {
    setQueue(filteredSongs);
    playSong(song);
    showPlayerOverlay();
  };

  const PickFolder = async () => {
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

  const ImportURL = async () => {
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

  const ShuffleAll = () => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
    playSong(shuffled[0]);
    showPlayerOverlay();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              triggerHaptic();
              toggleSearch();
            }}
          >
            <MaterialIcons
              name="search"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
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
              PickFolder();
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
            color={themeValues.COLORS.onSurfaceVariant}
          />
          <TextInput
            ref={searchInputRef}
            style={[
              styles.searchInput,
              searchQuery === "" && styles.searchInputPlaceholder,
            ]}
            placeholder={`${placeholderArtist}?`}
            placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            onPress={() => {
              triggerHaptic();
              toggleSearch();
            }}
          >
            <MaterialIcons
              name="close"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Text style={styles.songCount}>
        {filteredSongs.length} {filteredSongs.length === 1 ? "song" : "songs"}
      </Text>

      <FlatList
        ref={flatListRef}
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        onScroll={(e) => {
          try {
            const { contentOffset, contentSize, layoutMeasurement } =
              e.nativeEvent;
            const maxScroll = Math.max(
              1,
              contentSize.height - layoutMeasurement.height
            );
            const ratio = Math.max(0, Math.min(1, contentOffset.y / maxScroll));
            const maxOffset = Math.max(
              0,
              (scrollbarLayout.current.height || 0) - PILL_HEIGHT
            );
            const raw = ratio * maxOffset - 50;
            const toValue = Math.max(0, Math.min(maxOffset, raw));
            Animated.timing(pillY, {
              toValue,
              duration: 220,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }).start();
          } catch {}
        }}
        onScrollBeginDrag={() => {
          Animated.timing(scrollbarAnim, {
            toValue: 1,
            duration: 120,
            useNativeDriver: true,
          }).start();
        }}
        onScrollEndDrag={() => {
          Animated.timing(scrollbarAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }).start();
        }}
        renderItem={({ item, index }) => (
          <AnimatedSongCard
            song={item}
            onPress={() => {
              triggerHaptic();
              PlaySong(item, index);
            }}
            showOptions
            sortKey={sortKey}
          />
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
              name="library-music"
              size={64}
              color={themeValues.COLORS.onSurfaceVariant}
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
        onImport={ImportURL}
      />

      <FolderScanModal show={scanningFolder} scanProgress={scanProgress} />

      {/* Hidden-until-used scrollbar pill */}
      <View
        ref={scrollbarRef}
        style={styles.scrollbarContainer}
        onLayout={() => {
          scrollbarRef.current?.measureInWindow(
            (x: number, y: number, w: number, h: number) => {
              scrollbarLayout.current = { top: y, height: h };
            }
          );
        }}
      >
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.scrollbarPillWrap,
            {
              opacity: scrollbarAnim,
              transform: [
                {
                  scale: scrollbarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.scrollbarPill,
              { transform: [{ translateY: pillY }] },
            ]}
          />
        </Animated.View>
      </View>

      {/* Floating letter overlay (only visible when interacting) */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.letterOverlay,
          {
            opacity: overlayAnim,
            transform: [
              {
                scale: overlayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.letterOverlayText}>
          {dragging ? activeLetter : ""}
        </Text>
      </Animated.View>

      <Modal
        visible={showSortModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.sortModalOverlay}>
          <Pressable
            style={styles.sortModalBackdrop}
            onPress={() => setShowSortModal(false)}
          />
          <View style={styles.sortModalContainer}>
            <View style={styles.sortModalHandle} />
            <View style={styles.sortModalContent}>
              <View style={styles.sortHeader}>
                <Text style={styles.sortModalTitle}>Sort by</Text>
              </View>

              <View style={styles.sortOptions}>
                <TouchableOpacity
                  style={styles.sortOption}
                  onPress={() => {
                    setSortBy("title");
                    setSortKey(`title-${sortDirection}`);
                    setShowSortModal(false);
                  }}
                >
                  <View style={styles.sortOptionLeft}>
                    <View style={styles.radioButton}>
                      {sortBy === "title" && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.sortOptionText}>Title</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sortOption}
                  onPress={() => {
                    setSortBy("artist");
                    setSortKey(`artist-${sortDirection}`);
                    setShowSortModal(false);
                  }}
                >
                  <View style={styles.sortOptionLeft}>
                    <View style={styles.radioButton}>
                      {sortBy === "artist" && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.sortOptionText}>Artist</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sortOption}
                  onPress={() => {
                    setSortBy("created_at");
                    setSortKey(`created_at-${sortDirection}`);
                    setShowSortModal(false);
                  }}
                >
                  <View style={styles.sortOptionLeft}>
                    <View style={styles.radioButton}>
                      {sortBy === "created_at" && (
                        <View style={styles.radioButtonSelected} />
                      )}
                    </View>
                    <Text style={styles.sortOptionText}>Recently Added</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.sortDirectionContainer}>
                <Text style={styles.sortDirectionLabel}>Order</Text>
                <View style={styles.sortDirectionOptions}>
                  <TouchableOpacity
                    style={[
                      styles.sortDirectionButtonLeft,
                      sortDirection === "asc" &&
                        styles.sortDirectionButtonActive,
                    ]}
                    onPress={() => {
                      setSortDirection("asc");
                      setSortKey(`${sortBy}-asc`);
                    }}
                  >
                    <MaterialIcons
                      name="arrow-upward"
                      size={16}
                      color={
                        sortDirection === "asc"
                          ? themeValues.COLORS.onPrimary
                          : themeValues.COLORS.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.sortDirectionText,
                        sortDirection === "asc" &&
                          styles.sortDirectionTextActive,
                      ]}
                    >
                      Ascending
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.sortDirectionButtonRight,
                      sortDirection === "desc" &&
                        styles.sortDirectionButtonActive,
                    ]}
                    onPress={() => {
                      setSortDirection("desc");
                      setSortKey(`${sortBy}-desc`);
                    }}
                  >
                    <MaterialIcons
                      name="arrow-downward"
                      size={16}
                      color={
                        sortDirection === "desc"
                          ? themeValues.COLORS.onPrimary
                          : themeValues.COLORS.onSurfaceVariant
                      }
                    />
                    <Text
                      style={[
                        styles.sortDirectionText,
                        sortDirection === "desc" &&
                          styles.sortDirectionTextActive,
                      ]}
                    >
                      Descending
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={[
          styles.shuffleButton,
          currentSong && styles.shuffleButtonWithMiniPlayer,
        ]}
        onPress={() => {
          triggerHaptic();
          ShuffleAll();
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
