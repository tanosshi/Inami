import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePlayerStore } from "../store/playerStore";
import { useSongStore } from "../store/songStore";
import { useThemeValues, useDynamicStyles } from "../hooks/useDynamicStyles";
import {
  getListeningHistory,
  type ListeningHistoryEntry,
} from "../utils/database";
import { triggerHaptic } from "../utils/haptics";
import SongCard from "../components/SongCard";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";

export default function HistoryScreen() {
  const router = useRouter();
  const themeValues = useThemeValues();
  const { playSong, setQueue, showPlayerOverlay } = usePlayerStore();
  const { songs } = useSongStore();

  const [historyEntries, setHistoryEntries] = useState<ListeningHistoryEntry[]>(
    []
  );
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideAnim = useRef(
    new Animated.Value(Dimensions.get("window").height)
  ).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropOpacity]);

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: Dimensions.get("window").height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.back();
    });
  };

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

  const styles = useDynamicStyles(() => ({
    overlay: {
      flex: 1,
    },
    backdrop: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      gap: SPACING.sm,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.surfaceContainerHigh,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    searchContainer: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: RADIUS.xl,
      paddingHorizontal: SPACING.md,
      height: 48,
      gap: SPACING.sm,
    },
    searchInput: {
      flex: 1,
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    clearButton: {
      padding: SPACING.xs,
    },
    titleContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineLarge,
      color: COLORS.onSurface,
    },
    sortButton: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.lg,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    listContent: {
      paddingHorizontal: SPACING.md,
      paddingBottom: 140,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.xl,
    },
    emptyText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurfaceVariant,
      textAlign: "center" as const,
      marginTop: SPACING.md,
    },
    timestampText: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: COLORS.onSurfaceVariant,
      marginLeft: SPACING.md + 52,
      marginTop: -SPACING.sm,
      marginBottom: SPACING.sm,
    },
  }));

  const loadHistory = useCallback(async () => {
    try {
      const entries = await getListeningHistory(10000, 0);
      setHistoryEntries(entries);
    } catch (error) {
      console.warn("[History] Error loading history:", error);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadHistory();
    } catch (error) {
      console.warn("[History] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredHistory = historyEntries
    .filter((entry) => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      return (
        entry.track.toLowerCase().includes(query) ||
        entry.artist.toLowerCase().includes(query) ||
        (entry.album && entry.album.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortDirection === "desc") {
        return b.timestamp - a.timestamp;
      } else {
        return a.timestamp - b.timestamp;
      }
    });

  const displaySongs = filteredHistory.map((entry) => {
    const matchingSong = songs.find(
      (s) =>
        s.title.toLowerCase() === entry.track.toLowerCase() &&
        s.artist.toLowerCase() === entry.artist.toLowerCase()
    );

    if (matchingSong) {
      return {
        ...matchingSong,
        historyId: entry.id,
        playedAt: entry.timestamp,
      };
    }

    return {
      id: `history-${entry.id}`,
      title: entry.track,
      artist: entry.artist,
      album: entry.album || "Unknown Album",
      duration: 0,
      uri: "",
      artwork: entry.artwork || null,
      palette: null,
      is_liked: 0,
      play_count: 0,
      historyId: entry.id,
      playedAt: entry.timestamp,
      created_at: new Date(entry.timestamp * 1000).toISOString(),
    };
  });

  const playSongHandler = (song: any) => {
    const actualSong = songs.find(
      (s) => s.id === song.id && song.id.indexOf("history-") !== 0
    );

    triggerHaptic();
    if (actualSong) {
      const playableSongs = displaySongs
        .filter((s) => s.id.indexOf("history-") !== 0)
        .map((s) => songs.find((song) => song.id === s.id))
        .filter(Boolean);

      setQueue(playableSongs as any);
      playSong(actualSong);
      showPlayerOverlay();
    }
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    triggerHaptic();
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isHistoryOnly = item.id.indexOf("history-") === 0;

    return (
      <View>
        <SongCard
          song={item}
          onPress={() => !isHistoryOnly && playSongHandler(item)}
          showOptions={!isHistoryOnly}
        />
        {item.playedAt && (
          <Text style={styles.timestampText}>
            {formatTimestamp(item.playedAt)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropOpacity }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            closeModal();
            triggerHaptic();
          }}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                closeModal();
                triggerHaptic();
              }}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={themeValues.COLORS.onSurface}
              />
            </TouchableOpacity>

            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={24}
                color={themeValues.COLORS.onSurfaceVariant}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search played songs"
                placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setSearchQuery("")}
                >
                  <MaterialIcons
                    name="close"
                    size={20}
                    color={themeValues.COLORS.onSurfaceVariant}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Listening History</Text>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={toggleSortDirection}
            >
              <MaterialIcons
                name={
                  sortDirection === "desc" ? "arrow-downward" : "arrow-upward"
                }
                size={24}
                color={themeValues.COLORS.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>

          {displaySongs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="history"
                size={64}
                color={themeValues.COLORS.onSurfaceVariant}
              />
              <Text style={styles.emptyText}>
                {debouncedSearchQuery
                  ? "No songs found matching your search"
                  : "No listening history yet"}
              </Text>
            </View>
          ) : (
            <FlashList
              data={displaySongs}
              renderItem={renderItem}
              keyExtractor={(item, index) =>
                `${item.historyId || item.id}-${index}`
              }
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={themeValues.COLORS.primary}
                />
              }
            />
          )}
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}
