import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { getAllSongs } from "../../utils/database";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";

const { width } = Dimensions.get("window");
const TILE_SIZE = (width - SPACING.md * 4) / 3;

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork?: string;
  is_liked: boolean;
  play_count: number;
}

interface SpeedDialProps {
  songs: Song[];
  onPlaySong: (song: Song) => void;
}

export default function SpeedDial({ songs, onPlaySong }: SpeedDialProps) {
  const themeValues = useThemeValues();
  const router = useRouter();
  const [randomSongs, setRandomSongs] = React.useState<Song[]>([]);

  const getRandomSongsWithPreference = (songList: Song[]): Song[] => {
    if (!songList || songList.length === 0) return [];

    const songsWithArtwork = songList.filter((song) => song.artwork);
    const songsWithoutArtwork = songList.filter((song) => !song.artwork);

    const shuffledWithArtwork = [...songsWithArtwork].sort(
      () => 0.5 - Math.random()
    );
    const shuffledWithoutArtwork = [...songsWithoutArtwork].sort(
      () => 0.5 - Math.random()
    );

    const selectedSongs: Song[] = [];

    const artworkCount = Math.min(9, shuffledWithArtwork.length);
    selectedSongs.push(...shuffledWithArtwork.slice(0, artworkCount));

    if (selectedSongs.length < 9) {
      const remainingSlots = 9 - selectedSongs.length;
      selectedSongs.push(...shuffledWithoutArtwork.slice(0, remainingSlots));
    }

    return selectedSongs;
  };

  React.useEffect(() => {
    const loadRandomSongs = async () => {
      try {
        const allSongs = await getAllSongs();
        if (allSongs && allSongs.length > 0) {
          const selectedSongs = getRandomSongsWithPreference(allSongs);
          setRandomSongs(selectedSongs);
        } else if (songs && songs.length > 0) {
          const selectedSongs = getRandomSongsWithPreference(songs);
          setRandomSongs(selectedSongs);
        }
      } catch {
        if (songs && songs.length > 0) {
          const selectedSongs = getRandomSongsWithPreference(songs);
          setRandomSongs(selectedSongs);
        }
      }
    };

    loadRandomSongs();
  }, [songs]);

  const styles = useDynamicStyles(() => ({
    section: {
      marginTop: -SPACING.lg + 2,
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurface,
      marginBottom: SPACING.md,
    },
    grid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: SPACING.sm + 3,
    },
    tile: {
      width: TILE_SIZE,
      height: TILE_SIZE,
      borderRadius: RADIUS.lg,
      overflow: "hidden" as const,
      position: "relative" as const,
    },
    tileImage: {
      width: "100%" as const,
      height: "100%" as const,
    },
    tileOverlay: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: SPACING.xs,
      paddingVertical: SPACING.xs,
    },
    songTitle: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodySmall,
      color: "#e3e2e6", // <-- needs to be hardcoded
      numberOfLines: 1,
    },
    vignetteGradient: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      height: TILE_SIZE * 0.6,
    },
    placeholder: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainerHighest,
    },
  }));

  if (randomSongs.length === 0) return null;

  const handleSongPress = (song: Song) => {
    triggerHaptic();
    onPlaySong(song);
  };

  const getTitleFontSize = (title: string) => {
    const length = title.length;
    if (length <= 15) return TYPOGRAPHY.bodySmall.fontSize;
    if (length <= 25) return TYPOGRAPHY.bodySmall.fontSize * 0.9;
    if (length <= 35) return TYPOGRAPHY.bodySmall.fontSize * 0.8;
    return TYPOGRAPHY.bodySmall.fontSize * 0.7;
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Speed Dial</Text>

      <View style={styles.grid}>
        {randomSongs.map((song, index) => (
          <TouchableOpacity
            key={`${song.id}-${index}`}
            style={styles.tile}
            onPress={() => handleSongPress(song)}
          >
            {song.artwork ? (
              <Image
                source={{ uri: song.artwork }}
                style={styles.tileImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.placeholder}>
                <MaterialIcons
                  name="music-note"
                  size={24}
                  color={themeValues.COLORS.primary}
                />
              </View>
            )}

            <LinearGradient
              colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
              locations={[0.3, 1]}
              style={styles.vignetteGradient}
            />

            <View style={styles.tileOverlay}>
              <Text
                style={[
                  styles.songTitle,
                  { fontSize: getTitleFontSize(song.title) },
                ]}
              >
                {song.title}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
