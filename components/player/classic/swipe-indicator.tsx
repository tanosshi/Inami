import React from "react";
import { View } from "react-native";
import { COLORS } from "../../../constants/theme";
import { useDynamicStyles } from "../../../hooks/useDynamicStyles";

export default function SwipeIndicator() {
  const styles = useDynamicStyles(() => ({
    swipeIndicator: {
      alignItems: "center" as const,
      paddingTop: 8,
      paddingBottom: 4,
    },
    swipeHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: COLORS.outlineVariant,
    },
  }));

  return (
    <View style={styles.swipeIndicator}>
      <View style={styles.swipeHandle} />
    </View>
  );
}
