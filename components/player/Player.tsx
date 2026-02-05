import React, { useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  useWindowDimensions,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlayerStore } from "../../store/playerStore";
import { COLORS, SPACING } from "../../constants/theme";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";
import { pickBackgroundColor } from "../../utils/colorUtils";

import SwipeIndicator from "./classic/swipe-indicator";
import PlayerHeader from "./classic/player-header";
import Artwork from "./classic/artwork";
import SongInfo from "./classic/song-info";
import ProgressBar from "./classic/progress-bar";
import PlayerControls from "./classic/player-controls";
import BottomActions from "./classic/bottom-actions";

import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";

import Top from "./lyrical/top";
import Lyrics from "./lyrical/lyrics";
import ProgressBarNew from "./lyrical/progress-bar";
import Controls from "./lyrical/controls";
import Comments from "./lyrical/comments";

interface ProgressWrapperProps {
  children: React.ReactElement<any>;
}

const ProgressWrapper = React.memo<ProgressWrapperProps>(({ children }) => {
  const position = usePlayerStore((state) => state.position);
  const duration = usePlayerStore((state) => state.duration);
  const seekTo = usePlayerStore((state) => state.seekTo);

  return React.cloneElement(children, {
    position,
    duration,
    onSeek: seekTo,
  });
});

ProgressWrapper.displayName = "ProgressWrapper";

function PlayerContent() {
  const { width, height } = useWindowDimensions();
  const artworkSize = Math.min(width - 80, 320);

  const translateY = useRef(new Animated.Value(height)).current;

  const commentsTranslateY = useRef(new Animated.Value(height)).current;

  const [isHiding, setIsHiding] = useState(false);

  const {
    currentSong,
    isPlaying,
    shuffle,
    repeat,
    togglePlayPause,
    playNext,
    playPrevious,
    toggleShuffle,
    toggleRepeat,
    showPlayer,
    hidePlayerOverlay,
    hidingAnimated,
    resetHidingAnimated,
    showComments,
    setShowComments,
    hidingCommentsAnimated,
    resetHidingCommentsAnimated,
  } = usePlayerStore();

  const backgroundColor = pickBackgroundColor(currentSong?.palette);

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
      onStartShouldSetPanResponder: () => {
        return false;
      },
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          Math.abs(gestureState.dy) > 10 &&
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx)
        );
      },
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        } else if (gestureState.dy < 0) {
          commentsTranslateY.setValue(height + gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        if (showComments) {
          if (gestureState.dy > 100 || gestureState.vy > 0.5) {
            setShowComments(false);
            Animated.parallel([
              Animated.spring(commentsTranslateY, {
                toValue: height,
                damping: 28,
                stiffness: 220,
                mass: 0.9,
                useNativeDriver: true,
              }),
            ]).start();
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
        } else {
          if (gestureState.dy > 100 || gestureState.vy > 0.5) {
            hidePlayer();
          } else if (gestureState.dy < -50 || gestureState.vy < -0.3) {
            setShowComments(true);
            Animated.parallel([
              Animated.spring(commentsTranslateY, {
                toValue: 0,
                damping: 28,
                stiffness: 220,
                mass: 0.9,
                useNativeDriver: true,
              }),
            ]).start();
          } else {
            Animated.parallel([
              Animated.spring(translateY, {
                toValue: 0,
                damping: 28,
                stiffness: 220,
                mass: 0.9,
                useNativeDriver: true,
              }),
              Animated.spring(commentsTranslateY, {
                toValue: height,
                damping: 28,
                stiffness: 220,
                mass: 0.9,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      },
    })
  ).current;

  const commentsPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderGrant: () => {
        translateY.extractOffset();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          commentsTranslateY.setValue(height + gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        if (gestureState.dy > 50 || gestureState.vy > 0.3) {
          setShowComments(false);
          Animated.timing(commentsTranslateY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.parallel([
            Animated.spring(commentsTranslateY, {
              toValue: 0,
              damping: 40,
              stiffness: 100,
              mass: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const hidePlayer = () => {
    setIsHiding(true);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsHiding(false);
      hidePlayerOverlay();
    });
  };

  React.useEffect(() => {
    if (!showPlayer || !currentSong) return;
    const anim = Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        damping: 28,
        stiffness: 220,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [showPlayer, currentSong, translateY]);

  React.useEffect(() => {
    if (!hidingAnimated) return;
    setIsHiding(true);
    const anim = Animated.timing(translateY, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) {
        setIsHiding(false);
        hidePlayerOverlay();
        resetHidingAnimated();
      }
    });
    return () => anim.stop();
  }, [
    hidingAnimated,
    height,
    translateY,
    hidePlayerOverlay,
    resetHidingAnimated,
  ]);

  React.useEffect(() => {
    if (!hidingCommentsAnimated) return;
    const anim = Animated.timing(commentsTranslateY, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) {
        setShowComments(false);
        resetHidingCommentsAnimated();
      }
    });
    return () => anim.stop();
  }, [
    hidingCommentsAnimated,
    height,
    commentsTranslateY,
    setShowComments,
    resetHidingCommentsAnimated,
  ]);

  if ((!showPlayer && !isHiding) || !currentSong) {
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
          {...(showComments ? {} : panResponder.panHandlers)}
        >
          {/* Classic Player Style */}
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

              <ProgressWrapper>
                <ProgressBar position={0} duration={0} onSeek={() => {}} />
              </ProgressWrapper>

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
          style={[
            styles.container,
            { backgroundColor: "#000", transform: [{ translateY }] },
          ]}
          {...(showComments ? {} : panResponder.panHandlers)}
        >
          {/* Lyrical Player Style */}
          <SafeAreaView style={styles.safeArea}>
            <View style={{ flex: 1, flexDirection: "column" }}>
              <Top currentSong={currentSong} />

              <View
                style={{
                  flex: 1,
                  marginTop: 7,
                  borderTopLeftRadius: 44,
                  borderTopRightRadius: 44,
                  overflow: "hidden",
                  backgroundColor: backgroundColor,
                  flexDirection: "column",
                }}
              >
                <Lyrics backgroundColor={backgroundColor} />

                <View
                  style={{
                    paddingHorizontal: 24,
                    paddingBottom: 30,
                    paddingTop: 24,
                    marginTop: "auto",
                    marginBottom: 20,
                  }}
                >
                  <ProgressWrapper>
                    <ProgressBarNew
                      position={0}
                      duration={0}
                      onSeek={() => {}}
                    />
                  </ProgressWrapper>

                  <Controls
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                    playPrevious={playPrevious}
                    playNext={playNext}
                  />
                </View>
              </View>
            </View>

            <Animated.View
              style={{
                position: "absolute",
                top: 141,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: COLORS.background,
                borderTopLeftRadius: 44,
                borderTopRightRadius: 44,
                overflow: "hidden",
                transform: [{ translateY: commentsTranslateY }],
              }}
              {...(showComments ? commentsPanResponder.panHandlers : {})}
            >
              <Comments
                songId={currentSong?.id}
                artistName={currentSong?.artist}
                onClose={() => {
                  Animated.timing(commentsTranslateY, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true,
                  }).start(() => setShowComments(false));
                }}
              />

              <View
                style={{
                  paddingHorizontal: 24,
                  paddingBottom: 30,
                  paddingTop: 24,
                  marginTop: "auto",
                  marginBottom: 20,
                }}
              >
                <ProgressWrapper>
                  <ProgressBarNew position={0} duration={0} onSeek={() => {}} />
                </ProgressWrapper>

                <Controls
                  isPlaying={isPlaying}
                  togglePlayPause={togglePlayPause}
                  playPrevious={playPrevious}
                  playNext={playNext}
                />
              </View>
            </Animated.View>
          </SafeAreaView>
        </Animated.View>
      )}
    </>
  );
}

export default function PlayerOverlay() {
  return <PlayerContent />;
}
