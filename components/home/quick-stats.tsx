import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Shadow } from "react-native-shadow-2";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { useTabStore, TAB_INDEXES } from "../../store/tabStore";

interface Stats {
  total_songs: number;
  liked_songs: number;
  total_playlists: number;
  total_play_count: number;
  top_artist?: string;
  most_played_song?: any;
}

interface QuickStatsProps {
  likedSongs: any[];
  stats: Stats | null;
}

export default function QuickStats({ stats }: QuickStatsProps) {
  const setTabIndex = useTabStore((state) => state.setTabIndex);
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    container: {
      position: "relative" as const,
    },
    statsContainer: {
      paddingHorizontal: SPACING.md,
    },
    statsRow: {
      flexDirection: "row" as const,
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    leftShadow: {
      position: "absolute" as const,
      left: -60,
      top: 0,
      bottom: 0,
      width: SPACING.xxl,
      zIndex: 1,
    },
    rightShadow: {
      position: "absolute" as const,
      right: -60,
      top: 0,
      bottom: 0,
      width: SPACING.xxl,
      zIndex: 1,
    },
    statChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainer,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.md,
      gap: SPACING.sm,
    },
    statChipActive: {
      backgroundColor: COLORS.primaryContainer,
    },
    statChipText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
    },
    statChipTextActive: {
      color: COLORS.onPrimaryContainer,
    },
  }));

  return (
    <View style={styles.container}>
      <Shadow
        distance={24}
        startColor={COLORS.background}
        containerStyle={styles.leftShadow}
        offset={[0, 0]}
      >
        <View style={{ width: SPACING.xxl, height: "100%" }} />
      </Shadow>

      <Shadow
        distance={24}
        startColor={COLORS.background}
        containerStyle={styles.rightShadow}
        offset={[0, 0]}
      >
        <View style={{ width: SPACING.xxl, height: "100%" }} />
      </Shadow>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statsContainer}
      >
        <View style={styles.statsRow}>
          <TouchableOpacity
            style={[styles.statChip]}
            onPress={() => Alert.alert("wait", "wait")}
          >
            <MaterialIcons
              name="history"
              size={18}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <Text style={[styles.statChipText]}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statChip}
            onPress={() => setTabIndex(TAB_INDEXES.songs)}
          >
            <MaterialIcons
              name="library-music"
              size={18}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <Text style={styles.statChipText}>
              {stats?.total_songs || 0} songs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statChip}
            onPress={() => setTabIndex(TAB_INDEXES.playlists)}
          >
            <MaterialIcons
              name="queue-music"
              size={18}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <Text style={styles.statChipText}>
              {stats?.total_playlists || 0} playlists
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statChip]}
            onPress={() => Alert.alert("wait", "wait")}
          >
            <MaterialIcons
              name="repeat"
              size={18}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <Text style={[styles.statChipText]}>Most played</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
