/**
 * Blends two hex colors together with a given ratio
 * @param color1 - First hex color (with or without #)
 * @param color2 - Second hex color (with or without #)
 * @param ratio - Blend ratio (0-1), where 0 = 100% color1, 1 = 100% color2
 * @returns Blended hex color string
 */
export const blendColors = (
  color1: string,
  color2: string,
  ratio: number = 0.1
): string => {
  const c1 = color1.replace("#", "");
  const c2 = color2.replace("#", "");

  const r1 = parseInt(c1.substr(0, 2), 16);
  const g1 = parseInt(c1.substr(2, 2), 16);
  const b1 = parseInt(c1.substr(4, 2), 16);

  const r2 = parseInt(c2.substr(0, 2), 16);
  const g2 = parseInt(c2.substr(2, 2), 16);
  const b2 = parseInt(c2.substr(4, 2), 16);

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

/**
 * Converts a hex color to RGBA string
 * @param hex - Hex color string (with or without #)
 * @param alpha - Alpha value (0-1)
 * @returns RGBA color string
 */
export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Lightens a hex color by a given percentage
 * @param hex - Hex color string
 * @param percent - Percentage to lighten (0-100)
 * @returns Lightened hex color
 */
export const lightenColor = (hex: string, percent: number): string => {
  const cleanHex = hex.replace("#", "");
  const r = Math.min(
    255,
    parseInt(cleanHex.substr(0, 2), 16) + (255 * percent) / 100
  );
  const g = Math.min(
    255,
    parseInt(cleanHex.substr(2, 2), 16) + (255 * percent) / 100
  );
  const b = Math.min(
    255,
    parseInt(cleanHex.substr(4, 2), 16) + (255 * percent) / 100
  );

  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
    .toString(16)
    .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
};

/**
 * Darkens a hex color by a given percentage
 * @param hex - Hex color string
 * @param percent - Percentage to darken (0-100)
 * @returns Darkened hex color
 */
export const darkenColor = (hex: string, percent: number): string => {
  const cleanHex = hex.replace("#", "");
  const r = Math.max(
    0,
    parseInt(cleanHex.substr(0, 2), 16) - (255 * percent) / 100
  );
  const g = Math.max(
    0,
    parseInt(cleanHex.substr(2, 2), 16) - (255 * percent) / 100
  );
  const b = Math.max(
    0,
    parseInt(cleanHex.substr(4, 2), 16) - (255 * percent) / 100
  );

  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g)
    .toString(16)
    .padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
};

/**
 * Determines if a color is too bright/white based on its brightness
 * @param color - Hex color string (with or without #)
 * @returns True if the color is too bright (brightness > 0.7)
 */
export const isTooWhiteish = (color: string): boolean => {
  const hex = color.replace("#", "");

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return brightness > 0.7;
};

/**
 * Make a color more pastel / softer by blending towards white and ensuring
 * adequate brightness. Returns a hex color string.
 */
export const pastelify = (hex: string): string => {
  const cleanHex = hex.replace("#", "");
  // handle possible 8-character (with alpha) hex
  const main = cleanHex.length === 8 ? cleanHex.substr(0, 6) : cleanHex;

  let r = parseInt(main.substr(0, 2), 16);
  let g = parseInt(main.substr(2, 2), 16);
  let b = parseInt(main.substr(4, 2), 16);

  // Blend towards white (~40%) to soften
  r = Math.round(r * 0.6 + 255 * 0.4);
  g = Math.round(g * 0.6 + 255 * 0.4);
  b = Math.round(b * 0.6 + 255 * 0.4);

  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  // If still too dark, lighten a bit more
  if (brightness < 150) {
    r = Math.round(r * 0.7 + 255 * 0.3);
    g = Math.round(g * 0.7 + 255 * 0.3);
    b = Math.round(b * 0.7 + 255 * 0.3);
  }

  const result = `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;

  // Preserve alpha if provided
  if (cleanHex.length === 8) {
    const alpha = cleanHex.substr(6, 2);
    return `${result}${alpha}`;
  }

  return result;
};
