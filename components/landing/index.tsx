import React, { useRef, useEffect, useState } from "react";
import { Platform, StyleSheet } from "react-native";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { Entypo } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { Cookie12Sided, Triangle } from "../Shapes";
import LandingTransition from "./transition";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

const getPageFromHash = (hash: string): number | null => {
  if (!hash || hash === "#") return null;
  const hashMap: { [key: string]: number } = {
    permissions: 0,
    nowforyou: 1,
    pickfeatures: 2,
  };
  const hashName = hash.replace("#", "").toLowerCase();
  return hashMap[hashName] ?? null;
};

export default function LandingPage() {
  const themeValues = useThemeValues();
  const spinAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatXAnim = useRef(new Animated.Value(0)).current;

  const [showFirst, setShowFirst] = useState(false);
  const [initialPage, setInitialPage] = useState(0);

  const styles = useDynamicStyles(() => ({
    top: {
      paddingHorizontal: SPACING.sm + 3,
      paddingBottom: SPACING.md,
      alignItems: "flex-end" as const,
      width: "100%" as const,
      position: "relative" as const,
    },
    cookieContainer: {
      position: "absolute" as const,
      top: -500,
      right: -100,
      marginBottom: SPACING.lg,
    },
    triangleContainer: {
      position: "absolute" as const,
      top: -130,
      left: -150,
      transform: [{ scaleX: -1 }],
      marginBottom: SPACING.lg,
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    flexSpacer: {
      flex: 1,
    },
    bottomSection: {
      alignItems: "center" as const,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    welcomeText: {
      fontFamily: "Inter_400Regular",
      fontSize: 50,
      color: COLORS.onSurface,
      marginBottom: SPACING.xl,
      textAlign: "left" as const,
      alignSelf: "flex-start" as const,
      width: "100%" as const,
    },
    languageRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      alignSelf: "flex-start" as const,
      marginBottom: SPACING.xl,
      gap: SPACING.sm,
    },
    languageText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurfaceVariant,
      marginLeft: SPACING.md - 2,
    },
    bottomRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: SPACING.md,
      width: "100%" as const,
    },
    skipButton: {
      backgroundColor: "transparent",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.full,
    },
    skipButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
      opacity: 0.7,
      textAlign: "left" as const,
    },
    getStartedButton: {
      backgroundColor: COLORS.primaryContainer,
      paddingHorizontal: SPACING.xxl + SPACING.md,
      paddingVertical: SPACING.sm + 5,
      borderRadius: RADIUS.full,
    },
    buttonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
    },
    icon: {
      marginLeft: SPACING.xs,
    },
  }));

  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const checkHash = () => {
        const hash = window.location.hash;
        const page = getPageFromHash(hash);
        if (page !== null) {
          setInitialPage(page);
          setShowFirst(true);
        }
      };

      checkHash();

      window.addEventListener("hashchange", checkHash);
      return () => {
        window.removeEventListener("hashchange", checkHash);
      };
    }
  }, []);

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 33000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      { iterations: Infinity }
    );
    spinLoop.start();

    const animateY = () => {
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      }).start(() => {
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }).start(animateY);
      });
    };

    const animateX = () => {
      Animated.timing(floatXAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      }).start(() => {
        Animated.timing(floatXAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }).start(animateX);
      });
    };

    animateY();
    animateX();

    return () => {
      spinLoop.stop();
    };
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (showFirst) {
    return <LandingTransition initialPage={initialPage} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.flexSpacer} />
      <View style={styles.bottomSection}>
        <View style={styles.top}>
          <Animated.View
            style={[styles.cookieContainer, { transform: [{ rotate: spin }] }]}
          >
            <Cookie12Sided width={400} height={400} strokeWidth={2} />
          </Animated.View>
          <Animated.View
            style={[
              styles.triangleContainer,
              {
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                  {
                    translateX: floatXAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -18],
                    }),
                  },
                  {
                    rotate: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-3deg", "5deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Triangle width={400} height={400} strokeWidth={3} />
          </Animated.View>
          <Text style={styles.welcomeText}>Music, redefined. Inami</Text>
          <View style={styles.languageRow}>
            <Entypo
              name="language"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <Text style={styles.languageText}>English (United States)</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.skipButton}>
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
          <View>
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={() => setShowFirst(true)}
            >
              <Text style={styles.buttonText}>Let&apos;s go!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
