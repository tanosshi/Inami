import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { getProfile, TopItem } from "../../../utils/database/profileOperations";
import { useDynamicStyles } from "../../../hooks/useDynamicStyles";
import { COLORS } from "../../../constants/theme";

const { width } = Dimensions.get("window");
const CONTENT_PADDING = 24;
const COLUMN_GAP = 12;
const ITEM_WIDTH = (width - CONTENT_PADDING * 2 - COLUMN_GAP) / 2;

export default function TopTracks() {
  const [tracks, setTracks] = useState<TopItem[]>([]);

  const styles = useDynamicStyles(() => ({
    sectionTitle: {
      color: COLORS.onSurface,
      fontSize: 18,
      fontWeight: "600" as const,
      marginBottom: 16,
    },
    gridContainer: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      marginBottom: 40,
      gap: COLUMN_GAP,
    },
    card: {
      width: ITEM_WIDTH,
      aspectRatio: 1,
      borderRadius: 19,
      overflow: "hidden" as const,
      backgroundColor: COLORS.surface,
      position: "relative" as const,
    },
    trackImage: {
      width: "100%" as const,
      height: "100%" as const,
      borderRadius: 19,
    },
    vignetteGradient: {
      position: "absolute" as const,
      bottom: -1,
      left: 0,
      right: 0,
      height: "60%" as const,
      borderRadius: 19,
    },
    infoContainer: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      padding: 12,
    },
    trackName: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "600" as const,
      marginBottom: 4,
    },
    scrobbles: {
      color: "#fff",
      fontSize: 12,
      opacity: 0.7,
    },
    imagePlaceholder: {
      width: "100%" as const,
      height: "100%" as const,
      backgroundColor: COLORS.surface,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      borderRadius: 19,
    },
    placeholderText: {
      color: COLORS.onSurface,
      fontSize: 48,
      fontWeight: "bold" as const,
      opacity: 0.3,
    },
  }));

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await getProfile();
      if (profile && profile.top_tracks) {
        setTracks(profile.top_tracks.slice(0, 4));
      }
    };
    fetchProfile();
  }, []);

  if (tracks.length === 0) return null;

  return (
    <View>
      <Text style={styles.sectionTitle}>top tracks</Text>

      <View style={styles.gridContainer}>
        {tracks.map((track, index) => (
          <TouchableOpacity
            key={track.mbid || index}
            style={styles.card}
            activeOpacity={0.7}
          >
            {track.image ? (
              <>
                <Image
                  source={track.image}
                  style={styles.trackImage}
                  contentFit="cover"
                  transition={1000}
                />
                <LinearGradient
                  colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
                  locations={[0.3, 1]}
                  style={styles.vignetteGradient}
                />
                <View style={styles.infoContainer}>
                  <Text style={styles.trackName} numberOfLines={1}>
                    {track.name}
                  </Text>
                  <Text style={styles.scrobbles}>{track.amount} scrobbles</Text>
                </View>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.placeholderText}>
                  {track.name.charAt(0)}
                </Text>
                <View style={styles.infoContainer}>
                  <Text style={styles.trackName} numberOfLines={1}>
                    {track.name}
                  </Text>
                  <Text style={styles.scrobbles}>{track.amount} scrobbles</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
