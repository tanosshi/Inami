import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Animated,
  Easing,
} from "react-native";

import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { saveThemeSettings } from "../../utils/database";
import { useTheme } from "../../contexts/ThemeContext";

import {
  COLORS as LightColors,
  SPACING as LightSpacing,
  RADIUS as LightRadius,
} from "../../constants/themes/light";
import {
  COLORS as GrayColors,
  SPACING as GraySpacing,
  RADIUS as GrayRadius,
} from "../../constants/themes/gray";

type NowForYouProps = {
  onLikeThis?: () => void;
};

type ThemeType = "Black" | "Light" | "Gray";

const getColorsForTheme = (theme: ThemeType) => {
  switch (theme) {
    case "Light":
      return LightColors;
    case "Gray":
      return GrayColors;
    case "Black":
    default:
      return COLORS;
  }
};

export default function LandingPage({ onLikeThis }: NowForYouProps) {
  const { refreshTheme } = useTheme();
  const [navToggle, setnavToggle] = useState(true);
  const [showNavTextToggle, setShowNavTextToggle] = useState(true);
  const [currentTheme, setCurrentTheme] = useState<ThemeType>("Black");
  const [previousTheme, setPreviousTheme] = useState<ThemeType | null>(null);
  const crossFadeAnim = useRef(new Animated.Value(1)).current;
  const isAnimating = useRef(false);

  const themeColors = getColorsForTheme(currentTheme);
  const previousThemeColors = previousTheme
    ? getColorsForTheme(previousTheme)
    : null;

  const handleThemeChange = (theme: ThemeType) => {
    if (theme === currentTheme || isAnimating.current) return;

    isAnimating.current = true;
    setPreviousTheme(currentTheme);
    crossFadeAnim.setValue(0);
    setCurrentTheme(theme);

    Animated.timing(crossFadeAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setPreviousTheme(null);
        isAnimating.current = false;
      }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {previousThemeColors && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: previousThemeColors.background },
          ]}
        />
      )}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: themeColors.background,
            opacity: previousTheme ? crossFadeAnim : 1,
          },
        ]}
      />
      <View style={styles.bottomSection} collapsable={false}>
        <View style={styles.top}>
          <MaterialIcons
            style={styles.icon}
            name="color-lens"
            size={28}
            color={themeColors.onSurface}
          />

          <View style={styles.main}>
            <Text
              style={[styles.welcomeText, { color: themeColors.onSurface }]}
            >
              Now, for you.
            </Text>
            <Text
              style={[styles.descText, { color: themeColors.onSurfaceVariant }]}
            >
              What&#39;s your preferred type of theme?
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={coloringBoxStyles.coloringBoxesRow}
          style={coloringBoxStyles.scrollContainer}
        >
          <TouchableOpacity
            style={[
              coloringBoxStyles.coloringBox,
              coloringBoxStyles.coloringBoxWithGap,
              currentTheme === "Black" && coloringBoxStyles.selectedBox,
            ]}
            onPress={() => handleThemeChange("Black")}
            activeOpacity={0.8}
          >
            <View style={coloringBoxStyles.smallerColoringBox}>
              <View style={coloringBoxStyles.smallrows}>
                <View style={coloringBoxStyles.smallerrow}></View>
                <View style={coloringBoxStyles.smallrow}></View>
                <View style={coloringBoxStyles.smallrow}></View>
                <View style={coloringBoxStyles.smallrow}></View>
              </View>
              <View style={coloringBoxStyles.smallbottomleftbutton}></View>
              <View
                style={[
                  coloringBoxStyles.smallnavbar,
                  !navToggle && {
                    backgroundColor: COLORS.background,
                  },
                ]}
              >
                <View
                  style={[
                    coloringBoxStyles.smallnavbaricon,
                    !showNavTextToggle && {
                      backgroundColor:
                        coloringBoxStyles.smallnavbar.backgroundColor,
                    },
                  ]}
                ></View>
                <View style={coloringBoxStyles.smallnavbariconselected}></View>
                <View
                  style={[
                    coloringBoxStyles.smallnavbaricon,
                    !showNavTextToggle && {
                      backgroundColor:
                        coloringBoxStyles.smallnavbar.backgroundColor,
                    },
                  ]}
                ></View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              lightColoringBoxStyles.coloringBox,
              lightColoringBoxStyles.coloringBoxWithGap,
              currentTheme === "Light" && lightColoringBoxStyles.selectedBox,
            ]}
            onPress={() => handleThemeChange("Light")}
            activeOpacity={0.8}
          >
            <View style={lightColoringBoxStyles.smallerColoringBox}>
              <View style={lightColoringBoxStyles.smallrows}>
                <View style={lightColoringBoxStyles.smallerrow}></View>
                <View style={lightColoringBoxStyles.smallrow}></View>
                <View style={lightColoringBoxStyles.smallrow}></View>
                <View style={lightColoringBoxStyles.smallrow}></View>
              </View>
              <View style={lightColoringBoxStyles.smallbottomleftbutton}></View>
              <View
                style={[
                  lightColoringBoxStyles.smallnavbar,
                  !navToggle && {
                    backgroundColor: LightColors.background,
                  },
                ]}
              >
                <View
                  style={[
                    lightColoringBoxStyles.smallnavbaricon,
                    !showNavTextToggle && {
                      backgroundColor:
                        lightColoringBoxStyles.smallnavbar.backgroundColor,
                    },
                  ]}
                ></View>
                <View
                  style={lightColoringBoxStyles.smallnavbariconselected}
                ></View>
                <View
                  style={[
                    lightColoringBoxStyles.smallnavbaricon,
                    !showNavTextToggle && {
                      backgroundColor:
                        lightColoringBoxStyles.smallnavbar.backgroundColor,
                    },
                  ]}
                ></View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              grayColoringBoxStyles.coloringBox,
              currentTheme === "Gray" && grayColoringBoxStyles.selectedBox,
            ]}
            onPress={() => handleThemeChange("Gray")}
            activeOpacity={0.8}
          >
            <View style={grayColoringBoxStyles.smallerColoringBox}>
              <View style={grayColoringBoxStyles.smallrows}>
                <View style={grayColoringBoxStyles.smallerrow}></View>
                <View style={grayColoringBoxStyles.smallrow}></View>
                <View style={grayColoringBoxStyles.smallrow}></View>
                <View style={grayColoringBoxStyles.smallrow}></View>
              </View>
              <View style={grayColoringBoxStyles.smallbottomleftbutton}></View>
              <View
                style={[
                  grayColoringBoxStyles.smallnavbar,
                  !navToggle && {
                    backgroundColor: GrayColors.background,
                  },
                ]}
              >
                <View
                  style={[
                    grayColoringBoxStyles.smallnavbaricon,
                    !showNavTextToggle && {
                      backgroundColor:
                        grayColoringBoxStyles.smallnavbar.backgroundColor,
                    },
                  ]}
                ></View>
                <View
                  style={grayColoringBoxStyles.smallnavbariconselected}
                ></View>
                <View
                  style={[
                    grayColoringBoxStyles.smallnavbaricon,
                    !showNavTextToggle && {
                      backgroundColor:
                        grayColoringBoxStyles.smallnavbar.backgroundColor,
                    },
                  ]}
                ></View>
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.toggleContainer}>
          <Text
            style={[
              styles.toggleLabel,
              { color: themeColors.onSurfaceVariant },
            ]}
          >
            Navigation bar background color
          </Text>
          <Switch
            value={navToggle}
            onValueChange={setnavToggle}
            trackColor={{
              false: themeColors.surfaceVariant,
              true: themeColors.primaryContainer,
            }}
            thumbColor={
              navToggle ? themeColors.primary : themeColors.onSurfaceVariant
            }
          />
        </View>
        <View style={styles.toggleContainertwo}>
          <Text
            style={[
              styles.toggleLabel,
              { color: themeColors.onSurfaceVariant },
            ]}
          >
            Show navigation text
          </Text>
          <Switch
            value={showNavTextToggle}
            onValueChange={setShowNavTextToggle}
            trackColor={{
              false: themeColors.surfaceVariant,
              true: themeColors.primaryContainer,
            }}
            thumbColor={
              showNavTextToggle
                ? themeColors.primary
                : themeColors.onSurfaceVariant
            }
          />
        </View>
        <View style={styles.bottomRow}>
          <View>
            <TouchableOpacity
              style={[
                styles.iLikeThis,
                { backgroundColor: themeColors.primaryContainer },
              ]}
              onPress={async () => {
                try {
                  await saveThemeSettings(
                    currentTheme,
                    navToggle,
                    showNavTextToggle
                  );

                  await refreshTheme();
                  if (onLikeThis) onLikeThis();
                  console.log("Theme settings saved successfully");
                } catch (error) {
                  console.error("Failed to save theme settings:", error);
                }
              }}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: themeColors.onSecondaryContainer },
                ]}
              >
                I like this
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const coloringBoxStyles = StyleSheet.create({
  scrollContainer: {
    marginTop: 0,
    marginBottom: 24,
  },
  coloringBoxesRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: SPACING.xxl * 2,
    width: 440,
    height: 250,
  },
  coloringBoxWithGap: {
    marginRight: 20,
  },
  smallnavbaricon: {
    width: 20,
    height: 10,
    backgroundColor: COLORS.onSurfaceVariant,
    borderRadius: RADIUS.full,
    marginHorizontal: 0,
    opacity: 0.5,
  },
  smallnavbariconselected: {
    width: 40,
    height: 10,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.full,
    marginHorizontal: SPACING.sm,
  },
  smallnavbar: {
    width: "100%",
    height: 20,
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    flexDirection: "row",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    bottom: 0,
  },
  smallbottomleftbutton: {
    width: 25,
    height: 25,
    backgroundColor: COLORS.primaryContainer,
    borderRadius: RADIUS.sm,
    position: "absolute",
    bottom: SPACING.xl - 2,
    right: SPACING.sm,
  },
  smallerrow: {
    width: "50%",
    opacity: 0.9,
    height: 15,
    backgroundColor: "#fff",
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
  },
  smallrow: {
    opacity: 0.6,
    width: "100%",
    height: 15,
    backgroundColor: "#fff",
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  smallrows: {
    width: "80%",
    height: 100,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  smallerColoringBox: {
    width: "95%",
    height: "95%",
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    marginVertical: SPACING.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  coloringBox: {
    width: "40%",
    height: 220,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginVertical: SPACING.sm,
    opacity: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBox: {
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
});

const lightColoringBoxStyles = StyleSheet.create({
  coloringBoxWithGap: {
    marginRight: 20,
  },
  smallnavbaricon: {
    width: 20,
    height: 10,
    backgroundColor: LightColors.onSurfaceVariant,
    borderRadius: LightRadius.full,
    marginHorizontal: 0,
    opacity: 0.5,
  },
  smallnavbariconselected: {
    width: 40,
    height: 10,
    backgroundColor: LightColors.primaryContainer,
    borderRadius: LightRadius.full,
    marginHorizontal: LightSpacing.sm,
  },
  smallnavbar: {
    width: "100%",
    height: 20,
    backgroundColor: LightColors.surface,
    borderBottomLeftRadius: LightRadius.xl,
    borderBottomRightRadius: LightRadius.xl,
    flexDirection: "row",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    bottom: 0,
  },
  smallbottomleftbutton: {
    width: 25,
    height: 25,
    backgroundColor: LightColors.primaryContainer,
    borderRadius: LightRadius.sm,
    position: "absolute",
    bottom: LightSpacing.xl - 2,
    right: LightSpacing.sm,
  },
  smallerrow: {
    width: "50%",
    opacity: 0.9,
    height: 15,
    backgroundColor: "#454242ff",
    borderRadius: LightRadius.sm,
    marginBottom: LightSpacing.md,
  },
  smallrow: {
    opacity: 0.6,
    width: "100%",
    height: 15,
    backgroundColor: "#171515ff",
    borderRadius: LightRadius.sm,
    marginBottom: LightSpacing.sm,
  },
  smallrows: {
    width: "80%",
    height: 100,
    borderRadius: LightRadius.md,
    marginBottom: LightSpacing.md,
  },
  smallerColoringBox: {
    width: "95%",
    height: "95%",
    backgroundColor: LightColors.background,
    borderRadius: LightRadius.xl,
    marginVertical: LightSpacing.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  coloringBox: {
    width: "40%",
    height: 220,
    backgroundColor: LightColors.surface,
    borderRadius: LightRadius.xl,
    marginVertical: LightSpacing.sm,
    opacity: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBox: {
    borderWidth: 3,
    borderColor: LightColors.primary,
  },
});

const grayColoringBoxStyles = StyleSheet.create({
  smallnavbaricon: {
    width: 20,
    height: 10,
    backgroundColor: GrayColors.onSurfaceVariant,
    borderRadius: GrayRadius.full,
    marginHorizontal: 0,
    opacity: 0.5,
  },
  smallnavbariconselected: {
    width: 40,
    height: 10,
    backgroundColor: GrayColors.primaryContainer,
    borderRadius: GrayRadius.full,
    marginHorizontal: GraySpacing.sm,
  },
  smallnavbar: {
    width: "100%",
    height: 20,
    backgroundColor: GrayColors.surface,
    borderBottomLeftRadius: GrayRadius.xl,
    borderBottomRightRadius: GrayRadius.xl,
    flexDirection: "row",
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    bottom: 0,
  },
  smallbottomleftbutton: {
    width: 25,
    height: 25,
    backgroundColor: GrayColors.primaryContainer,
    borderRadius: GrayRadius.sm,
    position: "absolute",
    bottom: GraySpacing.xl - 2,
    right: GraySpacing.sm,
  },
  smallerrow: {
    width: "50%",
    opacity: 0.9,
    height: 15,
    backgroundColor: "#fff",
    borderRadius: GrayRadius.sm,
    marginBottom: GraySpacing.md,
  },
  smallrow: {
    opacity: 0.6,
    width: "100%",
    height: 15,
    backgroundColor: "#fff",
    borderRadius: GrayRadius.sm,
    marginBottom: GraySpacing.sm,
  },
  smallrows: {
    width: "80%",
    height: 100,
    borderRadius: GrayRadius.md,
    marginBottom: GraySpacing.md,
  },
  smallerColoringBox: {
    width: "95%",
    height: "95%",
    backgroundColor: GrayColors.background,
    borderRadius: GrayRadius.xl,
    marginVertical: GraySpacing.sm,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  coloringBox: {
    width: "40%",
    height: 220,
    backgroundColor: GrayColors.surface,
    borderRadius: GrayRadius.xl,
    marginVertical: GraySpacing.sm,
    opacity: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedBox: {
    borderWidth: 3,
    borderColor: GrayColors.primary,
  },
});

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  main: {
    marginTop: SPACING.xxl + 12,
    alignSelf: "flex-start",
    width: "100%",
  },
  top: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    alignItems: "flex-start",
    position: "relative",
    width: "100%",
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
    justifyContent: "flex-start",
    alignItems: "flex-start",
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    width: "100%",
  },
  iLikeThis: {
    backgroundColor: COLORS.primaryContainer,
    paddingHorizontal: SPACING.xxl + SPACING.md,
    paddingVertical: SPACING.sm + 5,
    borderRadius: RADIUS.full,
  },
  iconatBox: {
    filter: "brightness(100)",
  },
  welcomeText: {
    fontFamily: "Inter_400Regular",
    fontSize: 36,
    color: COLORS.onSurface,
    marginBottom: SPACING.md,
    textAlign: "left",
    alignSelf: "flex-start",
    width: "100%",
  },
  descText: {
    fontFamily: "Inter_400Regular",
    ...TYPOGRAPHY.titleMedium,
    color: COLORS.onSurfaceVariant,
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 0,
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xs,
  },
  toggleContainertwo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 0,
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.xs,
  },
  toggleLabel: {
    fontFamily: "Inter_400Regular",
    ...TYPOGRAPHY.bodyMedium,
    color: COLORS.onSurfaceVariant,
  },
  bottomRow: {
    flexDirection: "column",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: SPACING.md,
    width: "100%",
  },
  skipButton: {
    position: "absolute",
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
    color: COLORS.onPrimary,
    opacity: 0.7,
    textAlign: "left",
  },
  permsB: {
    backgroundColor: COLORS.primaryContainer,
    width: "100%",
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + SPACING.xs,
    borderRadius: RADIUS.full,
  },
  permsBText: {
    fontFamily: "Inter_500Medium",
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.onPrimary,
    textAlign: "center",
  },
  buttonText: {
    fontFamily: "Inter_500Medium",
    ...TYPOGRAPHY.labelLarge,
    color: COLORS.onSurface,
  },
  icon: {
    left: 0,
    paddingTop: SPACING.xl,
    position: "absolute",
  },
});
