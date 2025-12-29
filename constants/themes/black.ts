export const COLORS = {
  background: "#000000",
  surface: "#1a1c1e",
  surfaceVariant: "#1e2022",
  surfaceContainer: "#121416",
  surfaceContainerHigh: "#1e2022",
  surfaceContainerHighest: "#2a2c2e",

  primary: "#a8c7fa",
  primaryContainer: "#004a77",
  onPrimary: "#003258",
  onPrimaryContainer: "#d1e4ff",

  secondary: "#bec6dc",
  secondaryContainer: "#3b4858",
  onSecondary: "#283141",
  onSecondaryContainer: "#dae2f9",

  tertiary: "#debcdf",
  tertiaryContainer: "#5d3f5f",
  onTertiary: "#44274a",
  onTertiaryContainer: "#fbd7fc",

  error: "#ffb4ab",
  errorContainer: "#93000a",
  onError: "#690005",
  onErrorContainer: "#ffdad6",

  onBackground: "#e3e2e6",
  onSurface: "#e3e2e6",
  onSurfaceVariant: "#c4c6d0",

  outline: "#8e9099",
  outlineVariant: "#44474f",
  inverseSurface: "#e3e2e6",
  inverseOnSurface: "#303033",
  inversePrimary: "#0061a4",

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
