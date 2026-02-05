import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeValues } from "../../hooks/useDynamicStyles";
import { COLORS, TYPOGRAPHY, SPACING } from "../../constants/theme";

interface EmptyStateProps {
  searchQuery: string;
}

export default function EmptyState({ searchQuery }: EmptyStateProps) {
  const themeValues = useThemeValues();

  return (
    <View style={{
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    }}>
      <MaterialIcons
        name="library-music"
        size={64}
        color={themeValues.COLORS.onSurfaceVariant}
      />
      <Text style={{
        fontFamily: "Inter_600SemiBold",
        ...TYPOGRAPHY.titleLarge,
        color: COLORS.onSurface,
        marginTop: SPACING.md,
      }}>
        No songs found
      </Text>
      <Text style={{
        fontFamily: "Inter_400Regular",
        ...TYPOGRAPHY.bodyMedium,
        color: COLORS.onSurfaceVariant,
        marginTop: SPACING.sm,
        textAlign: "center",
      }}>
        {searchQuery
          ? "Try a different search"
          : "Add songs from your device or import from URL"}
      </Text>
    </View>
  );
}
