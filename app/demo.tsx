// dont take this as actual code quality reference lol everything here will be scraped
import React, { useEffect } from "react";

import Home from "../components/Home";

import {
  getAllSongs,
  getAllPlaylists,
  getStats,
  getThemeSettings,
  getAllSettings,
  getAllArtists,
  getAllArtistComments,
  getAllSongComments,
} from "../utils/database";

const DEMO_SONGS = [
  {
    id: "demo-1",
    title: "demo name1",
    artist: "demo artist1",
    album: "demo album1",
    duration: 234000,
    uri: "https://example.com/song1.mp3",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/770x0/02fc7d3daf87057acb28b342cdd3d6f1.jpg#02fc7d3daf87057acb28b342cdd3d6f1",
    is_liked: true,
    play_count: 42,
  },
  {
    id: "demo-2",
    title: "demo name2",
    artist: "demo artist2",
    album: "demo album2",
    duration: 198000,
    uri: "https://example.com/song2.mp3",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/770x0/e25013f1375c4a63ca8b4ed1e76b3abc.jpg#e25013f1375c4a63ca8b4ed1e76b3abc",
    is_liked: false,
    play_count: 15,
  },
  {
    id: "demo-3",
    title: "demo name3",
    artist: "demo artist3",
    album: "demo album3",
    duration: 267000,
    uri: "https://example.com/song3.mp3",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/770x0/243e1dc901aa8ffb8bab8b54bad1b2d8.jpg#243e1dc901aa8ffb8bab8b54bad1b2d8",
    is_liked: true,
    play_count: 88,
  },
  {
    id: "demo-4",
    title: "demo name4",
    artist: "demo artist4",
    album: "demo album4",
    duration: 312000,
    uri: "https://example.com/song4.mp3",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/300x300/e4e2e2165fa25daf9e257bffb6850dd8.jpg",
    is_liked: false,
    play_count: 23,
  },
  {
    id: "demo-5",
    title: "demo name5",
    artist: "demo artist5",
    album: "demo album5",
    duration: 185000,
    uri: "https://example.com/song5.mp3",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/300x300/42e745c674ed5196783ed5a5baaa946f.jpg",
    is_liked: true,
    play_count: 56,
  },
];

const DEMO_LIKED_SONGS = DEMO_SONGS.filter((song) => song.is_liked);

const DEMO_STATS = {
  total_songs: 7,
  liked_songs: 4,
  total_playlists: 3,
  total_play_count: 322,
  top_artist: "demo name1",
  most_played_song: DEMO_SONGS[2],
};
const getArtistImage = (artistName: string, explicitImage?: string) => {
  // unfinished function for the home/index
  if (explicitImage) return explicitImage;
  const artistSong = DEMO_SONGS.find((song) => song.artist === artistName);
  return artistSong?.artwork;
};

const DEMO_PLAYLISTS = [
  {
    id: "playlist-1",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/770x0/860e5b5ff90862c2e8c7de91f2621519.jpg#860e5b5ff90862c2e8c7de91f2621519",
  },
  {
    id: "playlist-2",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/300x300/9c2b1fb8fcc7a45675ffc8e0734d5a1b.jpg",
  },
  {
    id: "playlist-3",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/avatar70s/e0a5d5e1330ae4b29bbd0af289576727.jpg",
  },
  {
    id: "playlist-4",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/avatar70s/de9b80f0dd5cf69a10611094009b7ca3.jpg",
  },
  {
    id: "playlist-5",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/avatar70s/de9b80f0dd5cf69a10611094009b7ca3.jpg",
  },
  {
    id: "playlist-6",
    artwork:
      "https://lastfm.freetls.fastly.net/i/u/avatar70s/954af72670e7f6def07ca3861ef7908e.jpg",
  },
];

const DEMO_TOP_ARTISTS = [
  {
    name: "demo name1",
    playCount: 197,
    image: getArtistImage("demo artist1"),
  },
  {
    name: "demo name2",
    playCount: 71,
    image: getArtistImage("demo artist2"),
  },
  {
    name: "demo artist3",
    playCount: 31,
    image: getArtistImage("demo artist3"),
  },
];

export default function DemoScreen() {
  const handlePlaySong = (song: any) => {
    console.log("Demo: Playing song", song.title);
  };

  const handlePlayLiked = () => {
    console.log("Demo: Playing liked songs");
  };

  useEffect(() => {
    (async () => {
      try {
        const [
          songs,
          playlists,
          stats,
          theme,
          settings,
          artists,
          comments,
          scm,
        ] = await Promise.all([
          getAllSongs(),
          getAllPlaylists(),
          getStats(),
          getThemeSettings(),
          getAllSettings(),
          getAllArtists(),
          getAllArtistComments(),
          getAllSongComments(),
        ]);

        function log() {
          console.log(
            "[Database] Settings:",
            JSON.stringify(settings, null, 2)
          );
          console.log("[Database] Theme:", JSON.stringify(theme, null, 2));
          console.log("[Database] Stats:", JSON.stringify(stats, null, 2));
          console.log("[Database] Artists:", JSON.stringify(artists, null, 2));
          console.log("[Database] Songs:", JSON.stringify(songs, null, 2));
          console.log(
            "[Database] Playlists:",
            JSON.stringify(playlists, null, 2)
          );
          void comments;
          void scm;
          //console.log(
          //  "[Database] Artist Comments:",
          //  JSON.stringify(comments, null, 2)
          //);
          //console.log(
          //  "[Database] Song Comments:",
          //  JSON.stringify(scm, null, 2)
          //);
        }
        log();
      } catch (e) {
        console.warn("[Database] Could not log database:", e);
      }
    })();
  }, []);

  return (
    <Home
      songs={DEMO_SONGS}
      likedSongs={DEMO_LIKED_SONGS}
      stats={DEMO_STATS}
      topArtists={DEMO_TOP_ARTISTS}
      onPlaySong={handlePlaySong}
      onPlayLiked={handlePlayLiked}
      isDemo
      playlists={DEMO_PLAYLISTS}
    />
  );
}
