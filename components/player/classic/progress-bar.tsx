import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import Slider from "@react-native-community/slider";
import { getSetting } from "../../../utils/database";
import { COLORS, SPACING, TYPOGRAPHY } from "../../../constants/theme";
import {
  useDynamicStyles,
  useThemeValues,
} from "../../../hooks/useDynamicStyles";

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

  const [roundedEnabled, setRoundedEnabled] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const val = await getSetting("rounded_progress_bar");
        if (mounted) setRoundedEnabled(!!val);
      } catch (e) {
        void e;
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const [sliderValue, setSliderValue] = useState<number>(position);
  const [isSliding, setIsSliding] = useState<boolean>(false);

  useEffect(() => {
    if (!isSliding) {
      setSliderValue(position);
    }
  }, [position, isSliding]);

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
    overlayContainer: {
      position: "absolute" as const,
      left: SPACING.md,
      right: SPACING.md,
      top: 15,
      height: 8,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    progressPillBackground: {
      backgroundColor: themeValues.COLORS.surfaceContainerHighest,
      height: 8,
      borderRadius: 999,
      width: "100%" as const,
      overflow: "hidden" as const,
      flexDirection: "row" as const,
    },
    progressPillFill: {
      backgroundColor: themeValues.COLORS.primary,
      height: "100%" as const,
      borderRadius: 999,
    },
  }));

  return (
    <View style={styles.progressContainer}>
      <View style={{ position: "relative" }}>
        <Slider
          style={[styles.slider, roundedEnabled ? { opacity: 0 } : undefined]}
          minimumValue={0}
          maximumValue={duration || 1}
          value={sliderValue}
          onSlidingStart={() => setIsSliding(true)}
          onValueChange={(val) => setSliderValue(val)}
          onSlidingComplete={(val) => {
            setIsSliding(false);
            onSeek(val);
          }}
          minimumTrackTintColor={
            roundedEnabled ? "transparent" : themeValues.COLORS.primary
          }
          maximumTrackTintColor={
            roundedEnabled
              ? "transparent"
              : themeValues.COLORS.surfaceContainerHighest
          }
          thumbTintColor={
            roundedEnabled ? "transparent" : themeValues.COLORS.primary
          }
        />

        {roundedEnabled ? (
          <View style={styles.overlayContainer} pointerEvents="none">
            <View style={styles.progressPillBackground}>
              <View
                style={[
                  styles.progressPillFill,
                  {
                    flex: duration
                      ? isSliding
                        ? sliderValue / duration
                        : position / duration
                      : 0,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}
      </View>

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
