import { React } from "react";
// @ts-ignore
import { useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

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
  const navigation = useNavigation();
  const router = useRouter();
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
            color={COLORS.onSurfaceVariant}
          />
          <Text style={[styles.statChipText]}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statChip}
          onPress={() => router.push("/(tabs)/songs")}
        >
          <MaterialIcons
            name="library-music"
            size={18}
            color={COLORS.onSurfaceVariant}
          />
          <Text style={styles.statChipText}>
            {stats?.total_songs || 0} songs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statChip}
          onPress={() => router.push("/(tabs)/playlists")}
        >
          <MaterialIcons
            name="queue-music"
            size={18}
            color={COLORS.onSurfaceVariant}
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
            color={COLORS.onSurfaceVariant}
          />
          <Text style={[styles.statChipText]}>Most played</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    paddingRight: SPACING.md,
  },
  statsRow: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
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
});
