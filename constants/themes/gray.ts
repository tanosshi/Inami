export const COLORS = {
  background: "#121212",
  surface: "#1e1e1e",
  surfaceVariant: "#2a2a2a",
  surfaceContainer: "#1a1a1a",
  surfaceContainerHigh: "#242424",
  surfaceContainerHighest: "#2e2e2e",

  primary: "#fbc02d",
  primaryContainer: "#695f00",
  onPrimary: "#cecdc5ff",
  onPrimaryContainer: "#ffeb9c",

  secondary: "#ccc2a7",
  secondaryContainer: "#4b4330",
  onSecondary: "#322f1d",
  onSecondaryContainer: "#e9dec2",

  tertiary: "#a4cfb3",
  tertiaryContainer: "#2d4f3b",
  onTertiary: "#173726",
  onTertiaryContainer: "#c0ebce",

  error: "#ffb4ab",
  errorContainer: "#93000a",
  onError: "#690005",
  onErrorContainer: "#ffdad6",

  onBackground: "#e6e1e5",
  onSurface: "#e6e1e5",
  onSurfaceVariant: "#c9c5ca",

  outline: "#938f94",
  outlineVariant: "#49454f",
  inverseSurface: "#e6e1e5",
  inverseOnSurface: "#313033",
  inversePrimary: "#7d6400",

  liked: "#f2b8b5",
  likedContainer: "#8c1d18",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 28,
  full: 9999,
};

export const TYPOGRAPHY = {
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: "400" as const,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: "400" as const,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: "400" as const,
  },
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "400" as const,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "400" as const,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "400" as const,
  },
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "500" as const,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "500" as const,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    letterSpacing: 0.4,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
};

export const ANIMATION = {
  // "fade" | "shift" | "none"
  tabTransition: "fade" as const,
};

export const TAB_CONFIG = {
  forYou: {
    name: "For You",
    icon: "face" as const, // home?, maybe.
  },
  songs: {
    name: "Tracks",
    icon: "library-music" as const,
  },
  playlists: {
    name: "Playlists",
    icon: "queue-music" as const,
  },
  discover: {
    name: "Discover",
    icon: "auto-awesome" as const,
  },
};
