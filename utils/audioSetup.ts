/* eslint-disable @typescript-eslint/no-require-imports */
import { Platform } from "react-native";
let AudioPro: any;
let AudioProEventType: any;
let AudioProContentType: any;

if (Platform.OS !== "web") {
  try {
    const audioPro = require("react-native-audio-pro");
    AudioPro = audioPro.AudioPro;
    AudioProEventType = audioPro.AudioProEventType;
    AudioProContentType = audioPro.AudioProContentType;
  } catch {}
}

let isSetup = false;

export interface AudioProTrack {
  id: string;
  url: string;
  title: string;
  artwork: string;
  artist?: string;
  album?: string;
}

export function setupAudio() {
  if (Platform.OS === "web" || isSetup || !AudioPro) return;

  try {
    AudioPro.configure({
      contentType: AudioProContentType?.MUSIC || "music",
      debug: __DEV__,
      debugIncludesProgress: false,
      progressIntervalMs: 1000,
      showNextPrevControls: true,
      showSkipControls: false,
    });

    AudioPro.addEventListener((event: any) => {
      let playerStore: any;
      try {
        playerStore = require("../store/playerStore").usePlayerStore.getState();
      } catch (e) {
        console.warn(e);
        return;
      }

      switch (event.type) {
        case AudioProEventType?.TRACK_ENDED:
          playerStore.playNext();
          break;

        case AudioProEventType?.REMOTE_NEXT:
          playerStore.playNext();
          break;

        case AudioProEventType?.REMOTE_PREV:
          playerStore.playPrevious();
          break;

        case AudioProEventType?.STATE_CHANGED:
          const state = event.payload?.state;
          if (state === "PLAYING" || state === "PAUSED") {
            const isPlaying = state === "PLAYING";
            const currentStoreState = playerStore;
            if (currentStoreState.isPlaying !== isPlaying) {
              require("../store/playerStore").usePlayerStore.setState({
                isPlaying,
              });
            }
          }
          break;

        case AudioProEventType?.PROGRESS:
          const position = event.payload?.position || 0;
          const duration = event.payload?.duration || 0;
          require("../store/playerStore").usePlayerStore.setState({
            position,
            duration,
          });
          break;

        case AudioProEventType?.PLAYBACK_ERROR:
          console.error("playback error:", event.payload?.error);
          console.error("audio error:", event.payload?.errorCode);
          playerStore.playNext();
          break;
      }
    });

    isSetup = true;
  } catch (error) {
    console.error("audio:", error);
  }
}

export function getAudioPro() {
  return AudioPro;
}

export function getAudioProEventType() {
  return AudioProEventType;
}

export function getAudioProContentType() {
  return AudioProContentType;
}

export default {
  setupAudio,
  getAudioPro,
  getAudioProEventType,
  getAudioProContentType,
};
