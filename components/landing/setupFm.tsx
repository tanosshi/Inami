import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  ViewStyle,
  Image,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { Square } from "../../components/Shapes";
import { initDatabase, saveProfile } from "../../utils/database";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import { getLastfmAPIKeys } from "@/secrets";
import userAgents from "@/utils/userAgents";
import { useLastfmDownloader } from "@/utils/lastfm/getFmData";

type SetupFmProps = {
  onNext?: () => void;
};

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
const userAgent = getRandomUserAgent();
void userAgent;

export default function SetupFm({ onNext }: SetupFmProps) {
  const themeValues = useThemeValues();
  const [image, setImage] = React.useState<any>(null);
  const [username, setUsername] = React.useState<any>(null);
  const [aka, setAkaName] = React.useState<any>(null);
  const [scrobbles, setScrobbles] = React.useState<any>(null);
  const [fmURL, setFmURL] = React.useState<any>(null);
  const [artistCount, setArtistCount] = React.useState<any>(null);
  const [trackCount, setTrackCount] = React.useState<any>(null);
  const [albumCount, setAlbumCount] = React.useState<any>(null);
  const [country, setCountry] = React.useState<any>(null);

  const [usernameInput, setUsernameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

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
      fontSize: 18,
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
    inputContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },
    input: {
      flex: 1,
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      color: COLORS.onSurface,
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
    },
    loadButton: {
      backgroundColor: COLORS.primaryContainer,
      padding: SPACING.md - 2,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.lg,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  }));

  const coverOpacity = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatXAnim = useRef(new Animated.Value(0)).current;

  // Last.fm downloader hook
  const {
    downloadAll,
    progress: downloadProgress,
    loading: isDownloading,
    creatingProfile,
    profileProgress,
    error: downloadError,
  } = useLastfmDownloader();

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

  const handleLoadData = async () => {
    if (!usernameInput.trim()) return;
    setIsLoading(true);

    try {
      await initDatabase();
      const apiKeys = await getLastfmAPIKeys();
      let fmStats;
      for (const apiKey of apiKeys) {
        try {
          const res = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${encodeURIComponent(
              usernameInput
            )}&api_key=${apiKey}&format=json`
          );
          if (!res.ok) {
            const errorText = await res.text();
            throw new Error(
              `Last.fm API request failed: ${res.status} ${res.statusText} - ${errorText}`
            );
          }
          fmStats = await res.json();
          if (fmStats.user) break;
          else throw new Error("No user data");
        } catch (err) {
          console.error(
            `[LastFM] Failed with key ending in ${apiKey.slice(-4)}: ${
              err instanceof Error ? err.message : String(err)
            }`
          );
          if (apiKey === apiKeys[apiKeys.length - 1]) {
            console.warn("User not found");
            setIsLoading(false);
            return;
          }
        }
      }
      if (fmStats && fmStats.user) {
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
        setFmURL(fmStats.user.url || "https://last.fm/user/" + usernameInput);

        setHasLoaded(true);
      } else {
        console.warn("User not found");
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      // Save profile data
      await saveProfile({
        username: username || "",
        profile_picture: image || "",
        country: country || "",
        playcount: scrobbles || "",
        artist_count: artistCount || "",
        track_count: trackCount || "",
        album_count: albumCount || "",
        lastfm_url: fmURL || "",
        aka: aka || "",
      });

      // Download Last.fm scrobble data
      if (username) {
        await downloadAll(username);
      }

      if (onNext) {
        onNext();
      }
    } catch (error) {
      console.error("Error saving profile or downloading data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Entypo
          style={styles.icon}
          name="lastfm"
          size={28}
          color={themeValues.COLORS.onSurface}
        />
        <Text style={styles.title}>Setup Last.fm</Text>
        <View />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: SPACING.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.onSurfaceVariant}
            value={usernameInput}
            onChangeText={setUsernameInput}
            autoCapitalize="none"
            onSubmitEditing={handleLoadData}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={handleLoadData}
            style={styles.loadButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <MaterialIcons
                name="arrow-forward"
                size={24}
                color={COLORS.primary}
              />
            )}
          </TouchableOpacity>
        </View>

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
          style={[
            styles.itemLabel,
            { marginBottom: SPACING.md, opacity: 0.9, fontSize: 14 },
          ]}
        >
          We&apos;ll download everything related to your last.fm account,
          including your full listening history, loved tracks and statistics.
        </Text>
        <Text
          style={[
            styles.itemLabel,
            { marginBottom: SPACING.md, opacity: 0.9, fontSize: 14 },
          ]}
        >
          This step does not enable scrobbling yet, it only downloads your data.
        </Text>
        <Text
          style={[
            styles.itemLabel,
            { marginBottom: SPACING.md, opacity: 0.9, fontSize: 14 },
          ]}
        >
          You may not skip this step, as we&apos;re modifying the app to be for
          Last.fm specifically.
        </Text>
      </ScrollView>

      {hasLoaded && (
        <View style={styles.footer}>
          {isDownloading && (
            <Text
              style={[
                styles.itemLabel,
                {
                  textAlign: "center",
                  marginBottom: SPACING.sm,
                  fontSize: 12,
                },
              ]}
            >
              Downloading page {downloadProgress.current} of{" "}
              {downloadProgress.total}...
            </Text>
          )}
          {creatingProfile && (
            <Text
              style={[
                styles.itemSmall,
                { textAlign: "center", marginBottom: SPACING.sm },
              ]}
            >
              {profileProgress || "Creating your profile.."}
            </Text>
          )}
          {downloadError && (
            <Text
              style={[
                styles.itemLabel,
                {
                  textAlign: "center",
                  marginBottom: SPACING.sm,
                  fontSize: 12,
                  color: "red",
                },
              ]}
            >
              Error: {downloadError}
            </Text>
          )}
          {isDownloading && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${Math.round(
                      (downloadProgress.current / downloadProgress.total) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
          )}
          <TouchableOpacity
            style={[styles.fetchButton, { width: "100%" }]}
            onPress={handleFinish}
            disabled={isSaving || isDownloading || creatingProfile}
          >
            <Text style={styles.fetchButtonText}>
              {isSaving || isDownloading || creatingProfile ? "Loading..." : "This is me!"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
