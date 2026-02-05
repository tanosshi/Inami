import React from "react";
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, Pattern, Line, Rect } from "react-native-svg";
import { RADIUS, COLORS } from "@/constants/theme";
import { blendColors, lightenColor } from "@/utils/colorUtils";
import { useDynamicStyles } from "@/hooks/useDynamicStyles";

interface DayData {
  day: string;
  tracks: number;
}

interface TracksListenedProps {
  accentColor?: string;
}

const StripedBar = ({ accentColor }: TracksListenedProps) => {
  const absoluteFillStyle = {
    position: "absolute" as const,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  return (
    <Svg width="100%" height="100%" style={absoluteFillStyle}>
      <Defs>
        <Pattern
          id="diagonalStripes"
          patternUnits="userSpaceOnUse"
          width="4"
          height="4"
          patternTransform="rotate(75)"
        >
          <Line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke={lightenColor(accentColor || "#a3e635", 75)}
            strokeWidth="4"
            opacity={0.7}
          />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={COLORS.background} />
      <Rect
        x="0"
        y="0"
        width="100%"
        height="100%"
        fill="url(#diagonalStripes)"
      />
    </Svg>
  );
};

export default function TracksListened({
  accentColor = "#a3e635",
}: TracksListenedProps) {
  const weeklyData: DayData[] = [
    { day: "M", tracks: 45 },
    { day: "T", tracks: 67 },
    { day: "W", tracks: 89 },
    { day: "T", tracks: 72 },
    { day: "F", tracks: 58 },
    { day: "S", tracks: 38 },
    { day: "S", tracks: 87 },
  ];

  const totalTracks = weeklyData.reduce((sum, day) => sum + day.tracks, 0);
  const maxTracks = Math.max(...weeklyData.map((d) => d.tracks));

  const finalAccentColor =
    COLORS.background === "#000000"
      ? lightenColor(accentColor, 25)
      : accentColor;

  const blendedColor = blendColors(COLORS.background, COLORS.primary, 0.06);
  const blendedColor2 = blendColors(COLORS.background, COLORS.surface, 1);

  const styles = useDynamicStyles(() => ({
    card: {
      padding: 24,
      borderRadius: 20,
      marginBottom: 24,
    },
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginBottom: 12,
    },
    headerTitle: {
      color: COLORS.onSurface,
      fontSize: 14,
      marginBottom: 24,
      fontWeight: "400" as const,
      opacity: 0.6,
    },
    totalCount: {
      marginBottom: 24,
      fontSize: 20,
      fontWeight: "300" as const,
      color: COLORS.onSurface,
    },
    chartWrapper: {},
    barsArea: {
      height: 60,
      position: "relative" as const,
    },
    barsContainer: {
      flexDirection: "row" as const,
      alignItems: "flex-end" as const,
      justifyContent: "space-between" as const,
      height: "100%" as const,
      gap: 6,
    },
    barGroup: {
      flex: 1,
      alignItems: "center" as const,
      height: "100%" as const,
      justifyContent: "flex-end" as const,
    },
    barWrapper: {
      width: "80%" as const,
      borderRadius: RADIUS.full,
      overflow: "hidden" as const,
    },
    bar: {
      flex: 1,
      borderRadius: RADIUS.full,
    },
    dayLabelsRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      marginTop: 6,
    },
    dayLabel: {
      flex: 1,
      textAlign: "center" as const,
      color: COLORS.onSurface,
      fontSize: 11,
      fontWeight: "300" as const,
      opacity: 0.5,
    },
    dayLabelHighlight: {
      color: accentColor,
    },
  }));

  return (
    <LinearGradient
      colors={[blendedColor, blendedColor2]}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>This Week</Text>
        <Text style={styles.totalCount}>{totalTracks}</Text>
      </View>

      <View style={styles.chartWrapper}>
        <View style={styles.barsArea}>
          <Svg
            width="100%"
            height="100%"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          >
            {[0, 15, 30, 45, 60].map((y) => (
              <Line
                key={y}
                x1="0"
                y1={y}
                x2="100%"
                y2={y}
                stroke={COLORS.surfaceContainerHighest}
                opacity={0.7}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}
          </Svg>

          <View style={styles.barsContainer}>
            {weeklyData.map((data, index) => {
              const isMax = data.tracks === maxTracks;
              const heightPercentage = (data.tracks / maxTracks) * 100;

              return (
                <View key={index} style={styles.barGroup}>
                  <View
                    style={[
                      styles.barWrapper,
                      { height: `${heightPercentage}%` },
                    ]}
                  >
                    {isMax ? (
                      <View
                        style={[
                          styles.bar,
                          { backgroundColor: finalAccentColor },
                        ]}
                      />
                    ) : (
                      <View style={styles.bar}>
                        <StripedBar accentColor={accentColor} />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.dayLabelsRow}>
          {weeklyData.map((data, index) => (
            <Text key={index} style={styles.dayLabel}>
              {data.day}
            </Text>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}
