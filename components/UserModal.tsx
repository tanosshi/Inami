import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Pressable,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  PanResponder,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { blendColors } from "../utils/colorUtils";
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from "../constants/theme";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";
import { initDatabase, getProfileItem } from "../utils/database";

export default function UserModal({
  show,
  onClose,
  onOpenDiscover,
}: {
  show: boolean;
  onClose: () => void;
  onOpenDiscover?: () => void;
}) {
  const translateY = useRef(new Animated.Value(300)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newY = Math.max(0, Math.min(300, gestureState.dy));
        translateY.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onClose());
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (show) {
      translateY.setValue(300);
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: 300,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [show, translateY]);

  const [profile, setProfile] = useState<{
    username: string;
    profile_picture: string;
    country: string;
    playcount: string;
    artist_count: string;
    track_count: string;
    album_count: string;
    lastfm_url: string;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      await initDatabase();
      const profileData = await getProfileItem();
      setProfile(profileData);
    };
    fetchProfile();
  }, []);

  const playCount = profile?.playcount ? parseInt(profile.playcount) : 0;
  const statsNumbers = [
    profile?.artist_count ? parseInt(profile.artist_count) : 0,
    profile?.album_count ? parseInt(profile.album_count) : 0,
    profile?.track_count ? parseInt(profile.track_count) : 0,
  ];

  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    overlay: {
      ...StyleSheet.absoluteFillObject,
    },
    container: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 20,
      backgroundColor: blendColors(COLORS.background, COLORS.primary, 0.06),
      borderTopLeftRadius: RADIUS.xxl,
      borderTopRightRadius: RADIUS.xxl,
      paddingBottom: Platform.OS === "ios" ? 28 : 20,
      height: containerHeight,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.onSurfaceVariant,
      borderRadius: 999,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 12,
      opacity: 0.6,
    },
    content: {
      paddingHorizontal: SPACING.lg,
      flex: 1,
    },
    title: {
      ...TYPOGRAPHY.headlineSmall,
      fontFamily: "Inter_600SemiBold",
      color: COLORS.onSurface,
      marginBottom: SPACING.lg,
    },
    button: {
      backgroundColor: COLORS.primary,
      paddingVertical: 12,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.md,
      alignItems: "center",
    },
    buttonPressed: {
      opacity: 0.85,
    },
    center: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      marginTop: SPACING.md,
      paddingBottom: SPACING.md,
    },
    profileBox: {
      width: "60%" as unknown as number,
      aspectRatio: 1,
      borderRadius: RADIUS.xl,
      backgroundColor: COLORS.surfaceContainerHighest,
    },
    profileRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: SPACING.md,
      marginTop: SPACING.sm,
    },
    nameText: {
      ...TYPOGRAPHY.bodyLarge,
      fontFamily: "Inter_600SemiBold",
      color: COLORS.onSurface,
    },
    numberText: {
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurfaceVariant,
    },
    nameTextContainer: {
      alignItems: "center" as const,
      marginTop: SPACING.sm,
    },
    playRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.sm,
      marginTop: SPACING.xs,
    },
    playCountText: {
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
    },
    statsRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: SPACING.md,
      marginTop: SPACING.sm,
    },
    statItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    statText: {
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.onSurfaceVariant,
      marginLeft: SPACING.xs,
    },
    buttonRow: {
      flexDirection: "row" as const,
      gap: SPACING.md,
      justifyContent: "center" as const,
      marginTop: "auto" as unknown as number,
      paddingBottom: SPACING.sm,
    },
    profileButton: {
      backgroundColor: COLORS.primary,
      paddingVertical: 8,
      paddingHorizontal: 22,
      borderRadius: RADIUS.full,
      width: "58%",
      alignItems: "center" as const,
    },
    profileButtonText: {
      color: COLORS.onPrimary,
      ...TYPOGRAPHY.bodyMedium,
      textAlign: "center",
      marginTop: 2,
      fontFamily: "Inter_500Medium",
    },
    discoverButtonOutline: {
      backgroundColor: "transparent",
      borderWidth: 1.5,
      borderColor: COLORS.primary,
      paddingVertical: 8,
      paddingHorizontal: 22,
      borderRadius: RADIUS.full,
      width: "38%",
      alignItems: "center",
    },
    discoverButtonText: {
      color: COLORS.primary,
      ...TYPOGRAPHY.bodyMedium,
      textAlign: "center",
      marginTop: 1,
      fontFamily: "Inter_500Medium",
    },
  }));

  return (
    <Modal
      animationType="none"
      visible={show}
      transparent
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            backgroundColor: translateY.interpolate({
              inputRange: [0, 300],
              outputRange: ["rgba(0,0,0,0.45)", "rgba(0,0,0,0.1)"],
            }),
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFillObject}
          onPress={() => {
            Animated.timing(translateY, {
              toValue: 300,
              duration: 100,
              useNativeDriver: true,
            }).start(() => onClose());
          }}
        />
      </Animated.View>

      <Animated.View
        style={[styles.container, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.content}>
          <View style={styles.center}>
            {profile?.profile_picture ? (
              <Image
                source={{ uri: profile.profile_picture }}
                style={styles.profileBox}
              />
            ) : (
              <View style={styles.profileBox} />
            )}

            <View style={styles.nameTextContainer}>
              <View style={styles.playRow}>
                <Text style={styles.nameText}>
                  {profile?.username || "You"}
                </Text>

                <MaterialIcons
                  name="play-arrow"
                  size={18}
                  color={themeValues.COLORS.onSurfaceVariant}
                />
                <Text style={styles.playCountText}>
                  {playCount.toLocaleString()}
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialIcons
                    name="mic"
                    size={18}
                    color={themeValues.COLORS.onSurfaceVariant}
                  />
                  <Text style={styles.statText}>
                    {statsNumbers[0].toLocaleString()}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <MaterialIcons
                    name="album"
                    size={18}
                    color={themeValues.COLORS.onSurfaceVariant}
                  />
                  <Text style={styles.statText}>
                    {statsNumbers[1].toLocaleString()}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <MaterialIcons
                    name="music-note"
                    size={18}
                    color={themeValues.COLORS.onSurfaceVariant}
                  />
                  <Text style={styles.statText}>
                    {statsNumbers[2].toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              style={({ pressed }) =>
                [styles.profileButton, pressed && styles.buttonPressed] as any
              }
              onPress={() => {
                onClose();
                console.log("Profile redi");
              }}
            >
              <Text style={styles.profileButtonText}>Profile</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) =>
                [
                  styles.discoverButtonOutline,
                  pressed && styles.buttonPressed,
                ] as any
              }
              onPress={() => {
                onOpenDiscover && onOpenDiscover();
              }}
            >
              <Text style={styles.discoverButtonText}>Discover</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const { height } = Dimensions.get("window");
const containerHeight = Math.min(420, height * 0.7);
