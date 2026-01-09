import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
import { MusicFolder, getAllMusicFolders } from "../../utils/database";
import { triggerHaptic } from "../../utils/haptics";
import { refreshLibrary } from "../../utils/mediaScanner";

interface SelectFolderProps {
  visible: boolean;
  onClose: () => void;
  onFoldersChanged?: () => void;
}

export default function SelectFolder({
  visible,
  onClose,
  onFoldersChanged,
}: SelectFolderProps) {
  const themeValues = useThemeValues();
  const [folders, setFolders] = useState<MusicFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [hasAllFilesAccess, setHasAllFilesAccess] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });

  const styles = useDynamicStyles(() => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "flex-end" as const,
    },
    modalContent: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      maxHeight: "90%" as any,
      minHeight: "60%" as any,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      padding: SPACING.lg,
    },
    headerTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurface,
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainerHigh,
    },
    scrollContent: {
      paddingTop: -SPACING.md,
      padding: SPACING.md,
      paddingBottom: SPACING.xxl,
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
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: RADIUS.sm,
      borderWidth: 2,
      borderColor: COLORS.outline,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: SPACING.sm,
    },
    checkboxChecked: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.primary,
    },
    addButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.primaryContainer,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },
    addButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimaryContainer,
      marginLeft: SPACING.sm,
    },
    scanButton: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginTop: SPACING.sm,
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
    emptyState: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: SPACING.xl,
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
    },
    permissionButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onErrorContainer,
      marginLeft: SPACING.sm,
    },
    loadingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      justifyContent: "center" as const,
      alignItems: "center" as const,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
    },
    bottomContainer: {
      padding: SPACING.md,
      paddingBottom: SPACING.lg,
      backgroundColor: COLORS.surface,
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
    } else setHasAllFilesAccess(true);
  }, []);

  useEffect(() => {
    if (visible) {
      loadFolders();
      checkPermissionStatus();
    }
  }, [visible, loadFolders, checkPermissionStatus]);

  const handleAddFolder = async () => {
    setAddingFolder(true);
    try {
      triggerHaptic();
      const folderInfo = await requestDirectoryAccess();

      if (folderInfo) {
        const existingFolder = folders.find((f) => f.uri === folderInfo.uri);
        if (existingFolder) {
          return;
        }

        await saveFolder(folderInfo);
        await loadFolders();
        onFoldersChanged?.();
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
              onFoldersChanged?.();
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
      onFoldersChanged?.();
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

  const handleScanLibrary = async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScanProgress({ current: 0, total: 0 });
    try {
      triggerHaptic();
      const allFolders = await getAllMusicFolders();
      const enabledFolders = allFolders.filter((f) => f.is_enabled);

      if (enabledFolders.length === 0) {
        Alert.alert(
          "No Folders Selected",
          "Please select at least one music folder first.",
          [{ text: "OK" }]
        );
        return;
      }

      await refreshLibrary((current, total) => {
        setScanProgress({ current, total });
      });

      Alert.alert("Scan Complete", "Your music library has been updated.");
      onFoldersChanged?.();
    } catch (error) {
      console.error("Scan error:", error);
      Alert.alert(
        "Scan Failed",
        "An error occurred while scanning your music folders."
      );
    } finally {
      setIsScanning(false);
      setScanProgress({ current: 0, total: 0 });
    }
  };

  const truncatePath = (path: string, maxLength: number = 45): string => {
    if (path.length <= maxLength) return path;
    return "..." + path.slice(-maxLength);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Music Folders</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={themeValues.COLORS.onSurface}
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Permission */}
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

            {/* Folders */}
            <Text style={styles.sectionTitle}>Selected Folders</Text>

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
                  Add folders to start scanning for music
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
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      folder.is_enabled && styles.checkboxChecked,
                    ]}
                    onPress={() => handleToggleFolder(folder)}
                  >
                    {folder.is_enabled && (
                      <MaterialIcons
                        name="check"
                        size={18}
                        color={themeValues.COLORS.onPrimary}
                      />
                    )}
                  </TouchableOpacity>

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
                      {truncatePath(decodeURIComponent(folder.uri))}
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

          {/* Bottom Buttons */}
          <View style={styles.bottomContainer}>
            {/* Add Folder */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddFolder}
              disabled={addingFolder || isScanning}
            >
              {addingFolder ? (
                <ActivityIndicator
                  size="small"
                  color={themeValues.COLORS.onPrimaryContainer}
                />
              ) : (
                <>
                  <MaterialIcons
                    name="add"
                    size={24}
                    color={themeValues.COLORS.onPrimaryContainer}
                  />
                  <Text style={styles.addButtonText}>Add Folder</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Scan Library */}
            <TouchableOpacity
              style={[styles.scanButton, isScanning && { opacity: 0.7 }]}
              onPress={handleScanLibrary}
              disabled={isScanning || addingFolder}
            >
              {isScanning ? (
                <ActivityIndicator
                  size="small"
                  color={themeValues.COLORS.onPrimary}
                />
              ) : (
                <MaterialIcons
                  name="refresh"
                  size={24}
                  color={themeValues.COLORS.onPrimary}
                />
              )}
              <Text style={styles.scanButtonText}>
                {isScanning ? "Scanning..." : "Scan Library"}
              </Text>
            </TouchableOpacity>

            {isScanning && scanProgress.total > 0 && (
              <Text style={styles.scanProgressText}>
                Processing {scanProgress.current} of {scanProgress.total} files
              </Text>
            )}
          </View>

          {/* Loading */}
          {addingFolder && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator
                size="large"
                color={themeValues.COLORS.primary}
              />
            </View>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
