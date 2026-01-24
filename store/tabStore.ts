import { create } from "zustand";

interface TabStore {
  currentTabIndex: number;
  setTabIndex: (index: number) => void;
}

export const useTabStore = create<TabStore>((set) => ({
  currentTabIndex: 0,
  setTabIndex: (index: number) => set({ currentTabIndex: index }),
}));

export const TAB_INDEXES = {
  home: 0,
  songs: 1,
  artists: 2,
  playlists: 3,
} as const;
