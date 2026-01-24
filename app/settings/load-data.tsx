import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { Square } from "../../components/Shapes";
import Svg, {
  Defs,
  ClipPath,
  Path as SvgPath,
  Image as SvgImage,
} from "react-native-svg";
import { initDatabase, getAllSongs, getAllArtists } from "../../utils/database";
import { MaterialIcons } from "@expo/vector-icons";

const SET_ITEMS = [
  { id: "artists", title: "Artist images" },
  { id: "genre", title: "Genres" },
  { id: "lyrics", title: "Lyrics" },
  { id: "metadata", title: "Additional metadata" },
];

export default function LoadDataScreen() {
  const themeValues = useThemeValues();
  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    iconBox: {
      width: "100%" as const,
      height: 190,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      marginVertical: SPACING.xl,
      opacity: 0.55,
      justifyContent: "center" as const,
      alignItems: "flex-start" as const,
      paddingLeft: SPACING.xxl,
    },
    iconatBox: {
      filter: "brightness(100)",
    },
    iconRow: {
      flexDirection: "row" as const,
      justifyContent: "flex-start" as const,
      alignItems: "center" as const,
    },
    iconBoxFooter: {
      position: "absolute" as ViewStyle["position"],
      left: 0,
      right: 0,
      bottom: SPACING.sm,
      alignItems: "center" as ViewStyle["alignItems"],
    },
    icon: {
      left: 0,
      paddingLeft: SPACING.sm + 3,
      position: "absolute" as const,
      marginBottom: SPACING.xl,
    },
    header: {
      paddingLeft: SPACING.md,
      marginTop: SPACING.xl,
      flexDirection: "row" as ViewStyle["flexDirection"],
      alignItems: "center" as ViewStyle["alignItems"],
      justifyContent: "space-between" as ViewStyle["justifyContent"],
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurface,
      marginTop: SPACING.xxl,
    },
    content: {
      padding: SPACING.md,
    },
    item: {
      flexDirection: "row" as ViewStyle["flexDirection"],
      alignItems: "center" as ViewStyle["alignItems"],
      justifyContent: "space-between" as ViewStyle["justifyContent"],
      paddingVertical: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.outlineVariant,
    },
    itemLabel: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    itemSmall: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelSmall,
      color: COLORS.onSurface,
    },
    fetchButton: {
      marginTop: SPACING.md,
      backgroundColor: themeValues.COLORS.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.xl,
      alignItems: "center" as ViewStyle["alignItems"],
    },
    fetchButtonText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onPrimary,
    },
    progressContainer: {
      height: 14,
      backgroundColor: COLORS.surfaceVariant,
      borderRadius: RADIUS.md,
      overflow: "hidden" as ViewStyle["overflow"],
      marginTop: SPACING.md,
    },
    progressBar: {
      height: 14,
      backgroundColor: themeValues.COLORS.primaryContainer,
    },
    footer: {
      padding: SPACING.md,
      paddingBottom: SPACING.xl + 1,
      backgroundColor: "transparent",
    },
    card: {
      backgroundColor: `${COLORS.surfaceContainer}33`,
      borderRadius: RADIUS.xl,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },
  }));

  const [, setItems] = React.useState(
    SET_ITEMS.map((i) => ({ ...i, done: false }))
  );
  const [randomSong, setRandomSong] = React.useState<any | null>(null);
  const [songsList, setSongsList] = React.useState<any[]>([]);
  const [isFetching, setIsFetching] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const coverOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);

  const [currentlyDoingWhat, setDoing] = React.useState<string | null>("");

  const fetch_metadata = async () => {
    setIsFetching(true);
    setProgress(0);
    setItems((prev) => prev.map((p) => ({ ...p, done: false })));

    setDoing("initializing");

    try {
      await initDatabase();

      const songs = await getAllSongs();
      if (!songs || songs.length === 0) {
        console.log("No songs found to fetch metadata for.");
        setDoing("no songs found");
        setIsFetching(false);
        return;
      }

      const { fetchAndStoreSongMetadata } = await import(
        "../../utils/songMetadata"
      );

      try {
        setDoing("fetching song metadata");
        if (songs && songs.length > 0) {
          const batchSize = 2;
          for (let start = 0; start < songs.length; start += batchSize) {
            const batch = songs.slice(start, start + batchSize) as any[];
            await Promise.allSettled(
              batch.map(async (s) => {
                try {
                  await fetchAndStoreSongMetadata(
                    s.title || s.name || "",
                    s.artist || "",
                    s.id || null,
                    s.uri
                  );
                } catch (err) {
                  console.warn(
                    `[LoadData] Failed fetching song metadata for ${s?.title}:`,
                    err
                  );
                }
              })
            );
            setProgress(
              (Math.min(start + batchSize, songs.length) / songs.length) * 100
            );
          }
        }
        console.log(
          `[LoadData] Song metadata pass complete. Processed ${songs.length} songs.`
        );
        setItems((prev) =>
          prev.map((p) => (p.id === "metadata" ? { ...p, done: true } : p))
        );
      } catch (err) {
        console.warn("fetch song metadata error:", err);
      }

      const artistSet = new Set<string>();
      for (const s of songs) {
        if (s && s.artist) artistSet.add(s.artist);
      }
      const artists = Array.from(artistSet);

      const existingArtists = await getAllArtists();
      const existingMap = new Map<string, any>();
      if (existingArtists && existingArtists.length > 0) {
        for (const a of existingArtists) {
          const name = (a as any)?.name;
          if (name) existingMap.set(String(name).toLowerCase().trim(), a);
        }
      }

      const toFetch: string[] = [];
      for (const a of artists) {
        const name = a ? String(a).trim() : "";
        if (!name) continue;
        const key = name.toLowerCase();
        if (key === "unknown artist") continue;
        toFetch.push(name);
      }

      if (toFetch.length === 0) {
        setItems((prev) =>
          prev.map((p) => (p.id === "artists" ? { ...p, done: true } : p))
        );
        setProgress(100);
        setIsFetching(false);
        setTimeout(() => setProgress(0), 800);
        setDoing("done");
        return;
      }

      const { fetchAndStoreArtistMetadataBatch } = await import(
        "../../utils/artistMetadata"
      );

      console.log(toFetch);
      if (toFetch.length > 0) {
        try {
          setDoing("fetching artist data");
          await fetchAndStoreArtistMetadataBatch(toFetch, 2);
          setProgress(100);
        } catch (err) {
          console.warn("[LoadData] Error fetching artist metadata batch:", err);
        }
      }

      setItems((prev) =>
        prev.map((p) => (p.id === "artists" ? { ...p, done: true } : p))
      );
    } catch (e) {
      console.warn("fetch_metadata error:", e);
    } finally {
      setDoing("done");
      setIsFetching(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatXAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animateY = () => {
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(animateY);
      });
    };

    const animateX = () => {
      Animated.timing(floatXAnim, {
        toValue: 1,
        duration: 4200,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }).start(() => {
        Animated.timing(floatXAnim, {
          toValue: 0,
          duration: 4200,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }).start(animateX);
      });
    };

    animateY();
    animateX();
  }, [floatAnim, floatXAnim]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDatabase();
        const songs = await getAllSongs();
        const artists = await getAllArtists();

        if (!mounted) return;

        if (songs && songs.length > 0) {
          setSongsList(songs);
          const idx = Math.floor(Math.random() * songs.length);
          indexRef.current = idx;
          const s = songs[idx];
          console.log("Random song:", s);
          setRandomSong(s);
        } else {
          console.log("No songs found in database.");
        }

        if (artists && artists.length > 0) {
          const a = artists[Math.floor(Math.random() * artists.length)];
          console.log("Random artist:", a);
        } else {
          console.log("No artists found in database.");
        }
      } catch (e) {
        console.log("Failed loading songs/artists:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!songsList || songsList.length === 0) return;
    const interval = setInterval(() => {
      const next = (indexRef.current + 1) % songsList.length;
      Animated.timing(coverOpacity, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        indexRef.current = next;
        setRandomSong(songsList[next]);
        Animated.timing(coverOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      });

      Animated.sequence([
        Animated.timing(textOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 4000);

    return () => clearInterval(interval);
  }, [songsList, coverOpacity, textOpacity]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons
          style={styles.icon}
          name="download"
          size={28}
          color={themeValues.COLORS.onSurface}
        />
        <Text style={styles.title}>Download Metadata</Text>
        <View />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: SPACING.md }]}
      >
        <View style={styles.iconBox}>
          <View style={styles.iconRow}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Animated.View
                style={[
                  {
                    marginTop: 25,
                    opacity: coverOpacity,
                    transform: [
                      {
                        translateY: floatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-5, -16],
                        }),
                      },
                      {
                        translateX: floatXAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-5, -12],
                        }),
                      },
                      {
                        rotate: floatAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ["-5deg", "-2deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {randomSong && randomSong.artwork ? (
                  <Svg width={92} height={92} viewBox="0 0 380 380">
                    <Defs>
                      <ClipPath id="squareClip">
                        <SvgPath d="M350 202C350 246.717 350 269.076 342.978 286.812C332.813 312.485 312.485 332.813 286.812 342.978C269.076 350 246.717 350 202 350H178C133.283 350 110.924 350 93.1875 342.978C67.5145 332.813 47.187 312.485 37.0223 286.812C30 269.076 30 246.717 30 202L30 178C30 133.283 30 110.924 37.0224 93.1875C47.187 67.5145 67.5146 47.187 93.1876 37.0223C110.924 30 133.283 30 178 30L202 30C246.717 30 269.076 30 286.812 37.0224C312.485 47.187 332.813 67.5146 342.978 93.1876C350 110.924 350 133.283 350 178V202Z" />
                      </ClipPath>
                    </Defs>
                    <SvgImage
                      href={randomSong.artwork}
                      x="0"
                      y="0"
                      width="380"
                      height="380"
                      preserveAspectRatio="xMidYMid slice"
                      clipPath="url(#squareClip)"
                    />
                    <SvgPath
                      d="M350 202C350 246.717 350 269.076 342.978 286.812C332.813 312.485 312.485 332.813 286.812 342.978C269.076 350 246.717 350 202 350H178C133.283 350 110.924 350 93.1875 342.978C67.5145 332.813 47.187 312.485 37.0223 286.812C30 269.076 30 246.717 30 202L30 178C30 133.283 30 110.924 37.0224 93.1875C47.187 67.5145 67.5146 47.187 93.1876 37.0223C110.924 30 133.283 30 178 30L202 30C246.717 30 269.076 30 286.812 37.0224C312.485 47.187 332.813 67.5146 342.978 93.1876C350 110.924 350 133.283 350 178V202Z"
                      fill="none"
                      stroke={themeValues.COLORS.onPrimary}
                      strokeWidth={1}
                    />
                  </Svg>
                ) : (
                  <Square
                    width={92}
                    height={92}
                    strokeWidth={0}
                    fill={themeValues.COLORS.onPrimary}
                  />
                )}
              </Animated.View>

              <Animated.View
                style={{
                  marginLeft: SPACING.md,
                  opacity: textOpacity,
                  transform: [
                    {
                      translateY: floatAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-3, -10],
                      }),
                    },
                    {
                      translateX: floatXAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-3, -8],
                      }),
                    },
                  ],
                }}
              >
                <Text style={[styles.itemLabel, { fontSize: 14 }]}>
                  {randomSong?.artist
                    ? randomSong.artist.length > 17
                      ? randomSong.artist.split("- ")[0].slice(0, 17) + "..."
                      : randomSong.artist
                    : "Artist"}
                </Text>

                <Text
                  style={[styles.itemLabel, { fontSize: 18, marginTop: 3 }]}
                >
                  {randomSong?.album
                    ? randomSong.album.length > 17
                      ? randomSong.album.split("- ")[0].slice(0, 17) + "..."
                      : randomSong.album
                    : "Album"}
                </Text>
              </Animated.View>
            </View>
          </View>

          <View style={styles.iconBoxFooter}>
            <Text style={[styles.itemSmall, { opacity: 0.8 }]}>
              {currentlyDoingWhat || ""}
            </Text>
          </View>
        </View>
        <Text
          style={[styles.itemLabel, { marginBottom: SPACING.md, opacity: 0.9 }]}
        >
          Downloading metadata may use significant data and storage space.
          Ensure you are connected to Wi-Fi with atleast 2GB free.
        </Text>
        <Text
          style={[styles.itemLabel, { marginBottom: SPACING.md, opacity: 0.9 }]}
        >
          Your files will not be modified, correct metadata will only be added
          to our local database.
        </Text>
        <Text
          style={[styles.itemLabel, { marginBottom: SPACING.md, opacity: 0.9 }]}
        >
          Artists, track information, album art, genres and lyrics will be
          fetched from various online sources.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
          <View
            style={[styles.progressBar, { width: `${Math.round(progress)}%` }]}
          />
        </View>
        <TouchableOpacity
          style={[styles.fetchButton, { width: "100%" }]}
          onPress={fetch_metadata}
          disabled={isFetching}
        >
          <Text style={styles.fetchButtonText}>
            {isFetching ? "Fetching..." : "Fetch Everything"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
