import React from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeValues, useDynamicStyles } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";
import { blendColors } from "../../utils/colorUtils";

interface SortModalProps {
  show: boolean;
  onClose: () => void;
  sortBy: "title" | "created_at" | "artist";
  setSortBy: (sort: "title" | "created_at" | "artist") => void;
  sortDirection: "asc" | "desc";
  setSortDirection: (direction: "asc" | "desc") => void;
  setSortKey: (key: string) => void;
}

export default function SortModal({
  show,
  onClose,
  sortBy,
  setSortBy,
  sortDirection,
  setSortDirection,
  setSortKey,
}: SortModalProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    sortModalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    sortModalBackdrop: {
      flex: 1,
    },
    sortModalContainer: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: blendColors(COLORS.background, COLORS.primary, 0.06),
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingBottom: SPACING.xl,
    },
    sortModalHandle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.onSurfaceVariant,
      borderRadius: RADIUS.full,
      alignSelf: "center" as const,
      marginTop: SPACING.md,
      marginBottom: SPACING.sm,
      opacity: 0.5,
    },
    sortModalContent: {
      paddingHorizontal: SPACING.lg,
    },
    sortHeader: {
      marginBottom: SPACING.lg,
    },
    sortModalTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineSmall,
      color: COLORS.onSurface,
      textAlign: "left" as const,
    },
    sortOptions: {
      marginBottom: SPACING.lg,
    },
    sortOption: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: RADIUS.md,
      marginBottom: SPACING.xs,
    },
    sortOptionLeft: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.md,
    },
    radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: COLORS.outline,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    radioButtonSelected: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: themeValues.COLORS.primary,
    },
    sortOptionText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    sortDirectionContainer: {
      paddingTop: SPACING.lg,
      borderTopWidth: 1,
      borderTopColor: COLORS.outlineVariant,
    },
    sortDirectionLabel: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurfaceVariant,
      marginBottom: SPACING.sm,
      letterSpacing: 0.5,
    },
    sortDirectionOptions: {
      flexDirection: "row" as const,
    },
    sortDirectionButtonLeft: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderTopLeftRadius: RADIUS.lg,
      borderBottomLeftRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.outline,
      gap: SPACING.xs,
      backgroundColor: COLORS.surface,
      borderRightWidth: 0,
    },
    sortDirectionButtonRight: {
      flex: 1,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      padding: SPACING.md,
      paddingVertical: SPACING.sm + 2,
      borderTopRightRadius: RADIUS.lg,
      borderBottomRightRadius: RADIUS.lg,
      borderWidth: 1.5,
      borderColor: COLORS.outline,
      gap: SPACING.xs,
      backgroundColor: COLORS.surface,
      borderLeftWidth: 0,
    },
    sortDirectionButtonActive: {
      backgroundColor: themeValues.COLORS.primary,
      borderColor: themeValues.COLORS.primary,
    },
    sortDirectionText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelMedium,
      color: COLORS.onSurfaceVariant,
    },
    sortDirectionTextActive: {
      fontFamily: "Inter_600SemiBold",
      color: themeValues.COLORS.onPrimary,
    },
  }));

  const handleSortOptionPress = (option: "title" | "artist" | "created_at") => {
    triggerHaptic();
    setSortBy(option);
    setSortKey(`${option}-${sortDirection}`);
    onClose();
  };

  const handleDirectionPress = (direction: "asc" | "desc") => {
    triggerHaptic();
    setSortDirection(direction);
    setSortKey(`${sortBy}-${direction}`);
  };

  return (
    <Modal
      visible={show}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sortModalOverlay}>
        <Pressable style={styles.sortModalBackdrop} onPress={onClose} />
        <View style={styles.sortModalContainer}>
          <View style={styles.sortModalHandle} />
          <View style={styles.sortModalContent}>
            <View style={styles.sortHeader}>
              <Text style={styles.sortModalTitle}>Sort by</Text>
            </View>

            <View style={styles.sortOptions}>
              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortOptionPress("title")}
              >
                <View style={styles.sortOptionLeft}>
                  <View style={styles.radioButton}>
                    {sortBy === "title" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.sortOptionText}>Title</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortOptionPress("artist")}
              >
                <View style={styles.sortOptionLeft}>
                  <View style={styles.radioButton}>
                    {sortBy === "artist" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.sortOptionText}>Artist</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sortOption}
                onPress={() => handleSortOptionPress("created_at")}
              >
                <View style={styles.sortOptionLeft}>
                  <View style={styles.radioButton}>
                    {sortBy === "created_at" && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <Text style={styles.sortOptionText}>Recently Added</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.sortDirectionContainer}>
              <Text style={styles.sortDirectionLabel}>Order</Text>
              <View style={styles.sortDirectionOptions}>
                <TouchableOpacity
                  style={[
                    styles.sortDirectionButtonLeft,
                    sortDirection === "asc" && styles.sortDirectionButtonActive,
                  ]}
                  onPress={() => handleDirectionPress("asc")}
                >
                  <MaterialIcons
                    name="arrow-upward"
                    size={16}
                    color={
                      sortDirection === "asc"
                        ? themeValues.COLORS.onPrimary
                        : themeValues.COLORS.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.sortDirectionText,
                      sortDirection === "asc" && styles.sortDirectionTextActive,
                    ]}
                  >
                    Ascending
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.sortDirectionButtonRight,
                    sortDirection === "desc" && styles.sortDirectionButtonActive,
                  ]}
                  onPress={() => handleDirectionPress("desc")}
                >
                  <MaterialIcons
                    name="arrow-downward"
                    size={16}
                    color={
                      sortDirection === "desc"
                        ? themeValues.COLORS.onPrimary
                        : themeValues.COLORS.onSurfaceVariant
                    }
                  />
                  <Text
                    style={[
                      styles.sortDirectionText,
                      sortDirection === "desc" && styles.sortDirectionTextActive,
                    ]}
                  >
                    Descending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
