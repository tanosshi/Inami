import React, { useEffect, useState } from "react";
import { useSongStore } from "../../store/songStore";
import { usePlayerStore } from "../../store/playerStore";
import { usePlaylistStore } from "../../store/playlistStore";
import HomeComponent from "../Home";

export default function HomeTab() {
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
  const { playlists, fetchPlaylists } = usePlaylistStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (songs.length === 0 || !stats) {
      Promise.all([
        fetchSongs(),
        fetchLikedSongs(),
        fetchStats(),
        fetchPlaylists(),
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchSongs(),
      fetchLikedSongs(),
      fetchStats(),
      fetchPlaylists(),
    ]);
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
    <HomeComponent
      songs={songs}
      likedSongs={likedSongs}
      stats={stats}
      loading={loading}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onPlaySong={PlaySong}
      onPlayLiked={PlayLiked}
      playlists={playlists}
    />
  );
}
