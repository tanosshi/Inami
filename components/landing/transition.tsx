import React, { useRef, useState, useEffect } from "react";
import { Dimensions, Animated, Easing, View, Platform } from "react-native";
import { COLORS } from "../../constants/theme";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";
import FirstLandingPage from "./permissions";
import SecondLandingPage from "./nowForYou";
import ThirdLandingPage from "./pickFeatures";

type TransitionProps = {
  onTransitionComplete?: () => void;
  initialPage?: number;
};

const getPageFromHash = (hash: string): number | null => {
  if (!hash || hash === "#") return null;
  const hashMap: { [key: string]: number } = {
    permissions: 0,
    nowforyou: 1,
    pickfeatures: 2,
  };
  const hashName = hash.replace("#", "").toLowerCase().trim();
  const page = hashMap[hashName];
  return page ?? null;
};

export default function LandingTransition(props: TransitionProps) {
  const { onTransitionComplete, initialPage = 0 } = props;
  const [page, setPage] = useState(initialPage);
  const [previousPage, setPreviousPage] = useState<number | null>(null);
  const [removingPage, setRemovingPage] = useState<number | null>(null);
  const [isLayoutReady, setIsLayoutReady] = useState(false);
  const [newPageLayoutReady, setNewPageLayoutReady] = useState(false);
  const [fadeStarted, setFadeStarted] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pageOpacity = useRef(new Animated.Value(1)).current;
  const previousPageOpacity = useRef(new Animated.Value(1)).current;
  const screenWidth = Dimensions.get("window").width;

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      position: "relative" as const,
      backgroundColor: COLORS.background,
    },
    backgroundContainer: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: COLORS.background,
    },
    pageContainer: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: "100%" as const,
      height: "100%" as const,
    },
  }));

  useEffect(() => {
    setPage(initialPage);
    setPreviousPage(null);
    previousPageOpacity.setValue(1);
    pageOpacity.setValue(1);
    setIsLayoutReady(true);
    setNewPageLayoutReady(true);
  }, [initialPage, pageOpacity, previousPageOpacity]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleHashChange = () => {
        const hash = window.location.hash;
        const newPage = getPageFromHash(hash);
        if (newPage !== null && newPage !== page) {
          setPreviousPage(page);
          setNewPageLayoutReady(false);
          setFadeStarted(false);
          previousPageOpacity.setValue(1);
          pageOpacity.setValue(0);
          setPage(newPage);
        }
      };

      handleHashChange();

      window.addEventListener("hashchange", handleHashChange);
      return () => {
        window.removeEventListener("hashchange", handleHashChange);
      };
    }
  }, [page, pageOpacity, previousPageOpacity]);
  useEffect(() => {
    if (previousPage !== null && newPageLayoutReady && !fadeStarted) {
      setFadeStarted(true);
      Animated.parallel([
        Animated.timing(previousPageOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(pageOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setPreviousPage(null);
          setNewPageLayoutReady(false);
          setFadeStarted(false);
          setIsLayoutReady(true);
        }
      });
    }
  }, [
    previousPage,
    newPageLayoutReady,
    fadeStarted,
    pageOpacity,
    previousPageOpacity,
  ]);

  const goToNext = () => {
    const currentPage = page;
    const nextPage = page + 1;
    setRemovingPage(currentPage);
    setPreviousPage(currentPage);
    setNewPageLayoutReady(false);
    previousPageOpacity.setValue(1);
    pageOpacity.setValue(0);

    setPage(nextPage);

    requestAnimationFrame(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
          Animated.timing(previousPageOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
          Animated.timing(pageOpacity, {
            toValue: 1,
            duration: 400,
            delay: 50,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]).start(({ finished }) => {
          if (finished) {
            slideAnim.setValue(0);
            setRemovingPage(null);
            setPreviousPage(null);
            setNewPageLayoutReady(true);
            if (currentPage === 2) onTransitionComplete?.();
          }
        });
      }, 16);
    });
  };

  const nextTranslateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenWidth, 0],
  });

  const renderPageComponent = (pageNum: number) => {
    if (pageNum === 0) return <FirstLandingPage onSkip={goToNext} />;
    if (pageNum === 1) return <SecondLandingPage onLikeThis={goToNext} />;
    if (pageNum === 2) return <ThirdLandingPage />;
    return null;
  };

  const renderPage = () => {
    if (removingPage !== null) {
      let OutPage, InPage;
      if (removingPage === 0) {
        OutPage = <FirstLandingPage onSkip={goToNext} />;
        InPage = <SecondLandingPage onLikeThis={goToNext} />;
      } else if (removingPage === 1) {
        OutPage = <SecondLandingPage onLikeThis={goToNext} />;
        InPage = <ThirdLandingPage />;
      }
      return (
        <>
          <Animated.View
            style={[styles.pageContainer, { opacity: previousPageOpacity }]}
            pointerEvents="none"
          >
            {OutPage}
          </Animated.View>
          <Animated.View
            style={[
              styles.pageContainer,
              {
                transform: [{ translateX: nextTranslateX }],
                opacity: pageOpacity,
              },
            ]}
          >
            {InPage}
          </Animated.View>
        </>
      );
    }

    return (
      <>
        {previousPage !== null && (
          <Animated.View
            style={[styles.pageContainer, { opacity: previousPageOpacity }]}
            pointerEvents="none"
          >
            {renderPageComponent(previousPage)}
          </Animated.View>
        )}
        <Animated.View
          style={[styles.pageContainer, { opacity: pageOpacity }]}
          onLayout={() => {
            if (previousPage !== null && !newPageLayoutReady) {
              setTimeout(() => {
                setNewPageLayoutReady(true);
              }, 7);
            } else if (!isLayoutReady) {
              setIsLayoutReady(true);
            }
          }}
        >
          {renderPageComponent(page)}
        </Animated.View>
      </>
    );
  };

  return <View style={styles.container}>{renderPage()}</View>;
}
