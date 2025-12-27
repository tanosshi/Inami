import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-ignore
import { useRouter } from "expo-router";
import { COLORS, SPACING } from "../constants/theme";
import Header from "./home/header";
import QuickStats from "./home/quick-stats";
import PlaylistsRow from "./home/playlists-row";
import TopArtists from "./home/top-artists";
import MostPlayed from "./home/most-played";
import RecentlyAdded from "./home/recently-added";
import EmptyState from "./home/empty-state";
import DemoBanner from "./home/demo-banner";
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
  artwork: string;
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
        {/* Demo */}
        {isDemo && <DemoBanner />}
        {!isDemo && Platform.OS === "web" && <WebBanner />}

        {/* Header */}
        <Header onSettingsPress={() => router.push("/settings")} />

        {/* Quick Stats */}
        {/* @ts-ignore */}
        <QuickStats stats={stats} />

        {/* Playlists Row */}
        <PlaylistsRow playlists={playlists} />

        {/* Top Artists Grid */}
        <TopArtists topArtists={topArtists} />

        {/* Either: Show recommended Songs for the current time (Most played during time period) OR show Most Played */}
        {/* Most Played */}
        <RecommendedPeriod stats={stats} onPlaySong={onPlaySong} />
        <MostPlayed stats={stats} onPlaySong={onPlaySong} />

        {/* Recently Added */}
        <RecentlyAdded songs={songs} onPlaySong={onPlaySong} />

        {/* Empty State */}
        {songs.length === 0 && <EmptyState />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: 140,
  },
});
