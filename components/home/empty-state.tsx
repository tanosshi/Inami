import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

export default function EmptyState() {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    emptyState: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingVertical: 80,
    },
    emptyTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurface,
      marginTop: SPACING.md,
    },
    emptyText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
      marginTop: SPACING.sm,
    },
  }));

  return (
    <View style={styles.emptyState}>
      <MaterialIcons
        name="library-music"
        size={64}
        color={themeValues.COLORS.onSurfaceVariant}
      />
      <Text style={styles.emptyTitle}>No data yet</Text>
      <Text style={styles.emptyText}>Go to Songs tab to add music</Text>
    </View>
  );
}
