import React from "react";
import { View, TouchableOpacity } from "react-native";
import MaterialIcons from "@expo/vector-icons/build/MaterialIcons";
import FontAwesome6 from "@expo/vector-icons/build/FontAwesome6";
import { COLORS } from "../../../constants/theme";

interface ControlsProps {
  isPlaying: boolean;
  togglePlayPause: () => void;
  playPrevious: () => void;
  playNext: () => void;
}

export default function Controls({
  isPlaying,
  togglePlayPause,
  playPrevious,
  playNext,
}: ControlsProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <TouchableOpacity
        onPress={playPrevious}
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome6
          name="play"
          size={13}
          color={COLORS.background}
          style={{ transform: [{ rotate: "180deg" }] }}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={togglePlayPause}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: COLORS.background,
          opacity: 0.9,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialIcons
          name={isPlaying ? "pause" : "play-arrow"}
          size={24}
          color={COLORS.onBackground}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={playNext}
        style={{
          width: 48,
          height: 48,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FontAwesome6 name="play" size={13} color={COLORS.background} />
      </TouchableOpacity>
    </View>
  );
}
