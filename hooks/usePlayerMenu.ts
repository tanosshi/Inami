import { useState, useCallback } from "react";
import { isSleepTimerActive, formatRemainingTime } from "../utils/sleepTimer";

export interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  onPress: () => void;
}

export function usePlayerMenu() {
  const [sleepTimerModalVisible, setSleepTimerModalVisible] = useState(false);

  const menuItems: MenuItem[] = [
    {
      id: "delete-file",
      title: "Delete",
      icon: "delete",
      onPress: () => {},
    },
    {
      id: "add-to-playlist",
      title: "Add to Playlist",
      icon: "playlist-add",
      onPress: () => {},
    },
    {
      id: "share",
      title: "Share",
      icon: "share",
      onPress: () => {},
    },
    {
      id: "download",
      title: "Download",
      icon: "download",
      onPress: () => {},
    },
    {
      id: "Album",
      title: "Album",
      icon: "favorite",
      onPress: () => {},
    },
    {
      id: "song-info",
      title: "Track details",
      icon: "info",
      onPress: () => {},
    },
    {
      id: "sleep-timer",
      title: isSleepTimerActive()
        ? `Sleep Timer (${formatRemainingTime()})`
        : "Sleep Timer",
      icon: "timer",
      onPress: () => setSleepTimerModalVisible(true),
    },
  ];

  return {
    sleepTimerModalVisible,
    setSleepTimerModalVisible,
    menuItems,
  };
}
