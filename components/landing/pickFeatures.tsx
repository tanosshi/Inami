import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Switch,
  ScrollView,
  Easing,
} from "react-native";
import { Octicons, MaterialIcons, FontAwesome6 } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { saveSettingsBatch } from "../../utils/database";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

import { SETTINGS_CONFIG } from "../../constants/settings";
import { CUSTOMIZATION_CONFIG } from "../../constants/customization";
import { DISCOVERY_CONFIG } from "../../constants/customs/discovery";
import { DLMUSIC_CONFIG } from "../../constants/customs/dlmusic";
import { FM_CONFIG } from "../../constants/customs/fm";
import { METADATA_CONFIG } from "../../constants/customs/metadata";
import { SEARCH_CONFIG } from "../../constants/customs/search";
import { SYNC_CONFIG } from "../../constants/customs/sync";

type FirstProps = {
  onSkip?: () => void;
};

type Feature = {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconLibrary: "MaterialIcons" | "FontAwesome6" | "Octicons";
};

const features: Feature[] = [
  {
    id: "enable_discovery",
    name: "Discovery",
    description: "Discover new music tailored to your taste",
    icon: "compass-calibration",
    iconLibrary: "MaterialIcons",
  },
  {
    id: "enable_metadata_fetch",
    name: "Correct metadata",
    description:
      "Automatically correct and fetch missing metadata for your music",
    icon: "library-music",
    iconLibrary: "MaterialIcons",
  },
  {
    id: "enable_fm",
    name: "Last.fm Scrobbling",
    description: "Track your listening history on Last.fm",
    icon: "audiotrack",
    iconLibrary: "MaterialIcons",
  },
  {
    id: "sleep_timer",
    name: "Automatic sleeptimer",
    description:
      "Automatically set a sleeptimer once a justified moment is detected",
    icon: "timer",
    iconLibrary: "MaterialIcons",
  },
  {
    id: "enable_dlmusic",
    name: "Download Music",
    description: "Ability to manually download music to your device",
    icon: "download",
    iconLibrary: "MaterialIcons",
  },
];

export default function LandingPage({ onSkip }: FirstProps) {
  const themeValues = useThemeValues();
  const [isFinishing, setIsFinishing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [featureStates, setFeatureStates] = useState<Record<string, boolean>>({
    enable_discovery: true,
    enable_metadata_fetch: false,
    enable_fm: false,
    sleep_timer: true,
    enable_dlmusic: true,
  });

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
      paddingTop: SPACING.xl + 8,
      position: "absolute" as const,
      opacity: 0.8,
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
      fontSize: 28,
      color: COLORS.onSurface,
      textAlign: "left" as const,
      alignSelf: "flex-start" as const,
      width: "90%" as const,
    },
    descText: {
      top: -SPACING.xl,
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
      height: "58%" as const,
      top: -SPACING.xxl,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      marginVertical: SPACING.xl,
      opacity: 0.55,
      overflow: "hidden" as const,
    },
    featuresScroll: {
      flex: 1,
    },
    featuresContainer: {
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    featureItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: SPACING.sm,
      gap: SPACING.md,
    },
    featureIconContainer: {
      width: 40,
      height: 40,
      backgroundColor: COLORS.primaryContainer,
      borderRadius: RADIUS.md,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    featureContent: {
      flex: 1,
      gap: 2,
    },
    featureName: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurface,
    },
    featureDescription: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.onSurfaceVariant,
    },
    skipButton: {
      position: "absolute" as const,
      left: SPACING.sm + 5,
      bottom: SPACING.lg,
      backgroundColor: "transparent",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.md,
      borderRadius: RADIUS.full,
      zIndex: 10,
    },
    skipButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSecondaryContainer,
      opacity: 0.7,
      textAlign: "left" as const,
    },
    permsB: {
      backgroundColor: COLORS.primaryContainer,
      width: "100%" as const,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + SPACING.xs,
      borderRadius: RADIUS.full,
    },
    permsBText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
      textAlign: "center" as const,
    },
    buttonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
    finishButton: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
      width: "90%" as const,
      backgroundColor: COLORS.primaryContainer,
      borderRadius: RADIUS.full,
      position: "absolute" as const,
      left: SPACING.lg,
      bottom: SPACING.xl,
    },
    finishButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
      textAlign: "center" as const,
      fontSize: 12,
      letterSpacing: 0.5,
    },
  }));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(({ finished }) => {
      if (finished) {
        fadeAnim.setValue(0);
      }
    });
  }, []);

  const handleToggle = (featureId: string, value: boolean) => {
    setFeatureStates((prev) => ({
      ...prev,
      [featureId]: value,
    }));
  };

  const findTogglesWithDefaults = async () => {
    const configs = [
      SETTINGS_CONFIG,
      CUSTOMIZATION_CONFIG,
      DISCOVERY_CONFIG,
      DLMUSIC_CONFIG,
      FM_CONFIG,
      METADATA_CONFIG,
      SEARCH_CONFIG,
      SYNC_CONFIG,
    ];

    const findToggles = (
      obj: any
    ): Array<{ codename: string; defaultValue: boolean }> => {
      const results: Array<{ codename: string; defaultValue: boolean }> = [];

      if (Array.isArray(obj)) {
        for (const item of obj) {
          if (
            item &&
            typeof item === "object" &&
            item.type === "toggle" &&
            (item.defaultValue === true || item.defaultValue === false) &&
            item.codename
          ) {
            results.push({
              codename: item.codename,
              defaultValue: item.defaultValue,
            });
          }
          results.push(...findToggles(item));
        }
      } else if (obj && typeof obj === "object") {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            results.push(...findToggles(obj[key]));
          }
        }
      }

      return results;
    };

    const toggles = configs.flatMap((config) => findToggles(config));
    if (toggles.length > 0) {
      const settingsToSave = toggles.map((toggle) => ({
        codename: toggle.codename,
        value:
          typeof featureStates[toggle.codename] === "boolean"
            ? featureStates[toggle.codename]
            : toggle.defaultValue,
      }));
      await saveSettingsBatch(settingsToSave);
    }
  };

  const handleFinish = async () => {
    setIsFinishing(true);
    await findTogglesWithDefaults();
    setIsFinishing(false);
    if (onSkip) {
      onSkip();
    }
  };

  const renderIcon = (feature: Feature) => {
    const iconProps = {
      size: 20,
      color: themeValues.COLORS.primary,
    };

    switch (feature.iconLibrary) {
      case "MaterialIcons":
        return <MaterialIcons name={feature.icon} {...iconProps} />;
      case "FontAwesome6":
        return <FontAwesome6 name={feature.icon} {...iconProps} />;
      case "Octicons":
        return <Octicons name={feature.icon as any} {...iconProps} />;
      default:
        return <MaterialIcons name="settings" {...iconProps} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bottomSection} collapsable={false}>
        <View style={styles.top}>
          <FontAwesome6
            style={styles.icon}
            name="wand-magic-sparkles"
            size={28}
            color={themeValues.COLORS.onSurface}
          />

          <View style={styles.main}>
            <Text style={styles.welcomeText}>Now the interesting part</Text>
            <Text style={styles.descText}>
              Are there any features you would like to enable? More features can
              be enabled in settings later.
            </Text>
          </View>
        </View>
        <View style={styles.iconBox}>
          <ScrollView
            style={styles.featuresScroll}
            contentContainerStyle={styles.featuresContainer}
            showsVerticalScrollIndicator={false}
          >
            {features.map((feature, index) => (
              <View key={feature.id} style={styles.featureItem}>
                <View style={styles.featureIconContainer}>
                  {renderIcon(feature)}
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureName}>{feature.name}</Text>
                  <Text style={styles.featureDescription}>
                    {feature.description}
                  </Text>
                </View>
                <Switch
                  value={featureStates[feature.id] || false}
                  onValueChange={(value) => handleToggle(feature.id, value)}
                  trackColor={{
                    false: themeValues.COLORS.surfaceVariant,
                    true: themeValues.COLORS.primaryContainer,
                  }}
                  thumbColor={
                    featureStates[feature.id]
                      ? themeValues.COLORS.primary
                      : themeValues.COLORS.onSurfaceVariant
                  }
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
      {/* Finish Button */}
      <TouchableOpacity
        style={styles.finishButton}
        onPress={handleFinish}
        disabled={isFinishing}
      >
        {isFinishing ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
            }}
          >
            <MaterialIcons
              name="autorenew"
              size={18}
              color={themeValues.COLORS.onSurfaceVariant}
              style={{ marginRight: 8, transform: [{ rotate: "360deg" }] }}
            />
            <Text style={styles.finishButtonText}>Saving...</Text>
          </View>
        ) : (
          <Text style={styles.finishButtonText}>Next</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}
