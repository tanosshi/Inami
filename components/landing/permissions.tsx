import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Alert,
  StyleSheet,
  Easing,
  Platform,
  PermissionsAndroid,
} from "react-native";
import { Octicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { requestPermissions as requestStoragePermissions } from "../../utils/mediaScanner";
import {
  checkAllFilesAccess,
  openAllFilesAccessSettings,
} from "../../utils/folderManager";

// Simple notification permission request for Android 13+
async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true;

  if (Platform.Version >= 33) {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  // rest should be automatic
  return true;
}

type FirstProps = {
  onSkip?: () => void;
};

export default function LandingPage({ onSkip }: FirstProps) {
  const themeValues = useThemeValues();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [storageGranted, setStorageGranted] = useState(false);
  const [allFilesGranted, setAllFilesGranted] = useState(false);
  const [isRequestingNotification, setIsRequestingNotification] =
    useState(false);
  const [isRequestingStorage, setIsRequestingStorage] = useState(false);
  const [isRequestingAllFiles, setIsRequestingAllFiles] = useState(false);
  const hasAutoAdvancedRef = useRef(false);
  const needsAllFilesAccess =
    Platform.OS === "android" && Platform.Version >= 30;

  const styles = useDynamicStyles(() => ({
    iconRow: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    main: {
      marginTop: SPACING.xxl + 12,
    },
    icon: {
      left: 0,
      paddingLeft: SPACING.sm + 3,
      paddingTop: SPACING.xl,
      position: "absolute",
    },
    top: {
      marginTop: SPACING.sm,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.sm + 3,
      alignItems: "flex-end" as const,
      position: "relative" as const,
    },
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    flexSpacer: {
      flex: 1,
    },
    bottomSection: {
      flex: 1,
      justifyContent: "flex-start" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    iconatBox: {
      filter: "brightness(100)",
    },
    welcomeText: {
      fontFamily: "Inter_400Regular",
      fontSize: 32,
      color: COLORS.onSurface,
      textAlign: "left" as const,
      alignSelf: "flex-start" as const,
      width: "100%" as const,
    },
    descText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurfaceVariant,
    },
    bottomRow: {
      flexDirection: "column" as const,
      justifyContent: "flex-end" as const,
      alignItems: "center" as const,
      marginBottom: SPACING.md,
      width: "100%" as const,
    },
    iconBox: {
      width: "100%" as const,
      height: 190,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      marginVertical: SPACING.xl,
      opacity: 0.55,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    permsB: {
      backgroundColor: COLORS.primaryContainer,
      width: "100%" as const,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + SPACING.xs,
      borderRadius: RADIUS.full,
    },
    permsBGranted: {
      backgroundColor: COLORS.surface,
      opacity: 0.7,
    },
    permsBDisabled: {
      opacity: 0.5,
    },
    permsBText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
      textAlign: "center" as const,
    },
    permsBAllFilesText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      textAlign: "center" as const,
    },
    buttonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
  }));

  useEffect(() => {
    const checkAllFilesStatus = async () => {
      if (needsAllFilesAccess) {
        const hasAccess = await checkAllFilesAccess();
        setAllFilesGranted(hasAccess);
      } else {
        setAllFilesGranted(true);
      }
    };
    checkAllFilesStatus();
  }, [needsAllFilesAccess]);

  useEffect(() => {
    const allPermissionsGranted = needsAllFilesAccess
      ? notificationGranted && storageGranted && allFilesGranted
      : notificationGranted && storageGranted;

    if (allPermissionsGranted && onSkip && !hasAutoAdvancedRef.current) {
      hasAutoAdvancedRef.current = true;
      const timer = setTimeout(() => {
        if (onSkip) {
          onSkip();
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [
    notificationGranted,
    storageGranted,
    allFilesGranted,
    onSkip,
    needsAllFilesAccess,
  ]);

  const handleRequestNotificationPermission = async () => {
    setIsRequestingNotification(true);
    try {
      const granted = await requestNotificationPermissions();
      setNotificationGranted(granted);
      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "Notification permission was denied. You can enable it later in settings."
        );
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      Alert.alert("Error", "Failed to request notification permission");
    } finally {
      setIsRequestingNotification(false);
    }
  };

  const handleRequestStoragePermission = async () => {
    setIsRequestingStorage(true);
    try {
      const granted = await requestStoragePermissions();
      setStorageGranted(granted);
      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "Storage permission was denied. You can enable it later in settings."
        );
      }
    } catch (error) {
      console.error("Error requesting storage permission:", error);
      Alert.alert("Error", "Failed to request storage permission");
    } finally {
      setIsRequestingStorage(false);
    }
  };

  const handleRequestAllFilesAccess = async () => {
    setIsRequestingAllFiles(true);
    try {
      await openAllFilesAccessSettings();
      setTimeout(async () => {
        const hasAccess = await checkAllFilesAccess();
        setAllFilesGranted(hasAccess);
        setIsRequestingAllFiles(false);
        if (!hasAccess) {
          Alert.alert(
            "Permission Required",
            "Please enable 'All files access' for Inami to scan your music folders."
          );
        }
      }, 1000);
    } catch (error) {
      console.error("Error requesting all files access:", error);
      setIsRequestingAllFiles(false);
      Alert.alert("Error", "Failed to open settings");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bottomSection} collapsable={false}>
        <View style={styles.top}>
          <Octicons
            style={styles.icon}
            name="git-pull-request"
            size={28}
            color={themeValues.COLORS.onSurface}
          />

          <View style={styles.main}>
            <Text style={styles.welcomeText}>Before we get started</Text>
            <Text style={styles.descText}>
              We need the following permissions to send notifications and read
              your current music library, we won&apos;t interrupt you after
              this.
            </Text>
          </View>
        </View>
        <View style={styles.iconBox}>
          <View style={styles.iconRow}>
            <MaterialIcons
              name="notifications"
              size={64}
              color={themeValues.COLORS.onPrimary}
              style={styles.iconatBox}
            />
            <MaterialIcons
              name="storage"
              size={64}
              color={themeValues.COLORS.onPrimary}
              style={[styles.iconatBox, { marginLeft: SPACING.xl }]}
            />
            {needsAllFilesAccess && (
              <MaterialIcons
                name="folder-special"
                size={64}
                color={themeValues.COLORS.onPrimary}
                style={[styles.iconatBox, { marginLeft: SPACING.xl }]}
              />
            )}
          </View>
        </View>

        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={[
              styles.permsB,
              notificationGranted && styles.permsBGranted,
              isRequestingNotification && styles.permsBDisabled,
            ]}
            onPress={handleRequestNotificationPermission}
            disabled={isRequestingNotification || notificationGranted}
          >
            <Text style={styles.permsBText}>
              {isRequestingNotification
                ? "Waiting..."
                : notificationGranted
                ? "Notification permission granted ✓"
                : "Grant notification permission"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.permsB,
              { marginTop: SPACING.md },
              storageGranted && styles.permsBGranted,
              isRequestingStorage && styles.permsBDisabled,
            ]}
            onPress={handleRequestStoragePermission}
            disabled={isRequestingStorage || storageGranted}
          >
            <Text style={styles.permsBText}>
              {isRequestingStorage
                ? "Waiting..."
                : storageGranted
                ? "Storage permission granted ✓"
                : "Grant storage permission"}
            </Text>
          </TouchableOpacity>
          {needsAllFilesAccess && (
            <TouchableOpacity
              style={[
                styles.permsB,
                styles.permsBAllFiles,
                { marginTop: SPACING.md },
                allFilesGranted && styles.permsBGranted,
                isRequestingAllFiles && styles.permsBDisabled,
              ]}
              onPress={handleRequestAllFilesAccess}
              disabled={isRequestingAllFiles || allFilesGranted}
            >
              <Text
                style={
                  allFilesGranted
                    ? styles.permsBText
                    : styles.permsBAllFilesText
                }
              >
                {isRequestingAllFiles
                  ? "Opening settings..."
                  : allFilesGranted
                  ? "All files access granted ✓"
                  : "Grant all files access"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
