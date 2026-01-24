import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useSongStore } from "../../store/songStore";
import {
  COLORS,
  RADIUS,
  SPACING,
  TAB_CONFIG,
  TYPOGRAPHY,
} from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { useRouter } from "expo-router";
import { triggerHaptic } from "../../utils/haptics";
import { getAllArtists } from "../../utils/database";
import { validateAllImages } from "../../utils/imageValidation";

export default function ArtistsTab() {
  const themeValues = useThemeValues();
  const router = useRouter();
  const { songs, fetchSongs } = useSongStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const searchAnimation = React.useRef(new Animated.Value(0)).current;
  const searchInputRef = React.useRef<TextInput>(null);

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
    searchWrapper: {
      overflow: "hidden" as const,
    },
    searchContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainerHigh,
      marginHorizontal: SPACING.md,
      marginBottom: SPACING.sm,
      borderRadius: RADIUS.xxl,
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
    artistCount: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
      paddingHorizontal: SPACING.md,
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
    artistCard: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: SPACING.md - 2,
      gap: SPACING.md,
      justifyContent: "space-between" as const,
    },
    artistAvatar: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.surfaceContainer,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      overflow: "hidden" as const,
    },
    artistInfo: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      flex: 1,
      gap: SPACING.md,
    },
    artistName: {
      fontSize: 18,
      fontWeight: "600" as const,
      color: COLORS.onSurface,
    },
    artistSongCount: {
      fontSize: 14,
      color: COLORS.onSurfaceVariant,
      marginLeft: 8,
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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSongs();
      await validateAllImages();
    } catch {
    } finally {
      setRefreshing(false);
    }
  };

  const artists = useMemo(() => {
    const map: Record<string, { count: number; artwork?: string }> = {};
    songs.forEach((song) => {
      if (!map[song.artist]) {
        map[song.artist] = { count: 1, artwork: song.artwork };
      } else {
        map[song.artist].count++;
        if (!map[song.artist].artwork && song.artwork) {
          map[song.artist].artwork = song.artwork;
        }
      }
    });
    let arr = Object.entries(map).map(([name, { count, artwork }]) => ({
      name,
      count,
      artwork,
    }));
    if (searchQuery) {
      arr = arr.filter((a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return arr.sort((a, b) => a.name.localeCompare(b.name));
  }, [songs, searchQuery]);

  const [artistImages, setArtistImages] = React.useState<
    Record<string, string>
  >({});
  const _lastImgsKey = React.useRef("");
  const namesKey = artists.map((a) => a.name).join("|");

  React.useEffect(() => {
    let mounted = true;
    const names = artists.map((a) => a.name);
    if (names.length === 0) return;

    (async () => {
      try {
        const imgs: Record<string, string> = {};

        try {
          const all = await getAllArtists();
          const artistMap: Record<string, string> = {};

          all.forEach((a: any) => {
            const key = String(a.name || "").trim();
            if (!key || !names.includes(key)) return;

            const url = a.image_url || a.fallback_url || null;
            if (!url) return;

            const existingUrl = artistMap[key];

            if (!existingUrl) artistMap[key] = String(url);
            else artistMap[key] = String(url);
          });

          Object.entries(artistMap).forEach(([name, url]) => {
            imgs[name] = url;
          });
        } catch {}

        const imgsKey = JSON.stringify(imgs);
        if (imgsKey !== _lastImgsKey.current) {
          _lastImgsKey.current = imgsKey;
          if (mounted) setArtistImages(imgs);
        }
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, [namesKey, artists]);

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
      </View>
      <Text style={styles.title}>{TAB_CONFIG.artists?.name || "Artists"}</Text>
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
            style={styles.searchInput}
            placeholder="Search artists"
            placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                setSearchQuery("");
              }}
            >
              <MaterialIcons
                name="close"
                size={24}
                color={themeValues.COLORS.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
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
      <Text style={styles.artistCount}>
        {artists.length} {artists.length === 1 ? "artist" : "artists"}
      </Text>
      <FlatList
        data={artists}
        keyExtractor={(item) => item.name}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.artistCard}
            onPress={() => {
              triggerHaptic();
              router.push({
                pathname: "/artist/[name]",
                params: { name: encodeURIComponent(item.name) },
              });
            }}
          >
            <View style={styles.artistInfo}>
              <View style={styles.artistAvatar}>
                {(() => {
                  const hasArtwork = !!item.artwork;
                  const hasArtistImage = !!artistImages[item.name];
                  const imageUri = artistImages[item.name] || item.artwork;

                  return hasArtwork || hasArtistImage ? (
                    <Animated.Image
                      source={{ uri: imageUri }}
                      style={{ width: 48, height: 48, borderRadius: RADIUS.md }}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons
                      name="person"
                      size={28}
                      color={themeValues.COLORS.primary}
                    />
                  );
                })()}
              </View>
              <Text style={styles.artistName}>
                {item.name.length > 21
                  ? item.name.slice(0, 21) + "..."
                  : item.name}
              </Text>
            </View>
            <Text style={styles.artistSongCount}>
              {item.count} {item.count === 1 ? "song" : "songs"}
            </Text>
          </TouchableOpacity>
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
              name="person-off"
              size={64}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <Text style={styles.emptyTitle}>No artists found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? "Try a different search"
                : "No artists in your library yet"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
