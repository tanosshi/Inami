import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Animated,
  Text,
  TouchableOpacity,
  Platform,
  PanResponder,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { blendColors } from "../utils/colorUtils";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";
import { initDatabase, getProfileItem } from "../utils/database";
import { TYPOGRAPHY } from "../constants/theme";

import { useRouter } from "expo-router";

export default function UserModal({
  show,
  onClose,
  onOpenDiscover,
}: {
  show: boolean;
  onClose: () => void;
  onOpenDiscover?: () => void;
}) {
  const router = useRouter();
  const translateY = useRef(new Animated.Value(600)).current;

  const handleConfigurePress = () => {
    onClose();
    router.push("/settings-overlay" as never);
  };

  const handleDiscoverPress = () => {
    onClose();
    router.push("/discover");
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newY = Math.max(0, gestureState.dy);
        translateY.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 600,
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
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: 600,
        duration: 250,
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
      backgroundColor: "rgba(0,0,0,0.7)",
    },
    container: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: blendColors(
        themeValues.COLORS.background,
        themeValues.COLORS.primary,
        0.08
      ),
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingBottom: Platform.OS === "ios" ? 40 : 24,
      alignItems: "center" as const,
      overflow: "hidden" as const,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: themeValues.COLORS.primary,
      borderRadius: 999,
      opacity: 0.2,
      marginTop: 12,
      marginBottom: 14,
    },
    content: {
      width: "100%" as const,
      paddingHorizontal: 24,
      alignItems: "center" as const,
    },
    profileImage: {
      width: "75%" as const,
      aspectRatio: 1,
      borderRadius: 32,
      backgroundColor: "#6b5656ff",
      marginTop: 20,
    },
    usernameRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginTop: 20,
      gap: 8,
    },
    usernameText: {
      ...TYPOGRAPHY.headlineSmall,
      color: "#E3E2E6",
      fontWeight: "600" as const,
    },
    statusRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginTop: 8,
      gap: 6,
    },
    statusText: {
      ...TYPOGRAPHY.bodyMedium,
      color: themeValues.COLORS.primary,
    },
    statsBar: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      width: "100%" as const,
      marginTop: 14,
      marginBottom: -24,
      paddingHorizontal: 8,
    },
    statItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
    },
    statValue: {
      color: themeValues.COLORS.primary,
      ...TYPOGRAPHY.bodyLarge,
      fontWeight: "500" as const,
    },
    profileButton: {
      width: "89%" as const,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      borderRadius: 100,
      paddingVertical: 12,
      paddingHorizontal: 24,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: 8,
      marginTop: 12,
      marginBottom: 12,
    },
    profileButtonText: {
      color: "#E3E2E6",
      ...TYPOGRAPHY.bodyLarge,
      fontWeight: "600" as const,
    },
    bottomBar: {
      flexDirection: "row" as const,
      marginTop: 60,
      width: "100%" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: 12,
    },
    barButton: {
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      borderRadius: 100,
      paddingVertical: 12,
      paddingHorizontal: 24,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
    },
    barButtonText: {
      color: themeValues.COLORS.primary,
      ...TYPOGRAPHY.bodyMedium,
      fontWeight: "600" as const,
    },
  }));

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  if (!show) return null;

  return (
    <Modal
      animationType="none"
      visible={show}
      transparent
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: translateY.interpolate({
                inputRange: [0, 600],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              Animated.timing(translateY, {
                toValue: 600,
                duration: 250,
                useNativeDriver: true,
              }).start(() => onClose());
            }}
          />
        </Animated.View>

        <Animated.View
          style={[styles.container, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handle} />

          <View style={styles.content}>
            {profile?.profile_picture ? (
              <Image
                source={{ uri: profile.profile_picture }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImage}>
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="person" size={100} color="#413939" />
                </View>
              </View>
            )}

            <View style={styles.usernameRow}>
              <Text style={styles.usernameText}>
                {profile?.username || "You"}
              </Text>
            </View>

            <View style={styles.statusRow}>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color="rgba(255,255,255,0.6)"
              />
              <Text style={styles.statusText}>42 today</Text>
            </View>

            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <MaterialIcons name="play-arrow" size={24} color="#E3E2E6" />
                <Text style={styles.statValue}>{formatNumber(playCount)}</Text>
              </View>

              <View style={styles.statItem}>
                <MaterialIcons name="mic" size={22} color="#E3E2E6" />
                <Text style={styles.statValue}>
                  {formatNumber(statsNumbers[0])}
                </Text>
              </View>

              <View style={styles.statItem}>
                <MaterialIcons
                  name="radio-button-checked"
                  size={22}
                  color="#E3E2E6"
                />
                <Text style={styles.statValue}>
                  {formatNumber(statsNumbers[1])}
                </Text>
              </View>

              <View style={styles.statItem}>
                <MaterialIcons name="music-note" size={22} color="#E3E2E6" />
                <Text style={styles.statValue}>
                  {formatNumber(statsNumbers[2])}
                </Text>
              </View>
            </View>

            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.barButton}
                activeOpacity={0.7}
                onPress={handleConfigurePress}
              >
                <MaterialIcons name="settings" size={22} color="#E3E2E6" />
                <Text style={styles.barButtonText}>Configure</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.barButton}
                activeOpacity={0.7}
                onPress={handleDiscoverPress}
              >
                <MaterialIcons name="explore" size={22} color="#E3E2E6" />
                <Text style={styles.barButtonText}>Discover</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                router.push("/profile");
              }}
            >
              <MaterialIcons name="person" size={22} color="#E3E2E6" />
              <Text style={styles.profileButtonText}>Profile</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
