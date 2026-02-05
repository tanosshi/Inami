import React from "react";
import { usePlayerStore } from "../store/playerStore";

const mockSong = {
  id: "demo-song",
  title: "Demo Song Title",
  artist: "Demo Artist",
  album: "Demo Album",
  duration: 200,
  artwork: undefined,
  uri: "",
  is_liked: false,
  play_count: 0,
};

export default function DemoPlayer() {
  const setState = usePlayerStore.setState;

  React.useEffect(() => {
    setState({
      currentSong: mockSong,
      isPlaying: true,
      position: 30,
      duration: 200,
      showPlayer: true,
      shuffle: false,
      repeat: "off" as const,
    });

    return () => {
      setState({
        showPlayer: true,
        currentSong: null,
      });
    };
  }, [setState]);

  return null;
}
