export const COLORS = {
  background: "#ffffff",
  surface: "#fefbf7",
  surfaceVariant: "#faf7f2",
  surfaceContainer: "#fcf9f4",
  surfaceContainerHigh: "#f7f4ef",
  surfaceContainerHighest: "#f2efe9",

  primary: "#f9a825",
  primaryContainer: "#fae8b0ff",
  onPrimary: "#82836dff",
  onPrimaryContainer: "#4a3600",

  secondary: "#6b5f3d",
  secondaryContainer: "#f4ecd8",
  onSecondary: "#ffffff",
  onSecondaryContainer: "#241a00",

  tertiary: "#4f6b3f",
  tertiaryContainer: "#d1f2bb",
  onTertiary: "#ffffff",
  onTertiaryContainer: "#0c1f04",

  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
  onErrorContainer: "#410002",

  onBackground: "#1d1b16",
  onSurface: "#1d1b16",
  onSurfaceVariant: "#4a4739",

  outline: "#7c7767",
  outlineVariant: "#cdc6b4",
  inverseSurface: "#322f29",
  inverseOnSurface: "#f6f0e7",
  inversePrimary: "#ffc107",

  liked: "#d32f2f",
  likedContainer: "#ffdad6",
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
  tabTransition: "fade" as const,
};

export const TAB_CONFIG = {
  forYou: {
    name: "For You",
    icon: "home" as const,
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
  artists: {
    name: "Artists",
    icon: "person" as const,
  },
};
