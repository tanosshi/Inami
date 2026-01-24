import React, { useRef } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayerStore } from "../../store/playerStore";
import { COLORS, SPACING } from "../../constants/theme";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";

import SwipeIndicator from "./classic/swipe-indicator";
import PlayerHeader from "./classic/player-header";
import Artwork from "./classic/artwork";
import SongInfo from "./classic/song-info";
import ProgressBar from "./classic/progress-bar";
import PlayerControls from "./classic/player-controls";
import BottomActions from "./classic/bottom-actions";
import EmptyState from "./classic/empty-state";

import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

function PlayerContent() {
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
    topInfoWrap: {
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.lg,
    },
    ctopInfoWrap: {
      paddingTop: SPACING.lg,
    },
    topRow: {
      height: height * 0.2,
      minHeight: 120,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    albumCover: {
      borderRadius: 8,
      overflow: "hidden" as const,
    },
    songTitle: {
      fontSize: 16,
      fontWeight: "600" as const,
      color: COLORS.onSurface,
    },
    songArtist: {
      fontSize: 14,
      color: COLORS.onSurfaceVariant,
      marginTop: 4,
    },
    roundedPanel: {
      height: height * 0.8,
      backgroundColor: "#fff",
      borderTopLeftRadius: 43,
      borderTopRightRadius: 43,
      padding: SPACING.lg,
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
              damping: 28,
              stiffness: 220,
              mass: 0.9,
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
          damping: 28,
          stiffness: 220,
          mass: 0.9,
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

  const styleOld = false;

  return (
    <>
      {styleOld ? (
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
              <SwipeIndicator />

              <PlayerHeader onBackPressed={hidePlayer} />

              <Artwork song={currentSong} artworkSize={artworkSize} />

              <SongInfo song={currentSong} />

              <BottomActions song={currentSong} />

              <ProgressBar
                position={position}
                duration={duration}
                onSeek={seekTo}
              />

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

              <View
                style={{
                  alignItems: "center",
                  paddingHorizontal: SPACING.xl,
                  position: "relative",
                }}
              >
                <View style={{ position: "relative", alignItems: "center" }}>
                  <MaterialIcons
                    name="keyboard-arrow-up"
                    size={16}
                    color={COLORS.onSurface}
                  />

                  <Text
                    style={{
                      position: "absolute",
                      top: 1,
                      left: "00%",
                      transform: [{ translateX: "-50%" }],
                      fontSize: 12,
                      color: COLORS.onSurfaceVariant,
                      textAlign: "center",
                      opacity: 0.1,
                    }}
                  >
                    boom boom ya ya
                  </Text>
                </View>

                <View style={{ position: "relative", alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: COLORS.onSurface,
                    }}
                  >
                    Lyrics
                  </Text>
                  <Text
                    style={{
                      position: "absolute",
                      top: 0,
                      left: "5%",
                      transform: [{ translateX: "-50%" }],
                      fontSize: 16,
                      color: COLORS.onSurfaceVariant,
                      textAlign: "center",
                      opacity: 0.2,
                    }}
                  >
                    Lryics lyrics lyrics hey hey
                  </Text>
                </View>
              </View>
            </Animated.ScrollView>
          </SafeAreaView>
        </Animated.View>
      ) : (
        <Animated.View
          style={[styles.container, {}]}
          {...panResponder.panHandlers}
        >
          <SafeAreaView style={styles.safeArea}>
            <View
              style={[styles.scrollContent, { height, overflow: "hidden" }]}
            >
              <View style={styles.ctopInfoWrap}>
                <View style={styles.topRow}>
                  <View style={styles.albumCover}>
                    <Artwork
                      song={currentSong}
                      artworkSize={Math.min(artworkSize * 0.27, 120)}
                    />
                  </View>

                  <View style={{ marginLeft: -SPACING.md, flexShrink: 1 }}>
                    <Text style={styles.songTitle}>
                      {currentSong?.title || "Unknown"}
                    </Text>
                    <Text style={styles.songArtist}>
                      {currentSong?.artist || ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.roundedPanel}>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      top: -60,
                      marginTop: 20,
                      padding: SPACING.lg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 50,
                        fontWeight: "900",
                        color: COLORS.surface,
                        textAlign: "left",
                        width: "90%",
                        includeFontPadding: false,
                      }}
                      adjustsFontSizeToFit
                    >
                      Lyrical text text demo lyrics
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      marginTop: -260,
                      paddingTop: SPACING.xxl,
                      padding: SPACING.lg,
                    }}
                  >
                    <ProgressBar
                      position={position}
                      duration={duration}
                      onSeek={seekTo}
                    />
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: SPACING.md,
                      }}
                    >
                      <TouchableOpacity
                        onPress={playPrevious}
                        style={{ padding: SPACING.sm }}
                      >
                        <MaterialIcons
                          name="skip-previous"
                          size={36}
                          color={COLORS.onSurface}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={togglePlayPause}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: COLORS.primary,
                          justifyContent: "center",
                          alignItems: "center",
                          marginHorizontal: SPACING.md,
                        }}
                      >
                        <MaterialIcons
                          name={isPlaying ? "pause" : "play-arrow"}
                          size={36}
                          color={COLORS.onSurface}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={playNext}
                        style={{ padding: SPACING.sm }}
                      >
                        <MaterialIcons
                          name="skip-next"
                          size={36}
                          color={COLORS.onSurface}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </>
  );
}

export default function PlayerOverlay() {
  return <PlayerContent />;
}
