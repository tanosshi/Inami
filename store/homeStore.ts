import { create } from "zustand";

interface HomeSessionState {
  showRecommended: boolean | null;
  speedDialSongs: any[];
  setShowRecommended: (value: boolean) => void;
  setSpeedDialSongs: (songs: any[]) => void;
  resetSession: () => void;
}

export const useHomeSessionStore = create<HomeSessionState>((set) => ({
  showRecommended: null,
  speedDialSongs: [],
  setShowRecommended: (value) => set({ showRecommended: value }),
  setSpeedDialSongs: (songs) => set({ speedDialSongs: songs }),
  resetSession: () => set({ showRecommended: null, speedDialSongs: [] }),
}));
