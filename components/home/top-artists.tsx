import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { getArtist, getAllArtists } from "../../utils/database";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";

const { width } = Dimensions.get("window");
const BIG_SQUARE_SIZE = (width - SPACING.md * 3) * 0.6;

interface Artist {
  name: string;
  playCount: number;
  image?: string;
}
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

interface TopArtistsProps {
  topArtists: Artist[];
  songs: Song[];
}

export default function TopArtists({ topArtists, songs }: TopArtistsProps) {
  const themeValues = useThemeValues();
  const router = useRouter();

  const artistCount: Record<string, number> = {};

  songs.forEach((song) => {
    if (song.artist && song.artist !== "Unknown Artist")
      artistCount[song.artist] = (artistCount[song.artist] || 0) + 1;
  });

  const top3FromSongs: Artist[] = Object.entries(artistCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      playCount: count,
      image: undefined,
    }));

  const displayArtists = topArtists.length > 0 ? topArtists : top3FromSongs;

  const [artistImages, setArtistImages] = React.useState<
    Record<string, string>
  >({});

  const _topArtistsLogged = React.useRef(false);
  const _lastImgsKey = React.useRef("");

  const namesKey = displayArtists.map((d) => d.name).join("|");

  React.useEffect(() => {
    let mounted = true;

    const names = displayArtists.map((a) => a.name);
    if (names.length === 0) return;

    (async () => {
      try {
        if (!mounted) return;
        const imgs: Record<string, string> = {};

        if (Object.keys(imgs).length === 0) {
          try {
            const all = await getAllArtists();
            all.forEach((a: any) => {
              const key = String(a.name || "").trim();
              if (!key) return;
              const url = a.image_url || a.fallback_url || null;
              if (url && names.includes(key)) imgs[key] = String(url);
            });
          } catch {}
        }

        const imgsKey = JSON.stringify(imgs);
        if (imgsKey !== _lastImgsKey.current) {
          _lastImgsKey.current = imgsKey;
          setArtistImages(imgs);
        }

        if (Object.keys(imgs).length > 0 && !_topArtistsLogged.current)
          _topArtistsLogged.current = true;
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, [namesKey, displayArtists]);

  const styles = useDynamicStyles(() => ({
    section: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurface,
      marginBottom: SPACING.md,
    },
    featuredContainer: {
      flexDirection: "row" as const,
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    bigSquare: {
      width: BIG_SQUARE_SIZE,
      height: BIG_SQUARE_SIZE,
      backgroundColor: COLORS.surfaceContainerHighest,
      borderRadius: RADIUS.xxl,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    bigSquareImage: {
      width: "100%" as const,
      height: "100%" as const,
      borderRadius: RADIUS.xxl,
    },
    smallSquaresContainer: {
      flex: 1,
      gap: SPACING.sm + 2,
    },
    smallSquare: {
      flex: 1,
      backgroundColor: COLORS.surfaceContainerHighest,
      borderRadius: RADIUS.xxl,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    smallSquareImage: {
      width: "100%" as const,
      height: "100%" as const,
      borderRadius: RADIUS.xxl,
    },
  }));

  if (displayArtists.length === 0) return null;

  const handleArtistPress = (artistName: string) => {
    triggerHaptic();
    router.push(`/artist/${encodeURIComponent(artistName)}`);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Your {topArtists.length > 0 ? "Top" : "Most Downloaded"} Artists
      </Text>

      <View style={styles.featuredContainer}>
        {/* Big #1 */}
        <TouchableOpacity
          style={styles.bigSquare}
          onPress={() =>
            displayArtists[0] && handleArtistPress(displayArtists[0].name)
          }
        >
          {displayArtists[0]?.image ||
          (displayArtists[0] && artistImages[displayArtists[0].name]) ? (
            <Image
              source={{
                uri:
                  displayArtists[0].image ||
                  artistImages[displayArtists[0].name],
              }}
              style={styles.bigSquareImage}
              contentFit="cover"
            />
          ) : (
            <MaterialIcons
              name="person"
              size={48}
              color={themeValues.COLORS.primary}
            />
          )}
        </TouchableOpacity>

        {/* Small #2, #3 */}
        <View style={styles.smallSquaresContainer}>
          {[1, 2].map((index) => (
            <TouchableOpacity
              key={index}
              style={styles.smallSquare}
              onPress={() =>
                displayArtists[index] &&
                handleArtistPress(displayArtists[index].name)
              }
            >
              {displayArtists[index]?.image ||
              (displayArtists[index] &&
                artistImages[displayArtists[index].name]) ? (
                <Image
                  source={{
                    uri:
                      displayArtists[index].image ||
                      artistImages[displayArtists[index].name],
                  }}
                  style={styles.smallSquareImage}
                  contentFit="cover"
                />
              ) : (
                <MaterialIcons
                  name="person"
                  size={32}
                  color={themeValues.COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
