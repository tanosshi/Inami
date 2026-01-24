import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import {
  getThemeSettings,
  initDatabase,
  mergeDuplicateArtists,
} from "../utils/database";
import { applyTheme, getCurrentTheme, COLORS } from "../constants/theme";

interface ThemeContextType {
  themeName: string;
  isThemeLoaded: boolean;
  refreshTheme: () => Promise<void>;
  themeVersion: number;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeName, setThemeName] = useState<string>("Black");
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);
  const [themeVersion, setThemeVersion] = useState(0);

  const loadTheme = useCallback(async () => {
    try {
      await initDatabase();

      try {
        await mergeDuplicateArtists();
      } catch {
        console.warn("Error merging duplicate artists:");
      }

      const themeSettings = await getThemeSettings();
      const theme = themeSettings?.theme || "Black";

      applyTheme(theme);
      setThemeName(theme);
      setThemeVersion((prev) => prev + 1);
      setIsThemeLoaded(true);
    } catch (error) {
      console.error("Error loading theme:", error);
      applyTheme("Black");
      setThemeName("Black");
      setThemeVersion((prev) => prev + 1);
      setIsThemeLoaded(true);
    }
  }, []);

  const refreshTheme = useCallback(async () => {
    await loadTheme();
  }, [loadTheme]);

  useEffect(() => {
    loadTheme();
  }, [loadTheme]);

  return (
    <ThemeContext.Provider
      value={{ themeName, isThemeLoaded, refreshTheme, themeVersion }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
