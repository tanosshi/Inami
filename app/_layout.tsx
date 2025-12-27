import "../utils/polyfills";

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationProvider } from "../components/NotificationProvider";

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import * as SplashScreen from "expo-splash-screen";
import { COLORS } from "../constants/theme";
import { useSongStore } from "../store/songStore";
import { usePlaylistStore } from "../store/playlistStore";

import { getAllSongs, getAllPlaylists, getStats } from "../utils/database";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const initializeSongStore = useSongStore((state) => state.initializeStore);
  const initializePlaylistStore = usePlaylistStore(
    (state) => state.initializeStore
  );

  useEffect(() => {
    const initApp = async () => {
      await initializeSongStore();
      await initializePlaylistStore();

      if (fontsLoaded) {
        SplashScreen.hideAsync();
      }

      // Log the entire database to the console (debug prupose only)
      try {
        const [songs, playlists, stats] = await Promise.all([
          getAllSongs(),
          getAllPlaylists(),
          getStats(),
        ]);

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
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NotificationProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
