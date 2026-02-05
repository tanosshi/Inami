import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  initDatabase,
  getProfileItem,
  getAllSongs,
} from "../../utils/database";
import { useDynamicTheme } from "../../contexts/DynamicThemeContext";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";
import { COLORS } from "../../constants/theme";
import RecentTracks from "./components/recentTracks";
import TracksListened from "./components/tracksListened";

import TopTracks from "./components/topTracks";
import TopArtists from "./components/topArtists";
import WordCloud from "@/components/WordCloud";

const { width } = Dimensions.get("window");
const CONTENT_PADDING = 24;

export default function MusicProfile() {
  const router = useRouter();
  const { dynamicColors, hasPalette } = useDynamicTheme();
  const [profile, setProfile] = useState<any>(null);
  const [randomTracks, setRandomTracks] = useState<any[]>([]);
  const [primaryColor, setPrimaryColor] = useState("#a3e635");
  const [rawColor, setRawColor] = useState("#a3e635");

  useEffect(() => {
    const loadData = async () => {
      await initDatabase();
      const profileData = await getProfileItem();
      setProfile(profileData);

      setPrimaryColor(profileData?.primary_color || "#a3e635");
      setRawColor(profileData?.raw_color || "#a3e635");

      const allSongs = await getAllSongs();
      const shuffled = [...allSongs].sort(() => 0.5 - Math.random());
      setRandomTracks(shuffled.slice(0, 4));
    };
    loadData();
  }, []);

  const headerBackgroundColor = hasPalette
    ? dynamicColors.primary
    : primaryColor;
  const iconColor = hasPalette ? dynamicColors.primary : primaryColor;
  const accentColor = hasPalette ? dynamicColors.primary : rawColor;

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    headerContainer: {
      borderBottomLeftRadius: 48,
      borderBottomRightRadius: 48,
      paddingBottom: 40,
    },
    navBar: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
      paddingTop: 16,
      marginTop: 20,
    },
    circleButton: {
      width: 48,
      height: 48,
      backgroundColor: COLORS.background,
      borderRadius: 24,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    circleButtonIcon: {
      color: hasPalette ? dynamicColors.primary : primaryColor,
    },
    profileInfo: {
      alignItems: "center" as const,
      marginTop: 16,
    },
    imageContainer: {
      width: 176,
      height: 176,
      backgroundColor: COLORS.surface,
      borderRadius: 48,
      overflow: "hidden" as const,
      marginBottom: 16,
    },
    profileImage: {
      width: "100%" as const,
      height: "100%" as const,
    },
    nameText: {
      color: COLORS.background,
      fontSize: 22,
      fontWeight: "bold" as const,
      marginBottom: 4,
    },
    handleText: {
      color: COLORS.background,
      fontSize: 16,
      opacity: 0.7,
    },
    statsContainer: {
      flexDirection: "row" as const,
      gap: 64,
      marginTop: 24,
    },
    statItem: {
      alignItems: "center" as const,
    },
    statNumber: {
      color: COLORS.background,
      fontSize: 30,
      fontWeight: "900" as const,
    },
    statLabel: {
      color: COLORS.background,
      fontSize: 14,
    },
    contentSection: {
      padding: CONTENT_PADDING,
    },
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View
          style={[
            styles.headerContainer,
            { backgroundColor: headerBackgroundColor },
          ]}
        >
          <SafeAreaView>
            <View style={styles.navBar}>
              <TouchableOpacity
                style={styles.circleButton}
                onPress={() => router.back()}
              >
                <Feather name="chevron-left" size={24} color={iconColor} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleButton}>
                <Feather name="more-vertical" size={24} color={iconColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.imageContainer}>
                <Image
                  source={
                    profile?.profile_picture ||
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                  }
                  style={styles.profileImage}
                  contentFit="cover"
                />
              </View>

              <Text style={styles.nameText}>
                {profile?.aka
                  ? `${profile.aka}`
                  : `@${profile?.username?.slice(0, 3) || "Use"}`}
              </Text>
              <Text style={styles.handleText}>
                @{profile?.username || "User"}
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {profile?.playcount
                      ? parseInt(profile.playcount).toLocaleString()
                      : "0"}
                  </Text>
                  <Text style={styles.statLabel}>plays</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {profile?.artist_count
                      ? parseInt(profile.artist_count).toLocaleString()
                      : "0"}
                  </Text>
                  <Text style={styles.statLabel}>artists</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={styles.contentSection}>
          <TopTracks />
          <TopArtists />
          <TracksListened accentColor={accentColor} />
          <WordCloud height={300} accentColor={accentColor} />
        </View>
      </ScrollView>
    </View>
  );
}
