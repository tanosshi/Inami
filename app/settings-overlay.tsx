import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import SettingsIndex from "../components/settings/SettingsIndex";

export default function SettingsOverlayScreen() {
  const router = useRouter();
  const { width } = Dimensions.get("window");
  const translateX = useRef(new Animated.Value(width)).current;
  const opacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 340,
        easing: (t) => 1 - Math.pow(1 - t, 4),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: (t) => 1 - Math.pow(1 - t, 3),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateX]);

  const handleRequestClose = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width,
        duration: 260,
        easing: (t) => t * t,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.85,
        duration: 200,
        easing: (t) => t * t,
        useNativeDriver: true,
      }),
    ]).start(() => router.back());
  };

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <SettingsIndex overlay onRequestClose={handleRequestClose} />
    </Animated.View>
  );
}
