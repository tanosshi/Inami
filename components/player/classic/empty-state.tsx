import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../../constants/theme";
import {
  useDynamicStyles,
  useThemeValues,
} from "../../../hooks/useDynamicStyles";

interface EmptyStateProps {
  onGoBack: () => void;
}

export default function EmptyState({ onGoBack }: EmptyStateProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurfaceVariant,
      marginTop: SPACING.md,
    },
    backLink: {
      marginTop: SPACING.md,
    },
    linkText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
    },
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.emptyContainer}>
        <MaterialIcons
          name="music-off"
          size={64}
          color={themeValues.COLORS.onSurfaceVariant}
        />
        <Text style={styles.emptyText}>No song playing</Text>
        <TouchableOpacity style={styles.backLink} onPress={onGoBack}>
          <Text style={styles.linkText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
