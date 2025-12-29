import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

type CreatePlaylistModalProps = {
  show: boolean;
  onClose: () => void;
  playlistName: string;
  setPlaylistName: (value: string) => void;
  playlistDescription: string;
  setPlaylistDescription: (value: string) => void;
  creating: boolean;
  onCreate: () => void;
};

export function CreatePlaylistModal({
  show,
  onClose,
  playlistName,
  setPlaylistName,
  playlistDescription,
  setPlaylistDescription,
  creating,
  onCreate,
}: CreatePlaylistModalProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center" as const,
      alignItems: "center" as const,
      padding: SPACING.lg,
    },
    modalContent: {
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: RADIUS.xxl,
      padding: SPACING.lg,
      width: "100%" as const,
      maxWidth: 400,
    },
    modalTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineSmall,
      color: COLORS.onSurface,
      marginBottom: SPACING.lg,
    },
    inputContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: RADIUS.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.xs,
      marginBottom: SPACING.md,
      gap: SPACING.md,
    },
    modalInput: {
      flex: 1,
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
      paddingVertical: SPACING.md,
    },
    descInput: {
      minHeight: 60,
      textAlignVertical: "top" as const,
    },
    modalActions: {
      flexDirection: "row" as const,
      gap: SPACING.md,
      marginTop: SPACING.md,
    },
    modalButtonOutline: {
      flex: 1,
      height: 48,
      borderRadius: RADIUS.full,
      borderWidth: 1,
      borderColor: COLORS.outline,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    modalButtonOutlineText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
    },
    modalButtonFilled: {
      flex: 1,
      height: 48,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    modalButtonFilledText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
  }));

  return (
    <Modal
      visible={show}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>New playlist</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="edit"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Playlist name"
              placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
              value={playlistName}
              onChangeText={setPlaylistName}
            />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons
              name="description"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
            <TextInput
              style={[styles.modalInput, styles.descInput]}
              placeholder="Description (optional)"
              placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
              value={playlistDescription}
              onChangeText={setPlaylistDescription}
              multiline
              numberOfLines={2}
            />
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButtonOutline}
              onPress={onClose}
            >
              <Text style={styles.modalButtonOutlineText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonFilled}
              onPress={onCreate}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator
                  size="small"
                  color={themeValues.COLORS.onPrimary}
                />
              ) : (
                <Text style={styles.modalButtonFilledText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
