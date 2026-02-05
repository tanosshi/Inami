import React, { useState, useEffect, useRef } from "react";
import { View, Text, Animated } from "react-native";
import Slider from "@react-native-community/slider";

import { SPACING } from "../../../constants/theme";
import { useDynamicStyles } from "../../../hooks/useDynamicStyles";

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (value: number) => void;
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function ProgressBar({
  position,
  duration,
  onSeek,
}: ProgressBarProps) {
  const [sliderValue, setSliderValue] = useState<number>(position);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isSliding) {
      Animated.timing(progressAnim, {
        toValue: duration ? position / duration : 0,
        duration: 150,
        useNativeDriver: false,
      }).start();
    }
  }, [position, duration, isSliding, progressAnim]);
  const styles = useDynamicStyles(() => ({
    overlayContainer: {
      position: "absolute" as const,
      left: 2,
      right: SPACING.md,
      top: -4,
      height: 8,
      width: "98%" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    progressPillBackground: {
      backgroundColor: "#00000040",
      height: 7,
      borderRadius: 999,
      width: "100%" as const,
      overflow: "hidden" as const,
      flexDirection: "row" as const,
    },
    progressPillFill: {
      backgroundColor: "#000",
      height: "100%" as const,
      borderRadius: 999,
    },
  }));

  return (
    <View style={{ marginBottom: 24 }}>
      <Slider
        style={{ width: "100%", height: 12, opacity: 0, top: -7 }}
        minimumValue={0}
        maximumValue={duration || 1}
        value={sliderValue}
        onSlidingStart={() => setIsSliding(true)}
        onValueChange={(val) => {
          setSliderValue(val);
          if (isSliding) {
            progressAnim.setValue(duration ? val / duration : 0);
          }
        }}
        onSlidingComplete={(val) => {
          setIsSliding(false);
          onSeek(val);
        }}
        minimumTrackTintColor="rgba(0, 0, 0, 0.6)"
        maximumTrackTintColor="rgba(0, 0, 0, 0.1)"
        thumbTintColor="rgba(0, 0, 0, 0.6)"
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.xs,
          paddingLeft: 2,
        }}
      >
        <Text style={{ color: "black", fontSize: 12 }}>
          {formatTime(position)}
        </Text>
        <Text
          style={{
            color: "black",
            fontSize: 12,
          }}
        >
          {formatTime(duration)}
        </Text>
      </View>
      <View style={styles.overlayContainer} pointerEvents="none">
        <View style={styles.progressPillBackground}>
          <Animated.View
            style={[
              styles.progressPillFill,
              {
                flex: progressAnim,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}
