import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function SettingsModal({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Yes",
  cancelText = "Cancel",
}: ModalProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: RADIUS.xxl,
      borderTopRightRadius: RADIUS.xxl,
      padding: SPACING.lg,
      paddingTop: SPACING.md,
      width: "100%",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 24,
    },
    dragIndicator: {
      width: 32,
      height: 4,
      backgroundColor: COLORS.onSurfaceVariant,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: SPACING.md,
      opacity: 0.4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      marginTop: SPACING.xs,
    },
    icon: {
      marginRight: SPACING.md,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurface,
      flex: 1,
    },
    message: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
      marginBottom: SPACING.xl,
      lineHeight: 20,
    },
    buttons: {
      flexDirection: "row",
      gap: SPACING.md,
      marginBottom: SPACING.sm,
    },
    button: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
      borderRadius: RADIUS.full,
      minHeight: 48,
    },
    cancelButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: COLORS.outline,
    },
    confirmButton: {
      backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
    },
    confirmButtonText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
    buttonIcon: {
      marginLeft: SPACING.xs,
    },
  }));

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.dragIndicator} />
          <View style={styles.header}>
            <MaterialIcons
              name="help-outline"
              size={24}
              color={themeValues.COLORS.primary}
              style={styles.icon}
            />
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
              <MaterialIcons
                name="check"
                size={18}
                color={COLORS.onPrimary}
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
