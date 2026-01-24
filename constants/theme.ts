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
};

export const getCurrentTheme = (): string => {
  return currentThemeName;
};

applyTheme("Black");

export { COLORS, SPACING, RADIUS, TYPOGRAPHY, ANIMATION, TAB_CONFIG };
