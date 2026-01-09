import React, { useEffect, useState } from "react";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import Home from "../Home";

export default function home() {
  const {
    songs,
    likedSongs,
    stats,
    fetchSongs,
    fetchLikedSongs,
    fetchStats,
    loading,
  } = useSongStore();
  const { playSong, setQueue, showPlayerOverlay } = usePlayerStore();
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
    showPlayerOverlay();
  };

  const PlayLiked = () => {
    if (likedSongs.length > 0) {
      setQueue(likedSongs);
      playSong(likedSongs[0]);
      showPlayerOverlay();
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
