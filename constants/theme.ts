import {
  COLORS as LightColors,
  SPACING as LightSpacing,
  RADIUS as LightRadius,
  TYPOGRAPHY as LightTypography,
  ANIMATION as LightAnimation,
  TAB_CONFIG as LightTabConfig,
} from "./themes/light";

import {
  COLORS as BlackColors,
  SPACING as BlackSpacing,
  RADIUS as BlackRadius,
  TYPOGRAPHY as BlackTypography,
  ANIMATION as BlackAnimation,
  TAB_CONFIG as BlackTabConfig,
} from "./themes/black";

import {
  COLORS as GrayColors,
  SPACING as GraySpacing,
  RADIUS as GrayRadius,
  TYPOGRAPHY as GrayTypography,
  ANIMATION as GrayAnimation,
  TAB_CONFIG as GrayTabConfig,
} from "./themes/gray";
import { pastelify } from "../utils/colorUtils";

let COLORS: typeof BlackColors = BlackColors;
let SPACING: typeof BlackSpacing = BlackSpacing;
let RADIUS: typeof BlackRadius = BlackRadius;
let TYPOGRAPHY: typeof BlackTypography = BlackTypography;
let ANIMATION: typeof BlackAnimation = BlackAnimation;
let TAB_CONFIG: typeof BlackTabConfig = BlackTabConfig;

let currentThemeName: string = "Black";

export const getCurrentTheme = (): string => {
  return currentThemeName;
};

let currentFontFamilyName:
  | "inter"
  | "work_sans"
  | "figtree"
  | "comic_neue"
  | "proxima_nova" = "inter";

const FONT_MAP = {
  inter: {
    300: "Inter_300Light",
    400: "Inter_400Regular",
    500: "Inter_500Medium",
    600: "Inter_600SemiBold",
    700: "Inter_700Bold",
  },
  work_sans: {
    300: "WorkSans_300Light",
    400: "WorkSans_400Regular",
    500: "WorkSans_500Medium",
    600: "WorkSans_600SemiBold",
    700: "WorkSans_700Bold",
  },
  figtree: {
    300: "Figtree_300Light",
    400: "Figtree_400Regular",
    500: "Figtree_500Medium",
    600: "Figtree_600SemiBold",
    700: "Figtree_700Bold",
  },
  comic_neue: {
    300: "ComicNeue_300Light",
    400: "ComicNeue_400Regular",
    500: "ComicNeue_400Regular",
    600: "ComicNeue_700Bold",
    700: "ComicNeue_700Bold",
  },
  proxima_nova: {
    300: "ProximaNova_Light",
    400: "ProximaNova_Regular",
    500: "ProximaNova_Regular",
    600: "ProximaNova_Semibold",
    700: "ProximaNova_Extrabold",
  },
};

export const applyFont = (
  fontName: "inter" | "work_sans" | "figtree" | "comic_neue" | "proxima_nova"
) => {
  currentFontFamilyName = fontName;
  updateTypographyFonts();
};

export const getFontFamily = (
  weight: "300" | "400" | "500" | "600" | "700"
) => {
  return (
    FONT_MAP[currentFontFamilyName][weight] ||
    FONT_MAP[currentFontFamilyName]["400"]
  );
};

const updateTypographyFonts = () => {
  if (!TYPOGRAPHY) return;
  Object.values(TYPOGRAPHY).forEach((style: any) => {
    if (style && typeof style === "object") {
      const weight = style.fontWeight || "400";
      let weightKey: "300" | "400" | "500" | "600" | "700" = "400";
      if (
        weight === "300" ||
        weight === "bold" ||
        weight === "500" ||
        weight === "600" ||
        weight === "700"
      ) {
        weightKey = weight as any;
        if (weight === "bold") weightKey = "700";
      }
      style.fontFamily = getFontFamily(weightKey);
    }
  });
};

export const getCurrentFont = () => currentFontFamilyName;

export const applyTheme = (themeName: string) => {
  switch (themeName) {
    case "Light":
      COLORS = LightColors;
      SPACING = LightSpacing;
      RADIUS = LightRadius;
      TYPOGRAPHY = LightTypography;
      ANIMATION = LightAnimation;
      TAB_CONFIG = LightTabConfig;
      COLORS.primary = pastelify(COLORS.primary);
      currentThemeName = "Light";
      break;
    case "Gray":
      COLORS = GrayColors;
      SPACING = GraySpacing;
      RADIUS = GrayRadius;
      TYPOGRAPHY = GrayTypography;
      ANIMATION = GrayAnimation;
      TAB_CONFIG = GrayTabConfig;
      COLORS.primary = pastelify(COLORS.primary);
      currentThemeName = "Gray";
      break;
    case "Dark":
    case "Black":
    default:
      COLORS = BlackColors;
      SPACING = BlackSpacing;
      RADIUS = BlackRadius;
      TYPOGRAPHY = BlackTypography;
      ANIMATION = BlackAnimation;
      TAB_CONFIG = BlackTabConfig;
      currentThemeName = "Black";
      break;
  }
  updateTypographyFonts();
};

applyTheme("Black");

export { COLORS, SPACING, RADIUS, TYPOGRAPHY, ANIMATION, TAB_CONFIG };
