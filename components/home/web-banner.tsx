import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

export default function WebBanner() {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    webBanner: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: "transparent" as const,
      paddingVertical: SPACING.sm,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.md,
      gap: SPACING.sm,
    },
    webBannerText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
    },
  }));

  return (
    <View style={styles.webBanner}>
      <MaterialIcons
        name="warning"
        size={18}
        color={themeValues.COLORS.likedContainer}
      />
      <Text style={styles.webBannerText}>
        The web version is not properly maintained and issues will most likely
        not be fixed.
      </Text>
    </View>
  );
}
