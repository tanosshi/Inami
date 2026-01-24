import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { usePlayerStore } from "../store/playerStore";
import { useTheme } from "../contexts/ThemeContext";
import { COLORS, getCurrentTheme } from "../constants/theme";
import { pastelify } from "../utils/colorUtils";
import { getSetting } from "../utils/database";

interface DynamicColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  onSurface: string;
}

interface DynamicThemeContextType {
  dynamicColors: DynamicColors;
  hasPalette: boolean;
}

export const DynamicThemeContext = createContext<
  DynamicThemeContextType | undefined
>(undefined);

export const useDynamicTheme = () => {
  const context = useContext(DynamicThemeContext);
  if (!context)
    throw new Error("useDynamicTheme must be used within DynamicThemeProvider");
  return context;
};

interface DynamicThemeProviderProps {
  children: ReactNode;
}

export const DynamicThemeProvider: React.FC<DynamicThemeProviderProps> = ({
  children,
}) => {
  const { currentSong } = usePlayerStore();
  const [albumCoverAccentEnabled, setAlbumCoverAccentEnabled] =
    useState<boolean>(false);
  const [dynamicColors, setDynamicColors] = useState<DynamicColors>({
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    onSurface: COLORS.onSurface,
  });
  const [hasPalette, setHasPalette] = useState(false);
  const { themeVersion } = useTheme();

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const enabled = await getSetting("album_cover_accent");
        setAlbumCoverAccentEnabled(enabled === true);
      } catch (error) {
        console.warn("Failed to load album_cover_accent setting:", error);
        setAlbumCoverAccentEnabled(false);
      }
    };
    loadSetting();
  }, []);

  const updateDynamicColors = useCallback(
    (song: any) => {
      if (
        song?.palette &&
        Array.isArray(song.palette) &&
        song.palette.length > 0 &&
        albumCoverAccentEnabled
      ) {
        const currentTheme = getCurrentTheme();
        const isDarkMode =
          currentTheme === "Black" ||
          currentTheme === "Dark" ||
          currentTheme === "Gray";

        const primaryColor = pastelify(song.palette[0]);
        const secondaryColor = song.palette[1]
          ? pastelify(song.palette[1])
          : primaryColor;

        const surfaceColor = getAppropriateSurfaceColor(
          song.palette,
          isDarkMode
        );
        const onSurfaceColor = getAppropriateTextColor(surfaceColor);

        let backgroundColor = primaryColor;
        if (isDarkMode && getColorBrightness(primaryColor) < 50)
          backgroundColor = adjustColorBrightness(primaryColor, 0.3);

        setDynamicColors({
          primary: primaryColor,
          secondary: secondaryColor,
          background: backgroundColor,
          surface: surfaceColor,
          onSurface: onSurfaceColor,
        });
        setHasPalette(true);
      } else {
        setDynamicColors({
          primary: COLORS.primary,
          secondary: COLORS.secondary,
          background: COLORS.background,
          surface: COLORS.surface,
          onSurface: COLORS.onSurface,
        });
        setHasPalette(false);
      }
    },
    [albumCoverAccentEnabled]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateDynamicColors(currentSong);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [currentSong, updateDynamicColors, themeVersion]);

  return (
    <DynamicThemeContext.Provider value={{ dynamicColors, hasPalette }}>
      {children}
    </DynamicThemeContext.Provider>
  );
};

function getColorBrightness(hex: string): number {
  const color = hex.replace(/^#/, "");
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function getAppropriateSurfaceColor(
  palette: string[],
  isDarkMode: boolean
): string {
  if (palette.length === 0) return isDarkMode ? COLORS.surface : COLORS.surface;

  const sortedByBrightness = palette
    .map((color) => ({ color, brightness: getColorBrightness(color) }))
    .sort((a, b) =>
      isDarkMode ? b.brightness - a.brightness : a.brightness - b.brightness
    );

  return sortedByBrightness[0].color;
}

function getAppropriateTextColor(surfaceColor: string): string {
  const brightness = getColorBrightness(surfaceColor);
  return brightness > 128 ? "#000000" : "#FFFFFF";
}

function adjustColorBrightness(hex: string, percent: number): string {
  const color = hex.replace(/^#/, "");

  const num = parseInt(color, 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
