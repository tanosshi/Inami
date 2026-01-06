import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import DropdownMenu from "../DropdownMenu";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import {
  isSleepTimerActive,
  formatRemainingTime,
} from "../../utils/sleepTimer";
import SleepTimerModal from "./SleepTimerModal";

interface PlayerHeaderProps {
  onBackPressed: () => void;
}

export default function PlayerHeader({ onBackPressed }: PlayerHeaderProps) {
  const themeValues = useThemeValues();
  const [sleepTimerModalVisible, sleeptimerVisible] = useState(false);

  const styles = useDynamicStyles(() => ({
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    headerButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    headerCenter: {
      flex: 1,
      alignItems: "center" as const,
    },
    headerLabel: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.labelSmall,
      color: COLORS.onSurfaceVariant,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
    },
    headerTitle: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.titleSmall,
      color: COLORS.onSurface,
      marginTop: 2,
    },
  }));

  const menuItems = [
    {
      id: "delete-file",
      title: "Delete",
      icon: "delete",
      onPress: () => {},
    },
    {
      id: "add-to-playlist",
      title: "Add to Playlist",
      icon: "playlist-add",
      onPress: () => {},
    },
    {
      id: "share",
      title: "Share",
      icon: "share",
      onPress: () => {},
    },
    {
      id: "download",
      title: "Download",
      icon: "download",
      onPress: () => {},
    },
    {
      id: "Album",
      title: "Album",
      icon: "favorite",
      onPress: () => {},
    },
    {
      id: "song-info",
      title: "Track details",
      icon: "info",
      onPress: () => {},
    },
    {
      id: "sleep-timer",
      title: isSleepTimerActive()
        ? `Sleep Timer (${formatRemainingTime()})`
        : "Sleep Timer",
      icon: "timer",
      onPress: () => sleeptimerVisible(true),
    },
  ];

  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={onBackPressed}>
          <MaterialIcons
            name="keyboard-arrow-down"
            size={28}
            color={themeValues.COLORS.onSurface}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>Playing from</Text>
          <Text style={styles.headerTitle}>Your Library</Text>
        </View>
        <DropdownMenu
          trigger={
            <View style={styles.headerButton}>
              <MaterialIcons
                name="more-vert"
                size={24}
                color={themeValues.COLORS.onSurface}
              />
            </View>
          }
          menuItems={menuItems}
        />
      </View>
      <SleepTimerModal
        visible={sleepTimerModalVisible}
        onClose={() => sleeptimerVisible(false)}
      />
    </>
  );
}
