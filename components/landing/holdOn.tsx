import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Octicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

type FirstProps = {
  onSkip?: () => void;
};

export default function LandingPage({ onSkip }: FirstProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    iconRow: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    main: {
      marginTop: SPACING.xxl + 12,
    },
    icon: {
      left: 0,
      paddingLeft: SPACING.sm + 3,
      paddingTop: SPACING.xl,
      position: "absolute" as const,
    },
    top: {
      marginTop: SPACING.sm,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.sm + 3,
      alignItems: "flex-end" as const,
      position: "relative" as const,
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    flexSpacer: {
      flex: 1,
    },
    bottomSection: {
      flex: 1,
      justifyContent: "flex-start" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    iconatBox: {
      filter: "brightness(100)",
    },
    welcomeText: {
      fontFamily: "Inter_400Regular",
      fontSize: 32,
      color: COLORS.onSurface,
      textAlign: "left" as const,
      alignSelf: "flex-start" as const,
      width: "100%" as const,
    },
    descText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurfaceVariant,
    },
    bottomRow: {
      flexDirection: "column" as const,
      justifyContent: "flex-end" as const,
      alignItems: "center" as const,
      marginBottom: SPACING.md,
      width: "100%" as const,
    },
    iconBox: {
      width: "100%" as const,
      height: 190,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      marginVertical: SPACING.xl,
      opacity: 0.55,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    permsB: {
      backgroundColor: COLORS.primaryContainer,
      width: "100%" as const,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + SPACING.xs,
      borderRadius: RADIUS.full,
    },
    permsBAllFiles: {
      backgroundColor: COLORS.primaryContainer,
      width: "100%" as const,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + SPACING.xs,
      borderRadius: RADIUS.full,
    },
    permsBGranted: {
      backgroundColor: COLORS.surface,
      opacity: 0.7,
    },
    permsBDisabled: {
      opacity: 0.5,
    },
    permsBText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
      textAlign: "center" as const,
    },
    permsBAllFilesText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      textAlign: "center" as const,
    },
    buttonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bottomSection} collapsable={false}>
        <View style={styles.top}>
          <Octicons
            style={styles.icon}
            name="git-pull-request"
            size={28}
            color={themeValues.COLORS.onSurface}
          />

          <View style={styles.main}>
            <Text style={styles.welcomeText}>Wait!</Text>
            <Text style={styles.descText}>
              We noticed a ton of missing metadata for your songs.
            </Text>
          </View>
        </View>
        <View style={styles.iconBox}>
          <View style={styles.iconRow}>
            <MaterialIcons
              name="notifications"
              size={64}
              color={themeValues.COLORS.onPrimary}
              style={styles.iconatBox}
            />
            <MaterialIcons
              name="storage"
              size={64}
              color={themeValues.COLORS.onPrimary}
              style={[styles.iconatBox, { marginLeft: SPACING.xl }]}
            />
          </View>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.permsB]}>
            <Text style={styles.permsBText}>
              hhello yes let me fix my problems
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
