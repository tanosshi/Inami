import "../utils/polyfills";

import React, { useEffect, useMemo } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationProvider } from "../components/NotificationProvider";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

import {
  useFonts,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import * as SplashScreen from "expo-splash-screen";
import { COLORS } from "../constants/theme";
import { useSongStore } from "../store/songStore";
import { usePlaylistStore } from "../store/playlistStore";

import {
  getAllSongs,
  getAllPlaylists,
  getStats,
  getThemeSettings,
  getAllSettings,
} from "../utils/database";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { isThemeLoaded, themeVersion } = useTheme();
  const initializeSongStore = useSongStore((state) => state.initializeStore);
  const initializePlaylistStore = usePlaylistStore(
    (state) => state.initializeStore
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: COLORS.background,
        },
        stackContent: {
          backgroundColor: COLORS.background,
        },
      }),
    [themeVersion]
  );

  useEffect(() => {
    const initApp = async () => {
      await initializeSongStore();
      await initializePlaylistStore();

      if (fontsLoaded && isThemeLoaded) {
        SplashScreen.hideAsync();
      }

      // Log the entire database to the console (debug prupose only)
      try {
        const [songs, playlists, stats, theme, settings] = await Promise.all([
          getAllSongs(),
          getAllPlaylists(),
          getStats(),
          getThemeSettings(),
          getAllSettings(),
        ]);

        console.log("[Database] Settings:", JSON.stringify(settings, null, 2));
        console.log("[Database] Theme:", JSON.stringify(theme, null, 2));
        console.log("[Database] Stats:", JSON.stringify(stats, null, 2));
        console.log("[Database] Songs:", JSON.stringify(songs, null, 2));
        console.log(
          "[Database] Playlists:",
          JSON.stringify(playlists, null, 2)
        );
      } catch (e) {
        console.warn("[Database] Could not log database:", e);
      }
    };

    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded, isThemeLoaded]);

  if (!fontsLoaded || !isThemeLoaded) {
    return null;
  }

  const statusBarStyle =
    COLORS.background === "#000000" || COLORS.background === "#121212"
      ? "light"
      : "dark";

  return (
    <GestureHandlerRootView style={dynamicStyles.container}>
      <SafeAreaProvider>
        <NotificationProvider>
          <StatusBar style={statusBarStyle} />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: dynamicStyles.stackContent,
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="player"
              options={{
                presentation: "modal",
                animation: "slide_from_bottom",
              }}
            />
            <Stack.Screen
              name="playlist/[id]"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                presentation: "card",
                animation: "slide_from_right",
              }}
            />
          </Stack>
        </NotificationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutContent />
    </ThemeProvider>
  );
}
