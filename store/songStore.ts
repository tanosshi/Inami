import { create } from "zustand";
import { File } from "expo-file-system/next";
import * as db from "../utils/database";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork?: string;
  palette?: string[];
  genres?: string[];
  is_liked: boolean;
  play_count: number;
  created_at?: string;
}

interface Stats {
  total_songs: number;
  liked_songs: number;
  total_playlists: number;
  total_play_count: number;
  top_artist?: string;
  most_played_song?: Song;
}

interface SongState {
  songs: Song[];
  likedSongs: Song[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  initializeStore: () => Promise<void>;
  fetchSongs: () => Promise<void>;
  fetchLikedSongs: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addSong: (
    song: Omit<Song, "id" | "is_liked" | "play_count"> & { palette?: string[] }
  ) => Promise<void>;
  deleteSong: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  importFromURL: (url: string, title?: string) => Promise<void>;
  scanDeviceMusic: () => Promise<void>;
}

export const useSongStore = create<SongState>((set, get) => ({
  songs: [],
  likedSongs: [],
  stats: null,
  loading: false,
  error: null,
  initialized: false,

  initializeStore: async () => {
    if (get().initialized) return;
    try {
      await db.initDatabase();
      set({ initialized: true });

      await get().fetchSongs();

      const songs = get().songs;
      const invalidSongs: { id: string; title: string; reason: string }[] = [];

      console.log(`Checking ${songs.length} songs...`);

      for (const song of songs) {
        if (
          !song.uri.startsWith("file://") &&
          song.uri.startsWith("content://")
        )
          continue;

        try {
          const file = new File(song.uri);
          const exists = file.exists;
          if (!exists) {
            invalidSongs.push({
              id: song.id,
              title: song.title,
              reason: `Audio file not found at: ${song.uri}`,
            });
          }
        } catch (error: any) {
          const errorMessage = error?.message?.toLowerCase() || "";
          if (
            errorMessage.includes("no such file") ||
            errorMessage.includes("not found") ||
            errorMessage.includes("enoent") ||
            errorMessage.includes("does not exist")
          ) {
            invalidSongs.push({
              id: song.id,
              title: song.title,
              reason: `File access error: ${error.message}`,
            });
          }
        }
      }

      if (invalidSongs.length > 0) {
        for (const { id, title, reason } of invalidSongs) {
          console.log(`Removing "${title}" (${id}) - ${reason}`);
          await db.deleteSong(id);
        }
        await get().fetchSongs();
      }

      await get().fetchLikedSongs();
      await get().fetchStats();
    } catch (error: any) {
      console.error(error);
      set({ error: error.message });
    }
  },

  fetchSongs: async () => {
    set({ loading: true, error: null });
    try {
      const songs = await db.getAllSongs();
      set({ songs: songs as Song[], loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchLikedSongs: async () => {
    try {
      const likedSongs = await db.getLikedSongs();
      set({ likedSongs: likedSongs as Song[] });
    } catch (error: any) {
      console.error("Error fetching liked songs:", error);
    }
  },

  fetchStats: async () => {
    try {
      const stats = await db.getStats();
      set({ stats: stats as Stats });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
    }
  },

  addSong: async (songData) => {
    set({ loading: true, error: null });
    try {
      const song = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...songData,
        is_liked: false,
        play_count: 0,
      };
      await db.addSong(song);
      set((state) => ({ songs: [song, ...state.songs], loading: false }));
      await get().fetchStats();
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteSong: async (id: string) => {
    try {
      await db.deleteSong(id);
      set((state) => ({
        songs: state.songs.filter((s) => s.id !== id),
        likedSongs: state.likedSongs.filter((s) => s.id !== id),
      }));
      await get().fetchStats();
    } catch (error: any) {
      throw error;
    }
  },

  toggleLike: async (id: string) => {
    try {
      await db.toggleLikeSong(id);
      const updatedSong = await db.getSongById(id);
      if (updatedSong) {
        set((state) => ({
          songs: state.songs.map((s) =>
            s.id === id ? (updatedSong as Song) : s
          ),
        }));
        await get().fetchLikedSongs();
        await get().fetchStats();
      }
    } catch (error: any) {
      throw error;
    }
  },

  importFromURL: async (url: string, title?: string) => {
    const songTitle =
      title ||
      url
        .split("/")
        .pop()
        ?.replace(/\.[^/.]+$/, "") ||
      "Unknown";
    await get().addSong({
      title: songTitle,
      artist: "Unknown Artist",
      album: "URL Import",
      uri: url,
      duration: 0,
    });
  },

  scanDeviceMusic: async () => {
    set({ loading: true, error: null });
    try {
      const { scanDeviceMusic } = await import("../utils/mediaScanner");
      await scanDeviceMusic();
      await get().fetchSongs();
      await get().fetchStats();
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
}));
