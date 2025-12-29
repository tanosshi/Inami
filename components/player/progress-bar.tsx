import React from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

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
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    progressContainer: {
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.sm,
    },
    slider: {
      width: "100%" as const,
      height: 40,
    },
    timeRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      marginTop: -4,
    },
    timeText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.labelSmall,
      color: COLORS.onSurfaceVariant,
      marginBottom: -1,
    },
    leftTime: {
      textAlign: "left" as const,
      paddingLeft: SPACING.md - 1,
    },
    rightTime: {
      textAlign: "right" as const,
      paddingRight: SPACING.md - 1,
    },
  }));

  return (
    <View style={styles.progressContainer}>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration || 1}
        value={position}
        onSlidingComplete={onSeek}
        minimumTrackTintColor={themeValues.COLORS.primary}
        maximumTrackTintColor={themeValues.COLORS.surfaceContainerHighest}
        thumbTintColor={themeValues.COLORS.primary}
      />
      <View style={styles.timeRow}>
        <Text style={[styles.timeText, styles.leftTime]}>
          {formatTime(position)}
        </Text>
        <Text style={[styles.timeText, styles.rightTime]}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}
