import { create } from "zustand";
import { Platform } from "react-native";
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from "expo-audio";
import * as db from "../utils/database";
import {
  updateNotificationState,
  initializeNotificationService,
  setupNotificationListeners,
} from "../utils/notificationService";

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

interface PlayerState {
  currentSong: Song | null;
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  player: AudioPlayer | null;
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
  player: null,
  webAudio: null,
  showPlayer: false,

  playSong: async (song: Song) => {
    const { player: existingPlayer, webAudio: existingWebAudio, queue } = get();

    if (existingWebAudio) {
      existingWebAudio.pause();
      existingWebAudio.src = "";
    } else if (existingPlayer) {
      existingPlayer.remove();
    }

    try {
      if (Platform.OS === "web") {
        const audio = new window.Audio(song.uri);

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

        const index = queue.findIndex((s) => s.id === song.id);

        set({
          webAudio: audio,
          player: null,
          currentSong: song,
          currentIndex: index >= 0 ? index : 0,
          isPlaying: true,
        });

        // Update notification
        updateNotificationState();
      } else {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });

        const newPlayer = createAudioPlayer({ uri: song.uri });

        newPlayer.addListener("playbackStatusUpdate", (status) => {
          set({
            position: (status.currentTime || 0) * 1000,
            duration: (status.duration || 0) * 1000,
            isPlaying: status.playing,
          });

          if (status.didJustFinish) {
            get().playNext();
          }
        });

        newPlayer.play();

        const index = queue.findIndex((s) => s.id === song.id);

        set({
          player: newPlayer,
          webAudio: null,
          currentSong: song,
          currentIndex: index >= 0 ? index : 0,
          isPlaying: true,
        });

        // Update notification
        updateNotificationState();
      }

      try {
        await db.incrementPlayCount(song.id);
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
    const { player, webAudio, isPlaying } = get();

    try {
      if (Platform.OS === "web") {
        if (!webAudio) return;
        if (isPlaying) {
          webAudio.pause();
        } else {
          await webAudio.play();
        }
      } else {
        if (!player) return;
        if (isPlaying) {
          player.pause();
        } else {
          player.play();
        }
      }
      set({ isPlaying: !isPlaying });

      // Update notification
      updateNotificationState();
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
    const { player, webAudio } = get();

    try {
      if (Platform.OS === "web") {
        if (!webAudio) return;
        webAudio.currentTime = position / 1000;
      } else {
        if (!player) return;
        await player.seekTo(position / 1000);
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
    const { player } = get();

    if (player) {
      player.remove();
    }

    set({
      player: null,
      webAudio: null,
      currentSong: null,
      isPlaying: false,
      position: 0,
      duration: 0,
    });

    updateNotificationState();
  },

  showPlayerOverlay: () => {
    set({ showPlayer: true });
  },

  hidePlayerOverlay: () => {
    set({ showPlayer: false });
  },
}));
