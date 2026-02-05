import React from "react";
import { View, Text } from "react-native";
import { Entypo } from "@expo/vector-icons";
import Artwork from "../classic/artwork";
import DropdownMenu from "../../DropdownMenu";
import { usePlayerMenu } from "../../../hooks/usePlayerMenu";
import SleepTimerModal from "../SleepTimerModal";

interface TopProps {
  currentSong: any;
}

export default function Top({ currentSong }: TopProps) {
  const { sleepTimerModalVisible, setSleepTimerModalVisible, menuItems } =
    usePlayerMenu();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 16,
      }}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 8,
          overflow: "hidden",
          flexShrink: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Artwork song={currentSong} artworkSize={70} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "600",
            overflow: "hidden",
          }}
        >
          {currentSong?.title || "Unknown"}
        </Text>
        <Text style={{ color: "gray", fontSize: 14, overflow: "hidden" }}>
          {currentSong?.artist || ""}
        </Text>
      </View>
      <View>
        <DropdownMenu
          trigger={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                marginRight: 5,
              }}
            >
              <Entypo name="dots-two-horizontal" size={24} color="white" />
            </View>
          }
          menuItems={menuItems}
        />
        <SleepTimerModal
          visible={sleepTimerModalVisible}
          onClose={() => setSleepTimerModalVisible(false)}
        />
      </View>
    </View>
  );
}
