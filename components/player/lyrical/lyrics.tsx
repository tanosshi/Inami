import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  useWindowDimensions,
  FlatList,
  type ListRenderItemInfo,
  StyleSheet,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { usePlayerStore } from "../../../store/playerStore";
import {
  parseLyrics,
  type LyricLine as LyricLineType,
  type ParsedLyrics,
} from "../../../utils/lyricsParser";
import { getFontFamily } from "../../../constants/theme";

type ScrollToIndexFailedInfo = {
  index: number;
  highestMeasuredFrameIndex: number;
  averageItemLength: number;
};

interface LyricLineProps {
  line: LyricLineType;
  index: number;
  focusIndex: number;
  maxDistance: number;
  width: number;
  fadeEnabled: boolean;
  onPress?: () => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const DEBUG_LYRICS = false;

const staticStyles = StyleSheet.create({
  pressableBase: {
    width: "100%" as const,
    paddingHorizontal: 28,
  },
  textBase: {
    letterSpacing: -0.8,
    textAlign: "left" as const,
  },
  shadowText: {
    position: "absolute" as const,
    left: 1,
    right: 0,
    top: 1,
    color: "rgba(0,0,0,0.12)",
  },
  mainText: {
    color: "rgba(0,0,0,0.92)",
  },
});

const LyricLineComponent = React.memo(
  ({
    line,
    index,
    focusIndex,
    maxDistance,
    width,
    fadeEnabled,
    onPress,
  }: LyricLineProps) => {
    const distance = Math.abs(index - focusIndex);
    const isActive = distance === 0;
    const wasActiveRef = useRef(false);

    const activeSize = clamp(Math.round(width * 0.12), 40, 74);
    const secondarySize = clamp(Math.round(width * 0.072), 22, 44);
    const baseSize = clamp(Math.round(width * 0.052), 16, 32);

    const targetFontSize = isActive
      ? activeSize
      : distance === 1
      ? secondarySize
      : baseSize;

    const t = clamp(distance / Math.max(1, maxDistance), 0, 1);
    const targetOpacity = fadeEnabled
      ? isActive
        ? 0.98
        : distance === 1
        ? 0.66
        : clamp(0.06 + Math.pow(1 - t, 1.7) * 0.22, 0.06, 0.38)
      : isActive
      ? 0.98
      : distance === 1
      ? 0.66
      : clamp(0.18 + Math.pow(1 - t, 1.5) * 0.24, 0.18, 0.48);

    const targetScale = isActive ? 1 : 1 - clamp(distance * 0.05, 0, 0.18);

    const animProgress = useRef(new Animated.Value(isActive ? 1 : 0)).current;

    useEffect(() => {
      const justBecameActive = isActive && !wasActiveRef.current;
      const justBecameInactive = !isActive && wasActiveRef.current;
      wasActiveRef.current = isActive;

      if (justBecameActive) {
        animProgress.setValue(0);
        Animated.timing(animProgress, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }).start();
      } else if (justBecameInactive) {
        Animated.timing(animProgress, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }).start();
      }
    }, [isActive, animProgress]);

    const lineHeight = Math.round(targetFontSize * 1.08);
    const maxWidth = width * 0.85;
    const fontWeight = isActive ? "700" : "600";

    const animatedScale =
      distance <= 1
        ? animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [targetScale, 1],
          })
        : targetScale;

    const animatedOpacity =
      distance <= 1
        ? animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: [targetOpacity * 0.7, targetOpacity],
          })
        : targetOpacity;

    return (
      <Pressable onPress={onPress} style={staticStyles.pressableBase}>
        <Animated.View
          style={{
            paddingVertical: isActive ? 10 : 6,
            transform: [{ scale: animatedScale as unknown as number }],
          }}
        >
          <View style={{ position: "relative", maxWidth }}>
            <Text
              style={[
                staticStyles.textBase,
                staticStyles.shadowText,
                {
                  fontFamily: getFontFamily("700"),
                  fontSize: targetFontSize,
                  lineHeight,
                  opacity: targetOpacity * 0.55,
                },
              ]}
            >
              {line.text}
            </Text>
            <Animated.Text
              style={[
                staticStyles.textBase,
                staticStyles.mainText,
                {
                  fontFamily: getFontFamily(fontWeight as "600" | "700"),
                  fontSize: targetFontSize,
                  lineHeight,
                  opacity: animatedOpacity as unknown as number,
                },
              ]}
            >
              {line.text}
            </Animated.Text>
          </View>
        </Animated.View>
      </Pressable>
    );
  },
  (prevProps, nextProps) => {
    const prevDistance = Math.abs(prevProps.index - prevProps.focusIndex);
    const nextDistance = Math.abs(nextProps.index - nextProps.focusIndex);

    if (
      prevProps.line !== nextProps.line ||
      prevProps.width !== nextProps.width ||
      prevProps.fadeEnabled !== nextProps.fadeEnabled
    )
      return false;

    if (prevDistance <= 1 || nextDistance <= 1)
      return prevDistance === nextDistance;

    return Math.floor(prevDistance / 3) === Math.floor(nextDistance / 3);
  }
);

LyricLineComponent.displayName = "LyricLineComponent";

function useFpsDiagnostics(enabled: boolean) {
  const rafId = useRef<number | null>(null);
  const frames = useRef(0);
  const lastLogAt = useRef(Date.now());
  const lastFrameAt = useRef<number | null>(null);
  const maxFrameMs = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const loop = () => {
      frames.current += 1;
      const now = Date.now();
      if (lastFrameAt.current != null) {
        const dt = now - lastFrameAt.current;
        if (dt > maxFrameMs.current) maxFrameMs.current = dt;
      }
      lastFrameAt.current = now;

      const elapsed = now - lastLogAt.current;
      if (elapsed >= 1000) {
        const fps = Math.round((frames.current * 1000) / elapsed);
        console.log(
          `[Lyrics][FPS] ${fps} (max frame ${Math.round(maxFrameMs.current)}ms)`
        );
        frames.current = 0;
        maxFrameMs.current = 0;
        lastLogAt.current = now;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);
    return () => {
      if (rafId.current != null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [enabled]);
}

interface LyricsProps {
  backgroundColor?: string;
}

const convertToRgba = (color: string, opacity: number): string => {
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${opacity})`;
  } else if (color.startsWith("rgb(")) {
    return color.replace("rgb(", "rgba(").replace(")", `,${opacity})`);
  } else if (color.startsWith("rgba(")) {
    return color.replace(/[\d.]+\)$/, `${opacity})`);
  }
  return `rgba(255,255,255,${opacity})`;
};

export default function Lyrics({ backgroundColor = "#FFFFFF" }: LyricsProps) {
  const { width } = useWindowDimensions();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const position = usePlayerStore((s) => s.position);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const seekTo = usePlayerStore((s) => s.seekTo);

  const [parsedLyrics, setParsedLyrics] = useState<ParsedLyrics | null>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [followPlayback, setFollowPlayback] = useState(true);
  const listRef = useRef<FlatList<LyricLineType>>(null);
  const resumeFollowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentIndexRef = useRef(currentIndex);
  const followPlaybackRef = useRef(followPlayback);
  const lastPositionRef = useRef(position);
  const lastPositionWallClockRef = useRef(Date.now());
  const isProgrammaticScrollRef = useRef(false);

  useFpsDiagnostics(DEBUG_LYRICS);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    followPlaybackRef.current = followPlayback;
  }, [followPlayback]);

  useEffect(() => {
    lastPositionRef.current = position;
    lastPositionWallClockRef.current = Date.now();
  }, [position]);

  const getEffectivePosition = useCallback(() => {
    if (!isPlaying) return lastPositionRef.current;
    const dt = Date.now() - lastPositionWallClockRef.current;
    return lastPositionRef.current + Math.max(0, dt);
  }, [isPlaying]);

  const findLyricIndex = useCallback(
    (lines: readonly LyricLineType[], timeMs: number, prevIndex: number) => {
      if (lines.length === 0) return -1;

      if (prevIndex < 0) {
        let lo = 0;
        let hi = lines.length - 1;
        let ans = -1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (lines[mid].time <= timeMs) {
            ans = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }
        return ans;
      }

      let i = Math.min(prevIndex, lines.length - 1);
      while (i + 1 < lines.length && lines[i + 1].time <= timeMs) i++;
      while (i >= 0 && lines[i].time > timeMs) i--;
      return i;
    },
    []
  );

  useEffect(() => {
    if (currentSong?.lyrics) {
      try {
        const parsed = parseLyrics(currentSong.lyrics);
        setParsedLyrics(parsed);
        setCurrentIndex(-1);
      } catch (error) {
        console.error("Error parsing lyrics:", error);
        setParsedLyrics(null);
      }
    } else {
      setParsedLyrics(null);
      setCurrentIndex(-1);
    }
  }, [currentSong?.lyrics]);

  useEffect(() => {
    if (!parsedLyrics || parsedLyrics.lines.length === 0) return;

    let mounted = true;
    const TICK_MS = 120;

    const tick = () => {
      if (!mounted) return;
      const effectivePosition = getEffectivePosition() + 450;
      const prev = currentIndexRef.current;
      const next = findLyricIndex(parsedLyrics.lines, effectivePosition, prev);

      if (next !== prev) {
        currentIndexRef.current = next;

        if (DEBUG_LYRICS) {
          const nextLine = next >= 0 ? parsedLyrics.lines[next] : null;
          const prevLine = prev >= 0 ? parsedLyrics.lines[prev] : null;
          console.log(
            `[Lyrics][Change] ${prev}→${next} pos=${Math.round(
              effectivePosition
            )}ms follow=${followPlaybackRef.current} ` +
              `prev="${prevLine?.text ?? ""}" next="${nextLine?.text ?? ""}"`
          );
        }

        if (followPlaybackRef.current) {
          setCurrentIndex(next);
          if (next >= 0) {
            isProgrammaticScrollRef.current = true;
            setTimeout(() => {
              listRef.current?.scrollToIndex({
                index: next,
                animated: false,
                viewPosition: 0.52,
              });
              requestAnimationFrame(() => {
                isProgrammaticScrollRef.current = false;
              });
            }, 16);

            if (DEBUG_LYRICS) {
              console.log(`[Lyrics][Scroll] scrollToIndex(${next}) with delay`);
            }
          }
        }
      }
    };

    tick();
    const id = setInterval(tick, TICK_MS);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [parsedLyrics, findLyricIndex, getEffectivePosition]);

  useEffect(() => {
    return () => {
      if (resumeFollowTimer.current) {
        clearTimeout(resumeFollowTimer.current);
        resumeFollowTimer.current = null;
      }
    };
  }, []);

  const data = parsedLyrics?.lines ?? [];
  const isEmpty = data.length === 0;
  const focusIndex = currentIndex >= 0 ? currentIndex : 0;
  const maxDistance = 4;

  const focusIndexRef = useRef(focusIndex);
  focusIndexRef.current = focusIndex;

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<LyricLineType>) => (
      <LyricLineComponent
        line={item}
        index={index}
        focusIndex={focusIndexRef.current}
        maxDistance={maxDistance}
        width={width}
        fadeEnabled={followPlayback}
        onPress={() => {
          currentIndexRef.current = index;
          setCurrentIndex(index);
          void seekTo(item.time);
          setFollowPlayback(true);

          if (DEBUG_LYRICS) {
            console.log(
              `[Lyrics][Tap] index=${index} time=${item.time} text="${item.text}" -> seek + followPlayback=true`
            );
          }

          listRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.52,
          });
        }}
      />
    ),
    [followPlayback, seekTo, width]
  );

  const keyExtractor = useCallback(
    (item: LyricLineType, index: number) => `${item.time}-${index}`,
    []
  );

  const contentContainerStyle = useMemo(
    () => ({
      paddingTop: 90,
      paddingBottom: 140,
    }),
    []
  );

  return (
    <View style={{ flex: 1, paddingTop: 24 }}>
      {isEmpty ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <View style={{ position: "relative" }}>
            <Text
              style={{
                fontSize: clamp(Math.round(width * 0.2), 56, 110),
                lineHeight: clamp(Math.round(width * 0.2), 56, 110) * 0.95,
                fontFamily: getFontFamily("700"),
                color: "rgba(0, 0, 0, 0.24)",
                letterSpacing: -2,
              }}
            >
              no
            </Text>
            <Text
              style={{
                marginTop: -35,
                fontSize: clamp(Math.round(width * 0.22), 60, 120),
                lineHeight: clamp(Math.round(width * 0.22), 60, 120) * 1.2,
                fontFamily: getFontFamily("700"),
                color: "rgba(0,0,0,0.92)",
                letterSpacing: -2.2,
              }}
            >
              lyrics
            </Text>
            <Text
              style={{
                marginTop: 10,
                fontSize: 14,
                fontFamily: getFontFamily("500"),
                color: "rgba(0, 0, 0, 0.7)",
              }}
            >
              This track doesn&apos;t have lyrics
            </Text>
          </View>
        </View>
      ) : (
        <View
          style={{
            position: "relative",
            width: "100%",
            flex: 1,
          }}
        >
          <LinearGradient
            colors={[
              convertToRgba(backgroundColor, 1),
              convertToRgba(backgroundColor, 0),
            ]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 50,
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={keyExtractor}
            extraData={focusIndex}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={contentContainerStyle}
            renderItem={renderItem}
            removeClippedSubviews={true}
            initialNumToRender={12}
            maxToRenderPerBatch={5}
            updateCellsBatchingPeriod={50}
            windowSize={5}
            getItemLayout={(_, index) => ({
              length: 60,
              offset: 60 * index,
              index,
            })}
            onScrollToIndexFailed={(info: ScrollToIndexFailedInfo) => {
              const offset = Math.max(0, info.averageItemLength * info.index);
              listRef.current?.scrollToOffset({ offset, animated: false });
              setTimeout(() => {
                listRef.current?.scrollToIndex({
                  index: info.index,
                  animated: false,
                  viewPosition: 0.52,
                });
              }, 150);
            }}
            onScrollBeginDrag={() => {
              if (isProgrammaticScrollRef.current) return;

              setFollowPlayback(false);
              if (DEBUG_LYRICS) {
                console.log(
                  "[Lyrics][Scroll] beginDrag -> followPlayback=false"
                );
              }
              if (resumeFollowTimer.current) {
                clearTimeout(resumeFollowTimer.current);
                resumeFollowTimer.current = null;
              }
            }}
            onScrollEndDrag={() => {
              if (isProgrammaticScrollRef.current) return;

              if (resumeFollowTimer.current) {
                clearTimeout(resumeFollowTimer.current);
              }
              if (DEBUG_LYRICS) {
                console.log(
                  "[Lyrics][Scroll] endDrag -> will resume followPlayback in 2200ms"
                );
              }
              resumeFollowTimer.current = setTimeout(() => {
                setFollowPlayback(true);
                if (DEBUG_LYRICS) {
                  console.log("[Lyrics][Scroll] resume -> followPlayback=true");
                }
                resumeFollowTimer.current = null;
              }, 2200);
            }}
            onMomentumScrollBegin={() => {
              if (isProgrammaticScrollRef.current) return;

              setFollowPlayback(false);
              if (DEBUG_LYRICS) {
                console.log(
                  "[Lyrics][Scroll] momentumBegin -> followPlayback=false"
                );
              }
              if (resumeFollowTimer.current) {
                clearTimeout(resumeFollowTimer.current);
                resumeFollowTimer.current = null;
              }
            }}
            onMomentumScrollEnd={() => {
              if (isProgrammaticScrollRef.current) return;

              if (resumeFollowTimer.current) {
                clearTimeout(resumeFollowTimer.current);
              }
              if (DEBUG_LYRICS) {
                console.log(
                  "[Lyrics][Scroll] momentumEnd -> will resume followPlayback in 2200ms"
                );
              }
              resumeFollowTimer.current = setTimeout(() => {
                setFollowPlayback(true);
                if (DEBUG_LYRICS) {
                  console.log("[Lyrics][Scroll] resume -> followPlayback=true");
                }
                resumeFollowTimer.current = null;
              }, 2200);
            }}
          />
          <LinearGradient
            colors={[
              convertToRgba(backgroundColor, 0),
              convertToRgba(backgroundColor, 1),
            ]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 50,
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        </View>
      )}
    </View>
  );
}
