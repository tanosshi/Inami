import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
    statsContainer: {
      paddingRight: SPACING.md,
    },
    statsRow: {
      flexDirection: "row" as const,
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    statChip: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainerHigh,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.sm,
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
  );
}
