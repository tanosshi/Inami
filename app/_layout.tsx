import "../utils/polyfills";

import React, { useEffect, useMemo } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationProvider } from "../components/NotificationProvider";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { DynamicThemeProvider } from "../contexts/DynamicThemeContext";
import PlayerOverlay from "../components/player/Player";

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

import { cleanupOrphanedFiles } from "../utils/imageValidation";
import { startPeriodicCleanup } from "../utils/periodicCleanup";

import { getAllSongs, getAllArtists, getSetting } from "../utils/database";
import { scanEnabledFoldersOnStartup } from "../utils/mediaScanner";

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

      try {
        const [songs, artists] = await Promise.all([
          getAllSongs(),
          getAllArtists(),
        ]);

        // Backfill, needs to be fixed later
        try {
          const enabled = await getSetting("enable_metadata_fetch");
          if (!enabled) {
            console.log(
              "[Database] Skipping metadata backfill because enable_metadata_fetch is not true"
            );
          } else {
            const { fetchAndStoreArtistMetadata } = await import(
              "../utils/artistMetadata"
            );
            const { fetchAndStoreSongMetadata } = await import(
              "../utils/songMetadata"
            );

            if (artists && artists.length > 0) {
              for (const a of artists) {
                try {
                  const name = (a as any)?.name;
                  const genres = (a as any)?.genres;
                  const lastRelease = (a as any)?.last_release_date;
                  const image =
                    (a as any)?.image_url || (a as any)?.fallback_url;
                  if (!name) continue;

                  if (!genres || !lastRelease || !image) {
                    await fetchAndStoreArtistMetadata(name);

                    const sampleSong = (songs || []).find(
                      (s: any) =>
                        s &&
                        s.artist &&
                        String(s.artist).toLowerCase().trim() ===
                          String(name).toLowerCase().trim()
                    );
                    if (sampleSong) {
                      await fetchAndStoreSongMetadata(
                        sampleSong.title || sampleSong.name || "",
                        name
                      );
                    }
                  }
                } catch (err) {
                  console.warn(
                    `[Database] Backfill failed for artist ${
                      (a as any)?.name
                    }:`,
                    err
                  );
                }
              }
            }
          }
        } catch {}
      } catch (e) {
        console.warn("[Database] Could not log database:", e);
      }

      try {
        scanEnabledFoldersOnStartup().catch((e) =>
          console.warn("Startup folder scan error:", e)
        );
        await cleanupOrphanedFiles();
        startPeriodicCleanup();
      } catch {}
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
          <PlayerOverlay />
        </NotificationProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <DynamicThemeProvider>
        <RootLayoutContent />
      </DynamicThemeProvider>
    </ThemeProvider>
  );
}
