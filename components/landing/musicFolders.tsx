import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  StyleSheet,
  Easing,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import {
  requestDirectoryAccess,
  saveFolder,
  removeFolder,
  toggleFolder,
  getSavedFolders,
  openAllFilesAccessSettings,
  checkAllFilesAccess,
} from "../../utils/folderManager";
import { MusicFolder } from "../../utils/database";
import { triggerHaptic } from "../../utils/haptics";
import { refreshLibrary } from "../../utils/mediaScanner";
import { useRouter } from "expo-router";
import { Cookie12Sided, Triangle } from "../Shapes";

type MusicFoldersProps = {
  onComplete?: () => void;
};

export default function MusicFoldersPage({ onComplete }: MusicFoldersProps) {
  const themeValues = useThemeValues();
  const router = useRouter();
  const [folders, setFolders] = useState<MusicFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFolder, setAddingFolder] = useState(false);
  const [hasAllFilesAccess, setHasAllFilesAccess] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [showComplete, setShowComplete] = useState(false);
  const hasAutoAdvancedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const completeFadeAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const floatXAnim = useRef(new Animated.Value(0)).current;

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    completeContainer: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: COLORS.background,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.xl,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.xxl,
      overflow: "hidden" as const,
    },
    cookieContainer: {
      position: "absolute" as const,
      top: 500,
      left: 30,
    },
    triangleContainer: {
      position: "absolute" as const,
      top: -50,
      left: -150,
      transform: [{ scaleX: -1 }],
    },
    completeText: {
      fontFamily: "Inter_400Regular",
      fontSize: 38,
      color: COLORS.onSurface,
      textAlign: "left" as const,
      marginBottom: SPACING.xxl,
    },
    restartButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.full,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.xl + SPACING.md,
    },
    restartButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
    bottomSection: {
      flex: 1,
      justifyContent: "flex-start" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.xl,
    },
    top: {
      marginTop: SPACING.sm,
      paddingTop: SPACING.xl,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.sm + 3,
      alignItems: "flex-end" as const,
      position: "relative" as const,
      width: "100%" as const,
    },
    icon: {
      left: 0,
      paddingLeft: SPACING.sm + 3,
      paddingTop: SPACING.xl,
      position: "absolute" as const,
    },
    main: {
      marginTop: SPACING.xxl + 12,
    },
    topFinish: {
      marginTop: SPACING.xxl,
      paddingBottom: SPACING.md,
      paddingHorizontal: SPACING.sm + 3,
      alignItems: "flex-end" as const,
      position: "relative" as const,
      width: "100%" as const,
    },
    iconFinish: {
      left: 0,
      paddingTop: SPACING.xl,
      position: "absolute" as const,
    },
    mainFinish: {
      marginTop: SPACING.xxl + 12,
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
      marginTop: SPACING.sm,
    },
    foldersContainer: {
      flex: 1,
      width: "100%" as const,
      marginTop: SPACING.lg,
    },
    scrollContent: {
      paddingBottom: SPACING.xl,
    },
    sectionTitle: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.titleSmall,
      color: COLORS.primary,
      marginBottom: SPACING.sm,
      marginTop: SPACING.md,
    },
    folderItem: {
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    folderItemDisabled: {
      opacity: 0.6,
    },
    folderIcon: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primaryContainer,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: SPACING.md,
    },
    folderInfo: {
      flex: 1,
    },
    folderName: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    folderPath: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.onSurfaceVariant,
      marginTop: 2,
    },
    folderActions: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginLeft: SPACING.xs,
    },
    emptyState: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: SPACING.xl,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.xl,
      opacity: 0.7,
    },
    emptyIcon: {
      marginBottom: SPACING.md,
      opacity: 0.5,
    },
    emptyText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurfaceVariant,
      textAlign: "center" as const,
    },
    emptySubtext: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.outline,
      textAlign: "center" as const,
      marginTop: SPACING.xs,
    },
    permissionButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.errorContainer,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      width: "100%" as const,
    },
    permissionButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onErrorContainer,
      marginLeft: SPACING.sm,
    },
    bottomContainer: {
      width: "100%" as const,
      paddingTop: SPACING.md,
    },
    buttonRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      width: "100%" as const,
      gap: SPACING.sm + 1,
    },
    addButton: {
      width: 92,
      height: 52,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.primaryContainer,
      borderRadius: RADIUS.full,
    },
    addButtonDisabled: {
      opacity: 0.5,
    },
    scanButton: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.full,
      padding: SPACING.md,
    },
    scanButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
      marginLeft: SPACING.sm,
    },
    scanProgressText: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.onSurfaceVariant,
      textAlign: "center" as const,
      marginTop: SPACING.sm,
    },
    continueButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.full,
      padding: SPACING.md,
      marginTop: SPACING.md,
      width: "100%" as const,
    },
    continueButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
    continueButtonDisabled: {
      opacity: 0.5,
    },
  }));

  const loadFolders = useCallback(async () => {
    setLoading(true);
    try {
      const savedFolders = await getSavedFolders();
      setFolders(savedFolders);
    } catch (error) {
      console.error("Error loading folders:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkPermissionStatus = useCallback(async () => {
    if (Platform.OS === "android" && Platform.Version >= 30) {
      const hasAccess = await checkAllFilesAccess();
      setHasAllFilesAccess(hasAccess);
    } else {
      setHasAllFilesAccess(true);
    }
  }, []);

  useEffect(() => {
    loadFolders();
    checkPermissionStatus();
  }, [loadFolders, checkPermissionStatus]);

  useEffect(() => {
    if (!showComplete) return;

    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 33000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      { iterations: -1 }
    );
    spinLoop.start();

    const animateY = () => {
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      }).start(() => {
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }).start(animateY);
      });
    };

    const animateX = () => {
      Animated.timing(floatXAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.sin),
      }).start(() => {
        Animated.timing(floatXAnim, {
          toValue: 0,
          duration: 5000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }).start(animateX);
      });
    };

    animateY();
    animateX();

    return () => {
      spinLoop.stop();
    };
  }, [showComplete, spinAnim, floatAnim, floatXAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleAddFolder = async () => {
    setAddingFolder(true);
    try {
      triggerHaptic();
      const folderInfo = await requestDirectoryAccess();

      if (folderInfo) {
        const existingFolder = folders.find((f) => f.uri === folderInfo.uri);
        if (existingFolder) {
          Alert.alert("Folder Exists", "This folder has already been added.");
          return;
        }

        await saveFolder(folderInfo);
        await loadFolders();
      }
    } catch (error: any) {
      console.error("Error adding folder:", error);
      Alert.alert("Error", error?.message || "Failed to add folder.");
    } finally {
      setAddingFolder(false);
    }
  };

  const handleRemoveFolder = async (folder: MusicFolder) => {
    Alert.alert(
      "Remove Folder",
      `Are you sure you want to remove "${folder.name}" from your music folders?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              triggerHaptic();
              await removeFolder(folder.id);
              await loadFolders();
            } catch (error) {
              console.error("Error removing folder:", error);
              Alert.alert("Error", "Failed to remove folder.");
            }
          },
        },
      ]
    );
  };

  const handleToggleFolder = async (folder: MusicFolder) => {
    try {
      triggerHaptic();
      await toggleFolder(folder.id, !folder.is_enabled);
      await loadFolders();
    } catch (error) {
      console.error("Error toggling folder:", error);
    }
  };

  const handleOpenSettings = async () => {
    try {
      triggerHaptic();
      await openAllFilesAccessSettings();
      setTimeout(() => {
        checkPermissionStatus();
      }, 500);
    } catch {
      Alert.alert("Error", "Could not open settings.");
    }
  };

  const handleScanAndContinue = async () => {
    if (isScanning) return;

    const enabledFolders = folders.filter((f) => f.is_enabled);

    if (enabledFolders.length === 0) {
      Alert.alert(
        "No Folders Selected",
        "Please add and enable at least one music folder to continue.",
        [{ text: "OK" }]
      );
      return;
    }

    setIsScanning(true);
    setScanProgress({ current: 0, total: 0 });
    try {
      triggerHaptic();

      await refreshLibrary((current, total) => {
        setScanProgress({ current, total });
      });

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsScanning(false);
        setScanProgress({ current: 0, total: 0 });
        setShowComplete(true);

        // Fade in the completion screen
        Animated.timing(completeFadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
      return;
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Scan Failed",
        "An error occurred while scanning your music folders."
      );
      setIsScanning(false);
      setScanProgress({ current: 0, total: 0 });
    }
  };

  const truncatePath = (path: string, maxLength: number = 40): string => {
    if (path.length <= maxLength) return path;
    return "..." + path.slice(-maxLength);
  };

  const enabledFoldersCount = folders.filter((f) => f.is_enabled).length;

  const handleRestart = async () => {
    triggerHaptic();
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.container}>
      {showComplete ? (
        <Animated.View
          style={[styles.completeContainer, { opacity: completeFadeAnim }]}
        >
          <Animated.View
            style={[styles.cookieContainer, { transform: [{ rotate: spin }] }]}
          >
            <Cookie12Sided
              width={700}
              height={700}
              strokeWidth={2}
              stroke={COLORS.primaryContainer}
            />
          </Animated.View>
          <Animated.View
            style={[
              styles.triangleContainer,
              {
                transform: [
                  {
                    translateY: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -20],
                    }),
                  },
                  {
                    translateX: floatXAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -18],
                    }),
                  },
                  {
                    rotate: floatAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["-3deg", "5deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <Triangle
              width={400}
              height={400}
              strokeWidth={3}
              stroke={COLORS.primaryContainer}
            />
          </Animated.View>
          <View style={{ width: "100%" as const }}>
            <View style={styles.topFinish}>
              <MaterialIcons
                style={styles.iconFinish}
                name="check"
                size={28}
                color={themeValues.COLORS.onSurface}
              />
            </View>
            <View style={styles.mainFinish}>
              <Text style={styles.welcomeText}>All set!</Text>
              <Text style={styles.descText}>
                Inami is all yours now. Enjoy your music experience.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleRestart}
          >
            <Text style={styles.restartButtonText}>Thank you!</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.bottomSection, { opacity: fadeAnim }]}>
          <View style={styles.top}>
            <MaterialIcons
              style={styles.icon}
              name="folder-special"
              size={28}
              color={themeValues.COLORS.onSurface}
            />

            <View style={styles.main}>
              <Text style={styles.welcomeText}>Your music library</Text>
              <Text style={styles.descText}>
                More categorized folders means a better experience.
              </Text>
            </View>
          </View>

          <View style={styles.foldersContainer}>
            {Platform.OS === "android" &&
              Platform.Version >= 30 &&
              !hasAllFilesAccess && (
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={handleOpenSettings}
                >
                  <MaterialIcons
                    name="admin-panel-settings"
                    size={20}
                    color={themeValues.COLORS.onErrorContainer}
                  />
                  <Text style={styles.permissionButtonText}>
                    Grant All Files Access (Required)
                  </Text>
                </TouchableOpacity>
              )}

            <Text style={styles.sectionTitle}>
              Selected Folders ({enabledFoldersCount})
            </Text>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {loading ? (
                <ActivityIndicator
                  size="large"
                  color={themeValues.COLORS.primary}
                  style={{ marginTop: SPACING.xl }}
                />
              ) : folders.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons
                    name="folder-open"
                    size={64}
                    color={themeValues.COLORS.outline}
                    style={styles.emptyIcon}
                  />
                  <Text style={styles.emptyText}>No folders selected</Text>
                  <Text style={styles.emptySubtext}>
                    Tap the button below to add your music folders
                  </Text>
                </View>
              ) : (
                folders.map((folder) => (
                  <View
                    key={folder.id}
                    style={[
                      styles.folderItem,
                      !folder.is_enabled && styles.folderItemDisabled,
                    ]}
                  >
                    <View style={styles.folderIcon}>
                      <MaterialIcons
                        name="folder"
                        size={24}
                        color={themeValues.COLORS.primary}
                      />
                    </View>

                    <View style={styles.folderInfo}>
                      <Text style={styles.folderName}>{folder.name}</Text>
                      <Text style={styles.folderPath}>
                        {truncatePath(
                          decodeURIComponent(folder.uri).replace(
                            /^.*\/tree\//,
                            ""
                          )
                        )}
                      </Text>
                    </View>

                    <View style={styles.folderActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleRemoveFolder(folder)}
                      >
                        <MaterialIcons
                          name="delete-outline"
                          size={22}
                          color={themeValues.COLORS.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomContainer}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (addingFolder || isScanning) && styles.addButtonDisabled,
                ]}
                onPress={handleAddFolder}
                disabled={addingFolder || isScanning}
              >
                {addingFolder ? (
                  <ActivityIndicator
                    size="small"
                    color={themeValues.COLORS.onPrimaryContainer}
                  />
                ) : (
                  <MaterialIcons
                    name="add"
                    size={28}
                    color={themeValues.COLORS.onPrimaryContainer}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scanButton,
                  (isScanning || enabledFoldersCount === 0) && { opacity: 0.7 },
                ]}
                onPress={handleScanAndContinue}
                disabled={
                  isScanning || addingFolder || enabledFoldersCount === 0
                }
              >
                {isScanning ? (
                  <ActivityIndicator
                    size="small"
                    color={themeValues.COLORS.onPrimary}
                  />
                ) : (
                  <MaterialIcons
                    name="search"
                    size={24}
                    color={themeValues.COLORS.onPrimary}
                  />
                )}
                <Text style={styles.scanButtonText}>
                  {isScanning ? "Scanning..." : "Finalize & Continue"}
                </Text>
              </TouchableOpacity>
            </View>

            {isScanning && scanProgress.total > 0 && (
              <Text style={styles.scanProgressText}>
                Processing {scanProgress.current} of {scanProgress.total} files
              </Text>
            )}
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}
