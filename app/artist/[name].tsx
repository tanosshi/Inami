import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as ImageColors from "react-native-image-colors";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import SongCard from "../../components/SongCard";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";
import { getAllArtists } from "../../utils/database";
import { CommentsSection } from "./comments";
import { isTooWhiteish } from "../../utils/colorUtils";

export default function ArtistDetailScreen() {
  const router = useRouter();
  const { name } = useLocalSearchParams<{ name: string }>();
  const { songs, fetchSongs } = useSongStore();
  const { playSong, setQueue, showPlayerOverlay } = usePlayerStore();
  const [loading, setLoading] = useState(true);
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  const imageHeight = screenHeight * 0.5;
  const imageWidth = screenWidth;

  const artistName = name ? decodeURIComponent(name) : "";

  const styles = useDynamicStyles(() => {
    const artistNameFontSize =
      artistName.length > 12 ? 43 - 2 * (artistName.length - 12) : 43;
    return {
      container: {
        flex: 1,
        backgroundColor: COLORS.background,
      },
      loadingContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      linkText: {
        fontSize: 16,
        color: COLORS.primary,
        marginTop: SPACING.md,
      },
      headerContainer: {
        position: "relative" as const,
        height: imageHeight,
        width: "100%" as const,
      },
      artistImageFull: {
        width: imageWidth,
        height: imageHeight,
      },
      imageOverlay: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      headerTopBar: {
        position: "absolute" as const,
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        paddingTop: 50,
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
        zIndex: 10,
      },
      backButton: {
        width: 44,
        height: 44,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      shareButton: {
        width: 44,
        height: 44,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      headerBottomInfo: {
        position: "absolute" as const,
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
      },
      curatorText: {
        fontSize: 14,
        color: COLORS.onTertiaryContainer,
        opacity: 0.8,
        marginBottom: 1,
      },
      artistNameLarge: {
        fontSize: artistNameFontSize,
        fontWeight: "bold" as const,
        color: COLORS.onTertiaryContainer,
        marginBottom: 4,
      },
      subtitleText: {
        fontSize: 13,
        color: COLORS.onTertiaryContainer,
        opacity: 0.7,
      },
      contentContainer: {
        flex: 1,
        backgroundColor: "transparent",
      },
      playButtonContainer: {
        position: "absolute" as const,
        bottom: SPACING.lg,
        right: SPACING.lg,
        zIndex: 10,
      },
      playButton: {
        width: 56,
        height: 56,
        borderRadius: RADIUS.xl,
        backgroundColor: COLORS.primary,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
      sectionHeader: {
        flexDirection: "row" as const,
        justifyContent: "space-between" as const,
        alignItems: "center" as const,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.md,
      },
      sectionTitle: {
        fontSize: 18,
        fontWeight: "600" as const,
        color: COLORS.onTertiaryContainer,
      },
      songListContainer: {
        paddingHorizontal: SPACING.md,
      },
      songCardWrapper: {
        marginBottom: SPACING.sm,
      },
      songCard: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
      },
      songArtwork: {
        width: 56,
        height: 56,
        borderRadius: RADIUS.sm,
        backgroundColor: "#1A1A1A",
        marginRight: SPACING.md,
      },
      songInfo: {
        flex: 1,
      },
      songTitle: {
        fontSize: 15,
        fontWeight: "500" as const,
        color: COLORS.onTertiaryContainer,
        marginBottom: 4,
      },
      songArtist: {
        fontSize: 13,
        color: "#AAAAAA",
      },
      moreButton: {
        width: 40,
        height: 40,
        justifyContent: "center" as const,
        alignItems: "center" as const,
      },
      emptyState: {
        alignItems: "center" as const,
        justifyContent: "center" as const,
        paddingVertical: SPACING.xxl,
      },
      emptyTitle: {
        fontSize: 18,
        fontWeight: "600" as const,
        color: COLORS.onTertiaryContainer,
        marginTop: SPACING.sm,
      },
      emptyText: {
        fontSize: 14,
        color: "#AAAAAA",
        marginTop: SPACING.xs,
      },
    };
  });

  const artistSongs = useMemo(() => {
    return songs.filter((song) => song.artist === artistName);
  }, [songs, artistName]);

  const [artistImage, setArtistImage] = useState<string | undefined>(undefined);
  const [artistListeners, setArtistListeners] = useState<number | null>(null);
  const [extractedColors, setExtractedColors] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    if (!artistName) return;
    (async () => {
      try {
        const allArtists = await getAllArtists();
        const artistMap: Record<string, string> = {};

        allArtists.forEach((a: any) => {
          const key = String(a.name || "").trim();
          if (!key) return;
          const url = a.image_url || a.fallback_url || null;
          if (!url) return;

          const existingUrl = artistMap[key];
          if (!existingUrl) artistMap[key] = String(url);
          else artistMap[key] = String(url);
        });

        const imageUrl =
          artistMap[artistName] ||
          artistMap[artistName.toLowerCase()] ||
          undefined;

        const artistData = allArtists.find(
          (a: any) =>
            String(a.name || "").trim() === artistName ||
            String(a.name || "")
              .trim()
              .toLowerCase() === artistName.toLowerCase()
        );

        if (mounted) {
          setArtistImage(imageUrl);
          setArtistListeners(artistData?.listeners || null);
        }
      } catch {
        if (mounted) setArtistImage(undefined);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [artistName]);

  const artistArtwork = useMemo(() => {
    if (artistImage) return artistImage;
    const songWithArtwork = artistSongs.find((song) => song.artwork);
    return songWithArtwork?.artwork;
  }, [artistSongs, artistImage]);

  useEffect(() => {
    if (!artistArtwork) {
      setExtractedColors([]);
      return;
    }

    const extractColors = async () => {
      try {
        const result = await ImageColors.getColors(artistArtwork, {
          fallback: "#1A1A1A",
          cache: true,
          key: artistArtwork,
        });

        let colors: string[] = [];

        colors = [
          (result as any).dominant || "#1A1A1A",
          (result as any).vibrant || "#2A2A2A",
          (result as any).muted || "#0A0A0A",
        ];

        setExtractedColors(colors);
      } catch {
        setExtractedColors(["#1A1A1A", "#2A2A2A", "#0A0A0A"]);
      }
    };

    extractColors();
  }, [artistArtwork]);

  const adjustedColors = useMemo(() => {
    const getAdjustedColors = (colors: string[]): string[] => {
      return colors.map((color) => (isTooWhiteish(color) ? "#000000" : color));
    };
    return getAdjustedColors(extractedColors);
  }, [extractedColors]);

  const artistGenres = useMemo(() => {
    if (artistSongs.length === 0) return [];

    const allGenres = new Set<string>();
    artistSongs.forEach((song) => {
      if (song.genres && Array.isArray(song.genres)) {
        song.genres.forEach((genre: string) => {
          if (genre && genre.trim()) {
            allGenres.add(genre.trim());
          }
        });
      }
    });

    const genresArray = Array.from(allGenres);
    return genresArray.slice(0, 3);
  }, [artistSongs]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchSongs();
    setLoading(false);
  }, [fetchSongs]);

  useEffect(() => {
    loadData();
  }, [name, loadData]);

  const PlayAll = () => {
    if (artistSongs.length > 0) {
      setQueue(artistSongs);
      playSong(artistSongs[0]);
      showPlayerOverlay();
    }
  };

  const PlaySong = (song: any) => {
    setQueue(artistSongs);
    playSong(song);
    showPlayerOverlay();
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

  if (!artistName) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Artist not found</Text>
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
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          {artistArtwork ? (
            <Image
              source={{ uri: artistArtwork }}
              style={styles.artistImageFull}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.artistImageFull,
                {
                  backgroundColor: "#1A1A1A",
                  justifyContent: "center",
                  alignItems: "center",
                },
              ]}
            >
              <MaterialIcons name="person" size={100} color="#666666" />
            </View>
          )}

          <LinearGradient
            colors={[`${COLORS.background}4D`, "transparent"]}
            locations={[0, 0.4]}
            style={[styles.imageOverlay, { bottom: "50%" }]}
          />

          <LinearGradient
            colors={[
              "transparent",
              adjustedColors[0]
                ? `${adjustedColors[0]}33`
                : `${COLORS.background}33`,
              adjustedColors[0]
                ? `${adjustedColors[0]}66`
                : `${COLORS.background}66`,
              adjustedColors[0]
                ? `${adjustedColors[0]}99`
                : `${COLORS.background}99`,
              adjustedColors[0]
                ? `${adjustedColors[0]}CC`
                : `${COLORS.background}CC`,
              adjustedColors[0] ? `${adjustedColors[0]}FF` : COLORS.background,
              COLORS.background,
            ]}
            locations={[0, 0.15, 0.3, 0.5, 0.7, 0.85, 1]}
            style={[styles.imageOverlay, { top: "30%" }]}
          />

          <LinearGradient
            colors={[
              `${COLORS.background}CC`,
              `${COLORS.background}99`,
              `${COLORS.background}4D`,
              "transparent",
            ]}
            locations={[0, 0.3, 0.6, 1]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: screenWidth * 0.5,
              height: imageHeight * 0.4,
              zIndex: 1,
            }}
          />

          <LinearGradient
            colors={[
              `${COLORS.background}CC`,
              `${COLORS.background}99`,
              `${COLORS.background}4D`,
              "transparent",
            ]}
            locations={[0, 0.3, 0.6, 1]}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: screenWidth * 0.5,
              height: imageHeight * 0.4,
              zIndex: 1,
            }}
          />

          <View style={styles.headerTopBar}>
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
                color={COLORS.onTertiaryContainer}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <MaterialIcons
                name="share"
                size={24}
                color={COLORS.onTertiaryContainer}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.headerBottomInfo}>
            <Text style={styles.curatorText}>
              {artistGenres.length > 0
                ? artistGenres
                    .join(" • ")
                    .toLocaleLowerCase()
                    .replace("atmospheric", "atmosp.")
                : "Artist"}
            </Text>
            <Text style={styles.artistNameLarge} numberOfLines={2}>
              {artistName}
            </Text>
            <Text style={styles.subtitleText}>
              {artistListeners ? artistListeners.toLocaleString() : "0"} monthly
              listeners • {artistSongs.length}{" "}
              {artistSongs.length === 1 ? "track" : "tracks"}
            </Text>
          </View>

          <View style={styles.playButtonContainer}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={() => {
                triggerHaptic();
                PlayAll();
              }}
            >
              <MaterialIcons name="play-arrow" size={32} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tracks List</Text>
          </View>

          {artistSongs.length > 0 ? (
            <View style={styles.songListContainer}>
              {artistSongs.map((song, index) => (
                <TouchableOpacity
                  key={song.id}
                  style={styles.songCardWrapper}
                  onPress={() => {
                    triggerHaptic();
                    PlaySong(song);
                  }}
                >
                  <View style={styles.songCard}>
                    {song.artwork ? (
                      <Image
                        source={{ uri: song.artwork }}
                        style={styles.songArtwork}
                        contentFit="cover"
                      />
                    ) : (
                      <View
                        style={[
                          styles.songArtwork,
                          { justifyContent: "center", alignItems: "center" },
                        ]}
                      >
                        <MaterialIcons
                          name="music-note"
                          size={24}
                          color="#666666"
                        />
                      </View>
                    )}
                    <View style={styles.songInfo}>
                      <Text style={styles.songTitle} numberOfLines={1}>
                        {song.title}
                      </Text>
                      <Text style={styles.songArtist} numberOfLines={1}>
                        {song.artist}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.moreButton}>
                      <MaterialIcons
                        name="more-vert"
                        size={20}
                        color="#AAAAAA"
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="music-off" size={48} color="#666666" />
              <Text style={styles.emptyTitle}>No songs found</Text>
              <Text style={styles.emptyText}>
                No songs from this artist in your library
              </Text>
            </View>
          )}

          <CommentsSection artistName={artistName} />
        </View>
      </ScrollView>
    </View>
  );
}
