import { create } from "zustand";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as db from "../utils/database";
import { getAudioPro } from "../utils/audioSetup";
import { getSongById } from "../utils/database/songOperations";

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
  palette?: string[];
}

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  webAudio: HTMLAudioElement | null;
  showPlayer: boolean;
  playSong: (song: Song) => Promise<void>;
  setQueue: (songs: Song[]) => void;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  updatePosition: (position: number) => void;
  stopPlayback: () => Promise<void>;
  showPlayerOverlay: () => void;
  hidePlayerOverlay: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  queue: [],
  currentIndex: 0,
  isPlaying: false,
  position: 0,
  duration: 0,
  shuffle: false,
  repeat: "off",
  webAudio: null,
  showPlayer: false,

  playSong: async (song: Song) => {
    const { webAudio: existingWebAudio, queue } = get();

    if (existingWebAudio) {
      existingWebAudio.pause();
      existingWebAudio.src = "";
    }

    try {
      // Fetch complete song data including palette
      const fullSongData = await getSongById(song.id);
      const songWithPalette = fullSongData ? { ...song, ...fullSongData } : song;

      if (Platform.OS === "web") {
        const audio = new window.Audio(songWithPalette.uri);

        audio.addEventListener("timeupdate", () => {
          set({
            position: audio.currentTime * 1000,
            duration: (audio.duration || 0) * 1000,
          });
        });

        audio.addEventListener("ended", () => {
          get().playNext();
        });

        audio.addEventListener("loadedmetadata", () => {
          set({ duration: audio.duration * 1000 });
        });

        await audio.play();

        const index = queue.findIndex((s) => s.id === songWithPalette.id);

        set({
          webAudio: audio,
          currentSong: songWithPalette,
          currentIndex: index >= 0 ? index : 0,
          isPlaying: true,
        });
      } else {
        const AudioPro = getAudioPro();
        if (!AudioPro) return;
        const getPlayableUri = async (uri: string) => {
          try {
            if (Platform.OS === "android" && uri.startsWith("content://")) {
              const decoded = decodeURIComponent(uri);
              const lastSlash = decoded.lastIndexOf("/");
              const filename =
                lastSlash !== -1
                  ? decoded.substring(lastSlash + 1)
                  : `audio_${Date.now()}`;

              const dest = FileSystem.cacheDirectory + filename;
              await FileSystem.copyAsync({ from: uri, to: dest });
              return dest;
            }
          } catch {}

          return uri;
        };

        const playableUri = await getPlayableUri(songWithPalette.uri);

        const track = {
          id: songWithPalette.id,
          url: playableUri,
          title: songWithPalette.title,
          artist: songWithPalette.artist || "Unknown Artist",
          album: songWithPalette.album || "Unknown Album",
          artwork: songWithPalette.artwork || "",
        };

        AudioPro.play(track);
        const index = queue.findIndex((s) => s.id === songWithPalette.id);

        set({
          webAudio: null,
          currentSong: songWithPalette,
          currentIndex: index >= 0 ? index : 0,
          isPlaying: true,
        });
      }

      try {
        await db.incrementPlayCount(songWithPalette.id);
      } catch (error) {
        console.error("Failed to increment play count:", error);
      }
    } catch (error) {
      console.error("Error playing song:", error);
    }
  },

  setQueue: (songs: Song[]) => {
    set({ queue: songs });
  },

  togglePlayPause: async () => {
    const { webAudio, isPlaying } = get();

    try {
      if (Platform.OS === "web") {
        if (!webAudio) return;
        if (isPlaying) {
          webAudio.pause();
        } else {
          await webAudio.play();
        }
        set({ isPlaying: !isPlaying });
      } else {
        const AudioPro = getAudioPro();
        if (!AudioPro) return;

        if (isPlaying) AudioPro.pause();
        else AudioPro.resume();

        set({ isPlaying: !isPlaying });
      }
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  },

  playNext: async () => {
    const { queue, currentIndex, repeat, shuffle } = get();
    if (queue.length === 0) return;

    let nextIndex: number;

    if (repeat === "one") {
      nextIndex = currentIndex;
    } else if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
      if (nextIndex === 0 && repeat === "off") {
        await get().stopPlayback();
        return;
      }
    }

    const nextSong = queue[nextIndex];
    if (nextSong) {
      await get().playSong(nextSong);
    }
  },

  playPrevious: async () => {
    const { queue, currentIndex, position } = get();
    if (queue.length === 0) return;

    if (position > 3000) {
      await get().seekTo(0);
      return;
    }

    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    const prevSong = queue[prevIndex];
    if (prevSong) {
      await get().playSong(prevSong);
    }
  },

  seekTo: async (position: number) => {
    const { webAudio } = get();

    try {
      if (Platform.OS === "web") {
        if (!webAudio) return;
        webAudio.currentTime = position / 1000;
      } else {
        const AudioPro = getAudioPro();
        if (!AudioPro) return;
        AudioPro.seekTo(position);
      }
      set({ position });
    } catch (error) {
      console.error("Error seeking:", error);
    }
  },

  toggleShuffle: () => {
    set((state) => ({ shuffle: !state.shuffle }));
  },

  toggleRepeat: () => {
    set((state) => {
      const modes: ("off" | "all" | "one")[] = ["off", "all", "one"];
      const currentIdx = modes.indexOf(state.repeat);
      return { repeat: modes[(currentIdx + 1) % modes.length] };
    });
  },

  updatePosition: (position: number) => {
    set({ position });
  },

  stopPlayback: async () => {
    const { webAudio } = get();

    if (Platform.OS === "web") {
      if (webAudio) {
        webAudio.pause();
        webAudio.src = "";
      }
    } else {
      const AudioPro = getAudioPro();
      if (AudioPro) AudioPro.clear();
    }

    set({
      webAudio: null,
      currentSong: null,
      isPlaying: false,
      position: 0,
      duration: 0,
    });
  },

  showPlayerOverlay: () => {
    set({ showPlayer: true });
  },

  hidePlayerOverlay: () => {
    set({ showPlayer: false });
  },
}));
