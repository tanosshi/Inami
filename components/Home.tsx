import React from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-ignore
import { useRouter } from "expo-router";
import { COLORS, SPACING } from "../constants/theme";
import { useDynamicStyles } from "../hooks/useDynamicStyles";

// YouTube Music -type components
import Header from "./home/header";
import QuickStats from "./home/quick-stats";
import PlaylistsRow from "./home/playlists-row";
import SpeedDial from "./home/speed-dial";
import MostPlayed from "./home/most-played";
import RecentlyAdded from "./home/recently-added";
import EmptyState from "./home/empty-state";
import WebBanner from "./home/web-banner";
import RecommendedPeriod from "./home/recommended-period";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork?: string;
  is_liked: boolean;
  play_count: number;
}

interface Stats {
  total_songs: number;
  liked_songs: number;
  total_playlists: number;
  total_play_count: number;
  top_artist?: string;
  most_played_song?: Song;
}

interface Artist {
  name: string;
  playCount: number;
  image?: string;
}

interface PlaylistDemo {
  id: string;
  artwork?: string | null;
}

interface HomeProps {
  songs: Song[];
  likedSongs: Song[];
  stats: Stats | null;
  topArtists?: Artist[];
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onPlaySong: (song: Song) => void;
  onPlayLiked: () => void;
  isDemo?: boolean;
  playlists?: PlaylistDemo[];
}

export default function Home({
  songs,
  likedSongs,
  stats,
  topArtists = [],
  loading = false,
  refreshing = false,
  onRefresh,
  onPlaySong,
  onPlayLiked,
  isDemo = false,
  playlists = [],
}: HomeProps) {
  const router = useRouter();
  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: SPACING.md,
      paddingBottom: 140,
    },
    quickStatsWrapper: {
      marginLeft: -SPACING.md,
      marginRight: -SPACING.md,
      marginBottom: SPACING.lg,
    },
  }));

  const showRecommended = React.useMemo(() => Math.random() < 0.5, []);

  if (loading && songs.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
            />
          ) : undefined
        }
      >
        {/* Warning */}
        {!isDemo && Platform.OS === "web" && <WebBanner />}

        {/* Header */}
        <Header onSettingsPress={() => router.push("/settings")} />

        {/* Quick Stats */}
        <View style={styles.quickStatsWrapper}>
          {/* @ts-ignore */}
          <QuickStats stats={stats} />
        </View>

        {/* Playlists Row */}
        <PlaylistsRow playlists={playlists} />

        {/* Speed Dial Grid */}
        <SpeedDial songs={songs} onPlaySong={onPlaySong} />

        {/* Either: Show recommended Songs for the current time (Most played during time period) OR show Most Played */}
        {/* Randomly choose one for now */}
        {showRecommended ? (
          <RecommendedPeriod stats={stats} onPlaySong={onPlaySong} />
        ) : (
          <MostPlayed stats={stats} onPlaySong={onPlaySong} />
        )}

        {/* Recently Added */}
        <RecentlyAdded songs={songs} onPlaySong={onPlaySong} />

        {/* Empty State */}
        {songs.length === 0 && <EmptyState />}
      </ScrollView>
    </SafeAreaView>
  );
}
