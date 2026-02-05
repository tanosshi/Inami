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
import { triggerHaptic } from "../utils/haptics";
import SongCard from "../components/SongCard";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";

export default function MostPlayedScreen() {
  const router = useRouter();
  const themeValues = useThemeValues();
  const { playSong, setQueue, showPlayerOverlay } = usePlayerStore();
  const { songs } = useSongStore();

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
    playCountText: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
      color: COLORS.onSurfaceVariant,
      marginLeft: SPACING.md + 52,
      marginTop: -SPACING.sm,
      marginBottom: SPACING.sm,
    },
  }));

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.warn("[Most Played] Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredSongs = songs
    .filter((song) => song.play_count > 0)
    .filter((song) => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      return (
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query) ||
        (song.album && song.album.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => {
      if (sortDirection === "desc") {
        return b.play_count - a.play_count;
      } else {
        return a.play_count - b.play_count;
      }
    });

  const playSongHandler = (song: any) => {
    triggerHaptic();
    setQueue(filteredSongs);
    playSong(song);
    showPlayerOverlay();
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === "desc" ? "asc" : "desc"));
    triggerHaptic();
  };

  const formatPlayCount = (count: number) => {
    if (count === 1) return "Played once";
    if (count < 1000) return `Played ${count} times`;
    return `Played ${(count / 1000).toFixed(1)}K times`;
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View>
        <SongCard
          song={item}
          onPress={() => playSongHandler(item)}
          showOptions={true}
        />
        <Text style={styles.playCountText}>
          {formatPlayCount(item.play_count)}
        </Text>
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
                placeholder="Search most played songs..."
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
            <Text style={styles.title}>Most Played</Text>
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

          {filteredSongs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="repeat"
                size={64}
                color={themeValues.COLORS.onSurfaceVariant}
              />
              <Text style={styles.emptyText}>
                {debouncedSearchQuery
                  ? "No songs found matching your search"
                  : "No played songs yet"}
              </Text>
            </View>
          ) : (
            <FlashList
              data={filteredSongs}
              renderItem={renderItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
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
