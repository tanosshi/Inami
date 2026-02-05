import React, { useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { useThemeValues, useDynamicStyles } from "../../hooks/useDynamicStyles";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";

interface AlphabetScrollbarProps {
  sortBy: "title" | "created_at" | "artist";
  sortDirection: "asc" | "desc";
  filteredSongs: any[];
  letterIndexMap: Map<string, number>;
  maxScroll: number;
  scrollY: Animated.Value;
  flatListRef: React.RefObject<any>;
  dragging: boolean;
  setDragging: (dragging: boolean) => void;
  activeLetter: string | null;
  setActiveLetter: (letter: string | null) => void;
}

const ALPHABET_LETTERS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];

const PILL_HEIGHT = 100;
const PILL_WIDTH = 4;
const TOUCH_WIDTH = 48;

export default function AlphabetScrollbar({
  sortBy,
  sortDirection,
  filteredSongs,
  letterIndexMap,
  maxScroll,
  scrollY,
  flatListRef,
  dragging,
  setDragging,
  activeLetter,
  setActiveLetter,
}: AlphabetScrollbarProps) {
  const themeValues = useThemeValues();
  const scrollbarRef = useRef<View>(null);
  const scrollbarLayout = useRef({ top: 0, height: 0 });
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const pillScaleAnim = useRef(new Animated.Value(0)).current;
  const [localTrackHeight, setLocalTrackHeight] = React.useState(0);

  const sortByRef = useRef(sortBy);
  const sortDirectionRef = useRef(sortDirection);
  const filteredSongsRef = useRef(filteredSongs);
  const letterIndexMapRef = useRef(letterIndexMap);
  const maxScrollRef = useRef(maxScroll);
  const setDraggingRef = useRef(setDragging);
  const setActiveLetterRef = useRef(setActiveLetter);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);
  useEffect(() => {
    sortDirectionRef.current = sortDirection;
  }, [sortDirection]);
  useEffect(() => {
    filteredSongsRef.current = filteredSongs;
  }, [filteredSongs]);
  useEffect(() => {
    letterIndexMapRef.current = letterIndexMap;
  }, [letterIndexMap]);
  useEffect(() => {
    maxScrollRef.current = maxScroll;
  }, [maxScroll]);
  useEffect(() => {
    setDraggingRef.current = setDragging;
  }, [setDragging]);
  useEffect(() => {
    setActiveLetterRef.current = setActiveLetter;
  }, [setActiveLetter]);

  const styles = useDynamicStyles(() => ({
    scrollbarContainer: {
      position: "absolute" as const,
      right: 0,
      top: 200,
      bottom: 120,
      width: TOUCH_WIDTH,
      justifyContent: "center" as const,
      alignItems: "flex-end" as const,
      paddingRight: SPACING.sm,
    },
    scrollbarTrack: {
      flex: 1,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      width: TOUCH_WIDTH,
    },
    scrollbarPill: {
      width: PILL_WIDTH,
      height: PILL_HEIGHT,
      borderRadius: 99,
      backgroundColor: COLORS.onSurfaceVariant,
      opacity: 0.35,
    },
    letterOverlay: {
      position: "absolute" as const,
      left: SPACING.lg,
      bottom: 20,
      opacity: 0.7,
      minWidth: 56,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: 14,
      backgroundColor: themeValues.COLORS.surfaceContainerHigh,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    letterOverlayText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineLarge,
      color: themeValues.COLORS.onSurface,
    },
  }));

  const getVisibleAlphabet = useCallback(() => {
    return sortDirectionRef.current === "asc"
      ? ["#", ...ALPHABET_LETTERS]
      : [...ALPHABET_LETTERS].reverse().concat(["#"]);
  }, []);

  const formatDateLabel = useCallback((v?: string | number | null) => {
    if (!v) return "";
    const d = new Date(v);
    try {
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return d.toDateString();
    }
  }, []);

  const pageYToRatio = useCallback((pageY: number): number => {
    const { top, height } = scrollbarLayout.current;
    if (!height) return 0;
    return Math.max(0, Math.min(1, (pageY - top) / height));
  }, []);

  const scrollToRatio = useCallback(
    (ratio: number) => {
      const offset = ratio * maxScrollRef.current;
      scrollY.setValue(offset);
      flatListRef.current?.scrollToOffset({ offset, animated: false });
    },
    [scrollY, flatListRef]
  );

  const updateLetterForRatio = useCallback(
    (ratio: number) => {
      const songs = filteredSongsRef.current;
      if (songs.length === 0) return;

      if (sortByRef.current === "created_at") {
        const idx = Math.round(ratio * (songs.length - 1));
        const clamped = Math.max(0, Math.min(songs.length - 1, idx));
        setActiveLetterRef.current(formatDateLabel(songs[clamped]?.created_at));
      } else {
        const alpha = getVisibleAlphabet();
        const letterIdx = Math.min(
          alpha.length - 1,
          Math.floor(ratio * alpha.length)
        );
        setActiveLetterRef.current(alpha[letterIdx]);
      }
    },
    [formatDateLabel, getVisibleAlphabet]
  );

  const pillTranslateY = useMemo(() => {
    const range = Math.max(0, localTrackHeight - PILL_HEIGHT);
    const half = range / 2;
    return scrollY.interpolate({
      inputRange: [0, Math.max(1, maxScroll)],
      outputRange: [-half, half],
      extrapolate: "clamp",
    });
  }, [scrollY, maxScroll, localTrackHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (
        _e: GestureResponderEvent,
        gs: PanResponderGestureState
      ) => Math.abs(gs.dy) > 2,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (e: GestureResponderEvent) => {
        setDraggingRef.current(true);
        const ratio = pageYToRatio(e.nativeEvent.pageY);
        scrollToRatio(ratio);
        updateLetterForRatio(ratio);

        Animated.parallel([
          Animated.timing(overlayAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(pillScaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      },

      onPanResponderMove: (e: GestureResponderEvent) => {
        const ratio = pageYToRatio(e.nativeEvent.pageY);
        scrollToRatio(ratio);
        updateLetterForRatio(ratio);
      },

      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.timing(overlayAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(pillScaleAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDraggingRef.current(false);
          setActiveLetterRef.current(null);
        });
      },

      onPanResponderTerminate: () => {
        Animated.parallel([
          Animated.timing(overlayAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(pillScaleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setDraggingRef.current(false);
          setActiveLetterRef.current(null);
        });
      },
    })
  ).current;

  const measureScrollbar = useCallback(() => {
    scrollbarRef.current?.measureInWindow(
      (_x: number, y: number, _w: number, h: number) => {
        if (h > 0) {
          scrollbarLayout.current = { top: y, height: h };
          setLocalTrackHeight(h);
        }
      }
    );
  }, []);

  const animatedPillScaleX = pillScaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.5],
  });

  const animatedPillOpacity = pillScaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <>
      <View
        ref={scrollbarRef}
        style={styles.scrollbarContainer}
        onLayout={measureScrollbar}
      >
        <View style={styles.scrollbarTrack} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.scrollbarPill,
              {
                opacity: animatedPillOpacity,
                transform: [
                  { translateY: pillTranslateY },
                  { scaleX: animatedPillScaleX },
                ],
              },
            ]}
          />
        </View>
      </View>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.letterOverlay,
          {
            opacity: overlayAnim,
            transform: [
              {
                scale: overlayAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.letterOverlayText}>{activeLetter ?? ""}</Text>
      </Animated.View>
    </>
  );
}
