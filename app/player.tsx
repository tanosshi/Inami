import React, { useRef } from "react";
import {
  View,
  useWindowDimensions,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
// @ts-ignore
import { useRouter } from "expo-router";
import { usePlayerStore } from "../store/playerStore";
import { useSongStore } from "../store/songStore";
import { COLORS, SPACING } from "../constants/theme";
import { useDynamicStyles } from "../hooks/useDynamicStyles";
import SwipeIndicator from "../components/player/swipe-indicator";
import PlayerHeader from "../components/player/player-header";
import Artwork from "../components/player/artwork";
import SongInfo from "../components/player/song-info";
import ProgressBar from "../components/player/progress-bar";
import PlayerControls from "../components/player/player-controls";
import BottomActions from "../components/player/bottom-actions";
import EmptyState from "../components/player/empty-state";

export default function PlayerScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const artworkSize = Math.min(width - 80, 320);

  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          gestureState.dy > 10 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const newOpacity = Math.max(0, 1 - gestureState.dy / (height * 0.4));
          opacity.setValue(newOpacity);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          Animated.parallel([
            Animated.timing(translateY, {
              toValue: height,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            router.back();
          });
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 20,
              stiffness: 300,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const {
    currentSong,
    isPlaying,
    position,
    duration,
    shuffle,
    repeat,
    togglePlayPause,
    seekTo,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
  } = usePlayerStore();
  const { toggleLike, fetchSongs } = useSongStore();

  const handleLike = async () => {
    if (currentSong) {
      await toggleLike(currentSong.id);
      await fetchSongs();
    }
  };

  const handleGoBack = () => {
    try {
      if (
        typeof (router as any).canGoBack === "function" &&
        (router as any).canGoBack()
      ) {
        router.back();
      } else {
        router.push("/");
      }
    } catch {
      router.push("/");
    }
  };

  if (!currentSong) {
    return <EmptyState onGoBack={handleGoBack} />;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <SafeAreaView style={styles.safeArea}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Swipe indicator */}
          <SwipeIndicator />

          {/* Header */}
          <PlayerHeader onBackPressed={() => router.back()} />

          {/* Artwork */}
          <Artwork song={currentSong} artworkSize={artworkSize} />

          {/* Song Info */}
          <SongInfo song={currentSong} />

          {/* Bottom Actions (well its up now) */}
          <BottomActions song={currentSong} onLike={handleLike} />

          {/* Progress Bar */}
          <ProgressBar
            position={position}
            duration={duration}
            onSeek={seekTo}
          />

          {/* Controls */}
          <PlayerControls
            isPlaying={isPlaying}
            shuffle={shuffle}
            repeat={repeat}
            onPlayPause={togglePlayPause}
            onPrevious={playPrevious}
            onNext={playNext}
            onToggleShuffle={toggleShuffle}
            onToggleRepeat={toggleRepeat}
          />
        </Animated.ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
}
