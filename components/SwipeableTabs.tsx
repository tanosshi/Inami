import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Dimensions,
  Animated,
  PanResponder,
  StyleSheet,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.2;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

interface SwipeableTabsProps {
  children: React.ReactNode[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onDragProgress?: (progress: number) => void;
  enabled?: boolean;
}

export interface SwipeableTabsRef {
  goToIndex: (index: number, animated?: boolean) => void;
}

const SwipeableTabs = forwardRef<SwipeableTabsRef, SwipeableTabsProps>(
  (
    { children, currentIndex, onIndexChange, onDragProgress, enabled = true },
    ref
  ) => {
    const totalPages = children.length;
    const translateX = useRef(
      new Animated.Value(-currentIndex * SCREEN_WIDTH)
    ).current;
    const [isDragging, setIsDragging] = useState(false);
    const dragOffset = useRef(0);
    const currentIndexRef = useRef(currentIndex);
    const enabledRef = useRef(enabled);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const opacityAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    useEffect(() => {
      enabledRef.current = enabled;
    }, [enabled]);

    useEffect(() => {
      if (!isDragging) {
        Animated.spring(translateX, {
          toValue: -currentIndex * SCREEN_WIDTH,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
          mass: 0.8,
        }).start();
      }
    }, [currentIndex, isDragging, translateX]);

    const goToIndex = useCallback(
      (index: number, animated = true) => {
        const clampedIndex = Math.max(0, Math.min(totalPages - 1, index));
        if (animated) {
          Animated.spring(translateX, {
            toValue: -clampedIndex * SCREEN_WIDTH,
            useNativeDriver: true,
            damping: 20,
            stiffness: 200,
            mass: 0.8,
          }).start();
        } else {
          translateX.setValue(-clampedIndex * SCREEN_WIDTH);
        }
        onIndexChange(clampedIndex);
      },
      [onIndexChange, totalPages, translateX]
    );

    useImperativeHandle(ref, () => ({
      goToIndex,
    }));

    const panResponder = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isHorizontalSwipe =
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5;
          const hasMovedEnough = Math.abs(gestureState.dx) > 10;
          return enabledRef.current && isHorizontalSwipe && hasMovedEnough;
        },
        onPanResponderGrant: () => {
          setIsDragging(true);
          dragOffset.current = -currentIndexRef.current * SCREEN_WIDTH;

          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 0.98,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.95,
              duration: 100,
              useNativeDriver: true,
            }),
          ]).start();
        },
        onPanResponderMove: (_, gestureState) => {
          const newPosition = dragOffset.current + gestureState.dx;

          const minPosition = -(totalPages - 1) * SCREEN_WIDTH;
          const maxPosition = 0;

          let resistedPosition = newPosition;
          if (newPosition > maxPosition) {
            resistedPosition = maxPosition + (newPosition - maxPosition) * 0.3;
          } else if (newPosition < minPosition) {
            resistedPosition = minPosition + (newPosition - minPosition) * 0.3;
          }

          translateX.setValue(resistedPosition);

          const progress = Math.max(
            -1,
            Math.min(1, gestureState.dx / SWIPE_THRESHOLD)
          );
          onDragProgress?.(progress);
        },
        onPanResponderRelease: (_, gestureState) => {
          setIsDragging(false);
          onDragProgress?.(0);

          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              damping: 15,
              stiffness: 200,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();

          const { dx, vx } = gestureState;
          let newIndex = currentIndexRef.current;

          const shouldSwipeLeft =
            dx < -SWIPE_THRESHOLD || (vx < -SWIPE_VELOCITY_THRESHOLD && dx < 0);
          const shouldSwipeRight =
            dx > SWIPE_THRESHOLD || (vx > SWIPE_VELOCITY_THRESHOLD && dx > 0);

          if (shouldSwipeLeft && newIndex < totalPages - 1) {
            newIndex = currentIndexRef.current + 1;
          } else if (shouldSwipeRight && newIndex > 0) {
            newIndex = currentIndexRef.current - 1;
          }

          goToIndex(newIndex);
        },
        onPanResponderTerminate: () => {
          setIsDragging(false);
          onDragProgress?.(0);

          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
              damping: 15,
              stiffness: 200,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();

          goToIndex(currentIndexRef.current);
        },
      })
    ).current;
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.pagesContainer,
            {
              width: SCREEN_WIDTH * totalPages,
              transform: [{ translateX }, { scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
          {...panResponder.panHandlers}
        >
          {React.Children.map(children, (child, index) => (
            <View key={index} style={[styles.page, { width: SCREEN_WIDTH }]}>
              {child}
            </View>
          ))}
        </Animated.View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
  pagesContainer: {
    flex: 1,
    flexDirection: "row",
  },
  page: {
    flex: 1,
    height: "100%",
  },
});

SwipeableTabs.displayName = "SwipeableTabs";

export default SwipeableTabs;
