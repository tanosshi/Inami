import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  ViewStyle,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { Square } from "../../components/Shapes";
import { initDatabase, getSetting, saveProfile } from "../../utils/database";
import { Entypo } from "@expo/vector-icons";
import { getLastfmAPIKey } from "@/secrets";
import userAgents from "@/utils/userAgents";

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();
void userAgent;

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
      paddingLeft: SPACING.sm + 9,
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

  const [isFetching, setIsFetching] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const coverOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  const fetch_metadata = async () => {
    setIsFetching(true);
    setProgress(0);
    try {
      await saveProfile({
        username: username || "",
        profile_picture: image || "",
        country: country || "",
        playcount: scrobbles || "",
        artist_count: artistCount || "",
        track_count: trackCount || "",
        album_count: albumCount || "",
        lastfm_url: fmURL || "",
      });
      setProgress(100);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsFetching(false);
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

  const [image, setImage] = React.useState<any>(null);
  const [username, setUsername] = React.useState<any>(null);
  const [aka, setAkaName] = React.useState<any>(null);
  const [scrobbles, setScrobbles] = React.useState<any>(null);
  const [fmURL, setFmURL] = React.useState<any>(null);
  const [artistCount, setArtistCount] = React.useState<any>(null);
  const [trackCount, setTrackCount] = React.useState<any>(null);
  const [albumCount, setAlbumCount] = React.useState<any>(null);
  const [country, setCountry] = React.useState<any>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await initDatabase();
      const apiKey = await getLastfmAPIKey();
      const user = await getSetting("fm_username");
      try {
        const res = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURIComponent(
            user
          )}&api_key=${apiKey}&format=json`
        );

        const fmStats = await res.json();

        if (!fmStats.user) throw new Error("No user data");

        type Image = {
          size: "small" | "medium" | "large" | "extralarge";
          "#text": string;
        };

        const sizeRank: Record<Image["size"], number> = {
          small: 1,
          medium: 2,
          large: 3,
          extralarge: 4,
        };

        const images = fmStats.user.image as Image[];

        const biggestImage = images.reduce((max, img) => {
          return sizeRank[img.size] > sizeRank[max.size] ? img : max;
        }, images[0]);

        setImage(biggestImage["#text"]);
        setUsername(fmStats.user.name);
        setAkaName(fmStats.user.realname);
        setScrobbles(fmStats.user.playcount);
        setCountry(fmStats.user.country);
        setArtistCount(fmStats.user.artist_count);
        setTrackCount(fmStats.user.track_count);
        setAlbumCount(fmStats.user.album_count);
        setFmURL(fmStats.user.url || "https://last.fm/user/" + user);
      } catch {}
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Entypo
          style={styles.icon}
          name="lastfm"
          size={28}
          color={themeValues.COLORS.onSurface}
        />
        <Text style={styles.title}>Last.fm</Text>
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
                {image ? (
                  <Image
                    source={{ uri: image }}
                    style={{
                      width: 92,
                      height: 92,
                      borderRadius: 25,
                      borderWidth: 1,
                      borderColor: themeValues.COLORS.onPrimary,
                    }}
                  />
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
                <Text
                  style={[styles.itemLabel, { fontSize: 12, marginTop: 8 }]}
                >
                  {scrobbles ? scrobbles + " scrobbles" : "Scrobble count"}
                </Text>

                <Text
                  style={[styles.itemLabel, { fontSize: 18, marginTop: 3 }]}
                >
                  {username ? username : "Username"}
                </Text>
                <Text
                  style={[styles.itemLabel, { fontSize: 11, marginTop: -1 }]}
                >
                  {aka ? "aka " + aka : "Aka"}
                </Text>
              </Animated.View>
            </View>
          </View>
        </View>
        <Text
          style={[styles.itemLabel, { marginBottom: SPACING.md, opacity: 0.9 }]}
        >
          We&apos;ll download everything related to your last.fm account,
          including your full listening history, loved tracks and statistics.
        </Text>
        <Text
          style={[styles.itemLabel, { marginBottom: SPACING.md, opacity: 0.9 }]}
        >
          Your stats will be stored locally on your device and will weigh more
          than 10MB, its recommended to be on Wi-Fi while downloading.
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
            {isFetching ? "Reading..." : "This is me!"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
