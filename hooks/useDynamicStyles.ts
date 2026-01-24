import { useMemo, useContext } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { DynamicThemeContext } from "../contexts/DynamicThemeContext";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";

export function useDynamicColors() {
  const dynamicTheme = useContext(DynamicThemeContext);
  const { themeVersion } = useTheme();

  if (dynamicTheme?.hasPalette && dynamicTheme?.dynamicColors) {
    return {
      ...COLORS,
      primary: dynamicTheme.dynamicColors.primary,
      secondary: dynamicTheme.dynamicColors.secondary,
      background: dynamicTheme.dynamicColors.background,
      surface: dynamicTheme.dynamicColors.surface,
      onSurface: dynamicTheme.dynamicColors.onSurface,
    };
  }

  void themeVersion;
  return COLORS;
}

/**
 * Hook that creates dynamic styles that update when the theme changes.
 * Use this instead of StyleSheet.create() for styles that depend on COLORS ( or similars in the future :) ).
 *
 * @example
 * const styles = useDynamicStyles(() => ({
 *   container: {
 *     backgroundColor: COLORS.background,
 *     padding: SPACING.md,
 *   },
 *   text: {
 *     color: COLORS.onSurface,
 *   },
 * }));
 */
export function useDynamicStyles<T extends Record<string, any>>(
  styleFactory: () => T
): T {
  const { themeVersion } = useTheme();
  const dynamicColors = useDynamicColors();

  const colorKey = useMemo(() => {
    return JSON.stringify({
      primary: dynamicColors.primary,
      secondary: dynamicColors.secondary,
      background: dynamicColors.background,
      surface: dynamicColors.surface,
      onSurface: dynamicColors.onSurface,
    });
  }, [
    dynamicColors.primary,
    dynamicColors.secondary,
    dynamicColors.background,
    dynamicColors.surface,
    dynamicColors.onSurface,
  ]);

  return useMemo(() => {
    const styleObject = styleFactory();
    return StyleSheet.create(styleObject);
  }, [themeVersion, colorKey]);
}

export function useThemeValues() {
  const { themeVersion } = useTheme();
  const dynamicColors = useDynamicColors();

  return useMemo(
    () => ({
      COLORS: dynamicColors,
      SPACING,
      RADIUS,
      TYPOGRAPHY,
    }),
    [themeVersion, dynamicColors]
  );
}
