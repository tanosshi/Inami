import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import Home from "../../components/Home";

export default function HomeScreen() {
  const router = useRouter();
  const {
    songs,
    likedSongs,
    stats,
    fetchSongs,
    fetchLikedSongs,
    fetchStats,
    loading,
  } = useSongStore();
  const { playSong, setQueue } = usePlayerStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    Promise.all([fetchSongs(), fetchLikedSongs(), fetchStats()]);
  }, [fetchSongs, fetchLikedSongs, fetchStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSongs(), fetchLikedSongs(), fetchStats()]);
    setRefreshing(false);
  };

  const PlaySong = (song: any) => {
    setQueue(songs);
    playSong(song);
    router.push("/player");
  };

  const PlayLiked = () => {
    if (likedSongs.length > 0) {
      setQueue(likedSongs);
      playSong(likedSongs[0]);
      router.push("/player");
    }
  };

  return (
    <Home
      songs={songs}
      likedSongs={likedSongs}
      stats={stats}
      loading={loading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onPlaySong={PlaySong}
      onPlayLiked={PlayLiked}
    />
  );
}
