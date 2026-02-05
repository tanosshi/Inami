import "../utils/polyfills";

import React, { useEffect, useMemo } from "react";
import { Stack, useNavigation, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, BackHandler, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NotificationProvider } from "../components/NotificationProvider";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { DynamicThemeProvider } from "../contexts/DynamicThemeContext";
import PlayerOverlay from "../components/player/Player";

import { useFonts } from "expo-font";
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  WorkSans_300Light,
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from "@expo-google-fonts/work-sans";
import {
  Figtree_300Light,
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import {
  ComicNeue_300Light,
  ComicNeue_400Regular,
  ComicNeue_700Bold,
} from "@expo-google-fonts/comic-neue";
import { applyFont, COLORS } from "../constants/theme";

import * as SplashScreen from "expo-splash-screen";
import { useSongStore } from "../store/songStore";
import { usePlaylistStore } from "../store/playlistStore";
import { usePlayerStore } from "../store/playerStore";

import { cleanupOrphanedFiles } from "../utils/imageValidation";
import { startPeriodicCleanup } from "../utils/periodicCleanup";
import { syncLocalLrcOnStartup } from "../utils/localLrcSync";

import { getAllSongs, getAllArtists, getSetting } from "../utils/database";
import { scanEnabledFoldersOnStartup } from "../utils/mediaScanner";

SplashScreen.preventAutoHideAsync();

function RootLayoutContent() {
  const navigation = useNavigation();
  const pathname = usePathname();
  const router = useRouter();
  const { showPlayer, hidePlayerAnimated, showComments, hideCommentsAnimated } =
    usePlayerStore();
  const { isThemeLoaded, themeVersion } = useTheme();
  const [selectedFont, setSelectedFont] = React.useState("inter");

  useEffect(() => {
    const loadFontSetting = async () => {
      try {
        const savedFont = await getSetting("current_font_family");
        if (savedFont && typeof savedFont === "string") {
          setSelectedFont(savedFont);
          applyFont(savedFont as any);
        }
      } catch (e) {
        console.warn("Failed to load saved font in layout:", e);
      }
    };
    loadFontSetting();
  }, [themeVersion]);

  const fontMap = useMemo(() => {
    const isWorkSans = selectedFont === "work_sans";
    const isFigtree = selectedFont === "figtree";
    const isComicNeue = selectedFont === "comic_neue";
    const isProximaNova = selectedFont === "proxima_nova";

    return {
      Inter_300Light,
      Inter_400Regular,
      Inter_500Medium,
      Inter_600SemiBold,
      Inter_700Bold,
      WorkSans_300Light,
      WorkSans_400Regular,
      WorkSans_500Medium,
      WorkSans_600SemiBold,
      WorkSans_700Bold,
      Figtree_300Light,
      Figtree_400Regular,
      Figtree_500Medium,
      Figtree_600SemiBold,
      Figtree_700Bold,
      ComicNeue_300Light,
      ComicNeue_400Regular,
      ComicNeue_700Bold,

      ProximaNova_Light: require("../assets/fonts/ProxNova/Proxima Nova Light.ttf"),
      ProximaNova_Regular: require("../assets/fonts/ProxNova/Proxima Nova Regular.ttf"),
      ProximaNova_Semibold: require("../assets/fonts/ProxNova/Proxima Nova Semibold.ttf"),
      ProximaNova_Extrabold: require("../assets/fonts/ProxNova/Proxima Nova Extrabold.ttf"),

      Inter_300Light_Alias: isWorkSans
        ? WorkSans_300Light
        : isFigtree
        ? Figtree_300Light
        : isComicNeue
        ? ComicNeue_300Light
        : isProximaNova
        ? "ProximaNova_Light"
        : Inter_300Light,
      Inter_400Regular_Alias: isWorkSans
        ? WorkSans_400Regular
        : isFigtree
        ? Figtree_400Regular
        : isComicNeue
        ? ComicNeue_400Regular
        : isProximaNova
        ? "ProximaNova_Regular"
        : Inter_400Regular,
      Inter_500Medium_Alias: isWorkSans
        ? WorkSans_500Medium
        : isFigtree
        ? Figtree_500Medium
        : isComicNeue
        ? ComicNeue_400Regular
        : isProximaNova
        ? "ProximaNova_Regular"
        : Inter_500Medium,
      Inter_600SemiBold_Alias: isWorkSans
        ? WorkSans_600SemiBold
        : isFigtree
        ? Figtree_600SemiBold
        : isComicNeue
        ? ComicNeue_700Bold
        : isProximaNova
        ? "ProximaNova_Semibold"
        : Inter_600SemiBold,
      Inter_700Bold_Alias: isWorkSans
        ? WorkSans_700Bold
        : isFigtree
        ? Figtree_700Bold
        : isComicNeue
        ? ComicNeue_700Bold
        : isProximaNova
        ? "ProximaNova_Extrabold"
        : Inter_700Bold,
    };
  }, [selectedFont]);

  const finalFontMap = useMemo(() => {
    const map: any = {};
    Object.entries(fontMap).forEach(([key, value]) => {
      const finalKey = key.endsWith("_Alias") ? key.replace("_Alias", "") : key;
      map[finalKey] = value;
    });
    return map;
  }, [fontMap]);

  const [fontsLoaded] = useFonts(finalFontMap);

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
    []
  );

  useEffect(() => {
    const initApp = async () => {
      await initializeSongStore();
      await initializePlaylistStore();

      try {
        const savedFont = await getSetting("current_font_family");
        if (savedFont && typeof savedFont === "string") {
          applyFont(savedFont as any);
        }
      } catch (e) {
        console.warn("Failed to load saved font:", e);
      }

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
        await scanEnabledFoldersOnStartup().catch((e) =>
          console.warn("Startup folder scan error:", e)
        );

        await cleanupOrphanedFiles();

        await initializeSongStore();

        startPeriodicCleanup();

        syncLocalLrcOnStartup().catch();
      } catch (e) {
        console.warn("Startup maintenance error:", e);
      }
    };

    initApp();

    if (Platform.OS !== "web" && fontsLoaded && isThemeLoaded) {
      const serverTimer = setTimeout(async () => {
        const { startMusicControlServer } = await import(
          "../utils/musicServer"
        );
        startMusicControlServer();
      }, 5000);
      return () => clearTimeout(serverTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded, isThemeLoaded]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (showComments) {
          hideCommentsAnimated();
          return true;
        }
        if (showPlayer) {
          hidePlayerAnimated();
          return true;
        }
        if (
          pathname === "/settings-overlay" ||
          pathname === "/history-overlay"
        ) {
          router.back();
          return true;
        }
        if (pathname === "/settings") {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            router.replace("/");
          }
          return true;
        }
        if (pathname.startsWith("/settings/")) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            router.replace("/settings");
          }
          return true;
        }
        if (pathname.startsWith("/a") || pathname.startsWith("/[")) {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            router.replace("/");
          }
        }
        return !navigation.canGoBack();
      }
    );

    return () => backHandler.remove();
  }, [
    navigation,
    pathname,
    showPlayer,
    hidePlayerAnimated,
    router,
    showComments,
    hideCommentsAnimated,
  ]);

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
            <Stack.Screen
              name="settings-overlay"
              options={{
                presentation: "transparentModal",
                animation: "none",
              }}
            />
            <Stack.Screen
              name="history-overlay"
              options={{
                presentation: "transparentModal",
                animation: "none",
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
