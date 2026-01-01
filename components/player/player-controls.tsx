import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";

interface PlayerControlsProps {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
}

export default function PlayerControls({
  isPlaying,
  shuffle,
  repeat,
  onPlayPause,
  onPrevious,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
}: PlayerControlsProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    controls: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.lg,
    },
    sideControl: {
      width: 48,
      height: 48,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    controlButton: {
      width: 64,
      height: 64,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    playButton: {
      width: 72,
      height: 72,
      borderRadius: RADIUS.xl,
      backgroundColor: COLORS.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginHorizontal: SPACING.sm,
    },
    modernPlayButton: {
      width: 72,
      height: 72,
      borderRadius: RADIUS.xxl,
      backgroundColor: "transparent" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginHorizontal: SPACING.sm,
    },
    repeatContainer: {
      position: "relative" as const,
      width: 24,
      height: 24,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    repeatOne: {
      position: "absolute" as const,
      fontSize: 7,
      fontWeight: "600" as const,
      bottom: 7.2,
      right: 9.8,
    },
  }));

  return (
    <View style={styles.controls}>
      <TouchableOpacity
        style={styles.sideControl}
        onPress={() => {
          triggerHaptic();
          onToggleShuffle();
        }}
      >
        <Ionicons
          name="shuffle"
          size={24}
          color={
            shuffle
              ? themeValues.COLORS.primary
              : themeValues.COLORS.secondaryContainer
          }
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => {
          triggerHaptic();
          onPrevious();
        }}
      >
        <FontAwesome5 name="fast-backward" size={20} color={COLORS.onSurface} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.modernPlayButton}
        onPress={() => {
          triggerHaptic();
          onPlayPause();
        }}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={30}
          color={themeValues.COLORS.onSurface}
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => {
          triggerHaptic();
          onNext();
        }}
      >
        <FontAwesome5 name="fast-forward" size={20} color={COLORS.onSurface} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sideControl}
        onPress={() => {
          triggerHaptic();
          onToggleRepeat();
        }}
      >
        <View style={styles.repeatContainer}>
          <Feather
            name="repeat"
            size={18}
            color={
              repeat !== "off"
                ? themeValues.COLORS.primary
                : themeValues.COLORS.secondaryContainer
            }
          />
          {repeat === "one" && (
            <Text
              style={[styles.repeatOne, { color: themeValues.COLORS.primary }]}
            >
              1
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}
