import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  ViewStyle,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { useRouter } from "expo-router";
import { Cookie12Sided, Triangle, Square } from "../Shapes";
import Svg, {
  Defs,
  ClipPath,
  Path as SvgPath,
  Image as SvgImage,
} from "react-native-svg";
import { initDatabase, getAllSongs, getAllArtists } from "../../utils/database";
import { triggerHaptic } from "../../utils/haptics";

export default function HoldOnPage() {
  const themeValues = useThemeValues();
  const router = useRouter();

  const [randomSong, setRandomSong] = useState<any | null>(null);
  const [songsList, setSongsList] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentlyDoingWhat, setDoing] = useState<string | null>("");

  const [showComplete, setShowComplete] = useState(false);

  const coverOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const completeFadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatXAnim = useRef(new Animated.Value(0)).current;

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    completeContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: COLORS.background,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xxl,
      overflow: "hidden" as const,
    },
    cookieContainer: {
      position: "absolute" as const,
      top: 500,
      left: 30,
    },
    triangleContainer: {
      position: "absolute" as const,
      top: -50,
      left: -150,
      transform: [{ scaleX: -1 }],
    },
    topFinish: {
      marginTop: SPACING.xxl,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.sm + 3,
      alignItems: "flex-end" as const,
      position: "relative" as const,
      width: "100%" as const,
    },
    iconFinish: {
      left: 0,
      paddingTop: SPACING.xl,
      position: "absolute" as const,
    },
    mainFinish: {
      marginTop: SPACING.xxl + 12,
    },
    welcomeText: {
      fontFamily: "Inter_400Regular",
      fontSize: 32,
      color: COLORS.onSurface,
      textAlign: "left" as const,
      alignSelf: "flex-start" as const,
      width: "100%" as const,
    },
    descText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurfaceVariant,
      marginTop: SPACING.sm,
    },
    restartButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.full,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl + SPACING.md,
    },
    restartButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },

    bottomSection: {
      flex: 1,
      justifyContent: "flex-start" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    top: {
      marginTop: SPACING.sm,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.sm + 3,
      alignItems: "flex-end" as const,
      position: "relative" as const,
      width: "100%" as const,
    },
    icon: {
      left: 0,
      paddingLeft: SPACING.sm + 3,
      paddingTop: SPACING.xl,
      position: "absolute" as const,
    },
    main: {
      marginTop: SPACING.xxl + 12,
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
    iconRow: {
      flexDirection: "row" as const,
      justifyContent: "flex-start" as const,
      alignItems: "center" as const,
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
    iconBoxFooter: {
      position: "absolute" as ViewStyle["position"],
      left: 0,
      right: 0,
      bottom: SPACING.sm,
      alignItems: "center" as ViewStyle["alignItems"],
    },

    // Buttons
    bottomContainer: {
      width: "100%" as const,
      paddingTop: SPACING.md,
      gap: SPACING.md,
    },
    fetchButton: {
      backgroundColor: themeValues.COLORS.primary,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.full,
      alignItems: "center" as const,
      width: "100%" as const,
    },
    fetchButtonText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onPrimary,
    },
    skipButton: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.full,
      alignItems: "center" as const,
      width: "100%" as const,
    },
    skipButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurfaceVariant,
    },
    progressContainer: {
      height: 14,
      backgroundColor: COLORS.surfaceVariant,
      borderRadius: RADIUS.md,
      overflow: "hidden" as const,
      marginTop: SPACING.md,
      marginBottom: SPACING.md,
      width: "100%" as const,
    },
    progressBar: {
      height: 14,
      backgroundColor: themeValues.COLORS.primaryContainer,
    },
  }));

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 33000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      { iterations: -1 }
    );
    spinLoop.start();

    const animateY = () => {
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      }).start(() => {
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }).start(animateY);
      });
    };

    const animateX = () => {
      Animated.timing(floatXAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      }).start(() => {
        Animated.timing(floatXAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }).start(animateX);
      });
    };

    animateY();
    animateX();

    return () => {
      spinLoop.stop();
    };
  }, [spinAnim, floatAnim, floatXAnim]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDatabase();
        const songs = await getAllSongs();

        if (!mounted) return;

        if (songs && songs.length > 0) {
          setSongsList(songs);
          const idx = Math.floor(Math.random() * songs.length);
          indexRef.current = idx;
          setRandomSong(songs[idx]);
        }
      } catch (e) {
        console.log("Failed loading songs:", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
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

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const fetch_metadata = async () => {
    setIsFetching(true);
    setProgress(0);
    setDoing("initializing");

    try {
      await initDatabase();

      const songs = await getAllSongs();
      if (!songs || songs.length === 0) {
        setDoing("no songs found");
        setIsFetching(false);
        return;
      }

      const { fetchAndStoreSongMetadata } = await import(
        "../../utils/song/fetchAndStoreSongMetadata"
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

      if (toFetch.length > 0) {
        const { fetchAndStoreArtistMetadataBatch } = await import(
          "../../utils/artist/fetchAndStoreArtistMetadata"
        );
        try {
          setDoing("fetching artist data");
          await fetchAndStoreArtistMetadataBatch(toFetch, 2);
          setProgress(100);
        } catch (err) {
          console.warn("[LoadData] Error fetching artist metadata batch:", err);
        }
      }

      setProgress(100);
      setDoing("done");
      setTimeout(() => {
        handleSkip();
      }, 1000);
    } catch (e) {
      console.warn("fetch_metadata error:", e);
      setIsFetching(false);
    }
  };

  const handleSkip = () => {
    triggerHaptic();

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowComplete(true);
      Animated.timing(completeFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRestart = async () => {
    try {
      triggerHaptic();
      console.log("Navigating to /(tabs)");
      // @ts-ignore
      router.replace("/(tabs)");
    } catch (e) {
      console.error("Navigation error:", e);
      router.replace("/");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showComplete ? (
        <Animated.View
          style={[styles.completeContainer, { opacity: completeFadeAnim }]}
        >
          <Animated.View
            style={[styles.cookieContainer, { transform: [{ rotate: spin }] }]}
          >
            <Cookie12Sided
              width={700}
              height={700}
              strokeWidth={2}
              stroke={COLORS.primaryContainer}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.triangleContainer,
              {
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                  {
                    translateX: floatXAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -18],
                    }),
                  },
                  {
                    rotate: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-3deg", "5deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Triangle
              width={400}
              height={400}
              strokeWidth={3}
              stroke={COLORS.primaryContainer}
            />
          </Animated.View>
          <View style={{ width: "100%" as const }}>
            <View style={styles.topFinish}>
              <MaterialIcons
                style={styles.iconFinish}
                name="check"
                size={28}
                color={themeValues.COLORS.onSurface}
              />
            </View>
            <View style={styles.mainFinish}>
              <Text style={styles.welcomeText}>All set!</Text>
              <Text style={styles.descText}>
                Inami is all yours now. Enjoy your music experience.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleRestart}
          >
            <Text style={styles.restartButtonText}>Thank you!</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
          <View style={styles.top}>
            <MaterialIcons
              style={styles.icon}
              name="priority-high"
              size={28}
              color={themeValues.COLORS.onSurface}
            />

            <View style={styles.main}>
              <Text style={styles.welcomeText}>Wait!</Text>
              <Text style={styles.descText}>
                We noticed a ton of missing metadata for your songs.
              </Text>
            </View>
          </View>

          <ScrollView
            style={{ width: "100%", flex: 1 }}
            contentContainerStyle={{ paddingBottom: SPACING.lg }}
            showsVerticalScrollIndicator={false}
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
                          ? randomSong.artist.split("- ")[0].slice(0, 17) +
                            "..."
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
              style={[
                styles.itemLabel,
                { marginBottom: SPACING.md, opacity: 0.9 },
              ]}
            >
              Downloading metadata may use significant data and storage space.
              Ensure you are connected to Wi-Fi with atleast 2GB free.
            </Text>
            <Text
              style={[
                styles.itemLabel,
                { marginBottom: SPACING.md, opacity: 0.9 },
              ]}
            >
              This screen will change once we&apos;re done, please do not be
              scared if it&apos;s frozen, or if the progress has been at a
              certain point for a long time.
            </Text>
            <Text
              style={[
                styles.itemLabel,
                { marginBottom: SPACING.md, opacity: 0.9 },
              ]}
            >
              Your files will not be modified, correct metadata will only be
              added to our local database.
            </Text>
            <Text
              style={[
                styles.itemLabel,
                { marginBottom: SPACING.md, opacity: 0.9 },
              ]}
            >
              Artists, track information, album art, genres and lyrics will be
              fetched from various online sources.
            </Text>
          </ScrollView>

          <View style={styles.bottomContainer}>
            {isFetching && progress > 0 && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${Math.round(progress)}%` },
                  ]}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.fetchButton}
              onPress={fetch_metadata}
              disabled={isFetching}
            >
              <Text style={styles.fetchButtonText}>
                {isFetching ? "Downloading..." : "Download & Apply"}
              </Text>
            </TouchableOpacity>

            {!isFetching && (
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
