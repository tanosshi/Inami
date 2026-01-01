import React, { useRef } from "react";
import {
  View,
  useWindowDimensions,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayerStore } from "../store/playerStore";
import { COLORS, SPACING } from "../constants/theme";
import { useDynamicStyles } from "../hooks/useDynamicStyles";
import SwipeIndicator from "./player/swipe-indicator";
import PlayerHeader from "./player/player-header";
import Artwork from "./player/artwork";
import SongInfo from "./player/song-info";
import ProgressBar from "./player/progress-bar";
import PlayerControls from "./player/player-controls";
import BottomActions from "./player/bottom-actions";
import EmptyState from "./player/empty-state";

export default function PlayerOverlay() {
  const { width, height } = useWindowDimensions();
  const artworkSize = Math.min(width - 80, 320);

  const translateY = useRef(new Animated.Value(height)).current;

  const styles = useDynamicStyles(() => ({
    container: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: COLORS.background,
      zIndex: 1000,
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
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          hidePlayer();
        } else {
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              damping: 20,
              stiffness: 300,
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
    showPlayer,
    hidePlayerOverlay,
  } = usePlayerStore();

  const hidePlayer = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      hidePlayerOverlay();
    });
  };

  React.useEffect(() => {
    if (showPlayer && currentSong) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showPlayer, currentSong]);

  if (!showPlayer || !currentSong) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
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
          <PlayerHeader onBackPressed={hidePlayer} />

          {/* Artwork */}
          <Artwork song={currentSong} artworkSize={artworkSize} />

          {/* Song Info */}
          <SongInfo song={currentSong} />

          {/* Bottom Actions */}
          <BottomActions song={currentSong} />

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
