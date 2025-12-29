import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";

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

  return useMemo(() => {
    const styleObject = styleFactory();
    return StyleSheet.create(styleObject);
  }, [themeVersion]);
}

export function useThemeValues() {
  const { themeVersion } = useTheme();

  return useMemo(
    () => ({
      COLORS,
      SPACING,
      RADIUS,
      TYPOGRAPHY,
    }),
    [themeVersion]
  );
}
