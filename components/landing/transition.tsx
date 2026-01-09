import React, { useRef, useState, useEffect, useCallback } from "react";
import { Dimensions, Animated, Easing, View, Platform } from "react-native";
import { COLORS } from "../../constants/theme";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";
import FirstLandingPage from "./permissions";
import SecondLandingPage from "./pickFeatures";
import ThirdLandingPage from "./nowForYou";

type TransitionProps = {
  onTransitionComplete?: () => void;
  initialPage?: number;
};

const getPageFromHash = (hash: string): number | null => {
  if (!hash || hash === "#") return null;
  const hashMap: { [key: string]: number } = {
    permissions: 0,
    pickfeatures: 1,
    nowforyou: 2,
  };
  const hashName = hash.replace("#", "").toLowerCase().trim();
  const page = hashMap[hashName];
  return page ?? null;
};

const TOTAL_PAGES = 3;

export default function LandingTransition(props: TransitionProps) {
  const { onTransitionComplete, initialPage = 0 } = props;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isAnimating, setIsAnimating] = useState(false);
  const screenWidth = Dimensions.get("window").width;

  const slidePosition = useRef(
    new Animated.Value(initialPage * -screenWidth)
  ).current;

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      overflow: "hidden" as const,
    },
    slideContainer: {
      flexDirection: "row" as const,
      width: screenWidth * TOTAL_PAGES,
      height: "100%" as const,
    },
    pageWrapper: {
      width: screenWidth,
      height: "100%" as const,
    },
  }));

  useEffect(() => {
    if (!isAnimating) {
      slidePosition.setValue(currentPage * -screenWidth);
    }
  }, [screenWidth, currentPage, isAnimating, slidePosition]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleHashChange = () => {
        const hash = window.location.hash;
        const newPage = getPageFromHash(hash);
        if (newPage !== null && newPage !== currentPage && !isAnimating) {
          animateToPage(newPage);
        }
      };

      window.addEventListener("hashchange", handleHashChange);
      return () => {
        window.removeEventListener("hashchange", handleHashChange);
      };
    }
  }, [currentPage, isAnimating]);

  const animateToPage = useCallback(
    (targetPage: number) => {
      if (isAnimating || targetPage === currentPage) return;
      if (targetPage < 0 || targetPage >= TOTAL_PAGES) return;

      setIsAnimating(true);

      Animated.timing(slidePosition, {
        toValue: targetPage * -screenWidth,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start(({ finished }) => {
        if (finished) {
          setCurrentPage(targetPage);
          setIsAnimating(false);
          if (targetPage === TOTAL_PAGES - 1) {
            onTransitionComplete?.();
          }
        }
      });
    },
    [currentPage, isAnimating, screenWidth, slidePosition, onTransitionComplete]
  );

  const goToNext = useCallback(() => {
    const nextPage = currentPage + 1;
    if (nextPage < TOTAL_PAGES) {
      animateToPage(nextPage);
    } else {
      onTransitionComplete?.();
    }
  }, [currentPage, animateToPage, onTransitionComplete]);

  const renderPages = () => {
    return (
      <Animated.View
        style={[
          styles.slideContainer,
          {
            transform: [{ translateX: slidePosition }],
          },
        ]}
      >
        <View style={styles.pageWrapper}>
          <FirstLandingPage onSkip={goToNext} />
        </View>
        <View style={styles.pageWrapper}>
          <SecondLandingPage onSkip={goToNext} />
        </View>
        <View style={styles.pageWrapper}>
          <ThirdLandingPage onLikeThis={goToNext} />
        </View>
      </Animated.View>
    );
  };

  return <View style={styles.container}>{renderPages()}</View>;
}
