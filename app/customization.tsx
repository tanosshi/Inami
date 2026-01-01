import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Feather } from "@expo/vector-icons";
// @ts-ignore
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import {
  CUSTOMIZATION_CONFIG,
  CATEGORY_ICON_MAP,
} from "../constants/customization";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";
import { triggerHaptic } from "../utils/haptics";
import { applyTheme } from "../constants/theme";
import SettingsModal from "./settings/modal-[id]";
import { saveThemeSettings, saveSettingsBatch } from "../utils/database";

export default function CustomizationScreen() {
  const router = useRouter();
  const themeValues = useThemeValues();
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = React.useState<"grid" | "rows">("grid");
  const [modalVisible, setModalVisible] = React.useState(false);
  const [resetModalVisible, setResetModalVisible] = React.useState(false);
  const [pendingTheme, setPendingTheme] = React.useState<string | null>(null);

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurface,
    },
    placeholder: {
      width: 48,
    },
    viewModeButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: SPACING.md,
      paddingBottom: 40,
    },
    categoryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    categoryList: {
      flexDirection: "column",
      marginBottom: SPACING.lg,
    },
    categoryBlock: {
      width: "30%",
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 120,
      borderWidth: 2,
      borderColor: "transparent",
    },
    categoryBlockSelected: {
      backgroundColor: COLORS.primaryContainer,
      borderColor: COLORS.primary,
    },
    categoryBlockRow: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      alignItems: "center",
      minHeight: 72,
      borderWidth: 2,
      borderColor: "transparent",
    },
    categoryBlockRowFirst: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceContainerHigh,
      borderTopLeftRadius: RADIUS.lg,
      borderTopRightRadius: RADIUS.lg,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      padding: SPACING.md,
      alignItems: "center",
      minHeight: 72,
      borderWidth: 2,
      borderColor: "transparent",
    },
    categoryBlockRowMiddle: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: 0,
      padding: SPACING.md,
      alignItems: "center",
      minHeight: 72,
      borderWidth: 2,
      borderColor: "transparent",
    },
    categoryBlockRowLast: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceContainerHigh,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: RADIUS.lg,
      borderBottomRightRadius: RADIUS.lg,
      padding: SPACING.md,
      alignItems: "center",
      minHeight: 72,
      borderWidth: 2,
      borderColor: "transparent",
    },
    categoryBlockRowSelected: {
      backgroundColor: COLORS.primaryContainer,
      borderColor: COLORS.primary,
    },
    categoryIcon: {
      marginBottom: SPACING.sm,
    },
    categoryIconRow: {
      marginRight: SPACING.md,
    },
    categoryTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleSmall,
      color: COLORS.onSurface,
      textAlign: "center",
      marginBottom: SPACING.xs,
    },
    categoryTitleSelected: {
      color: COLORS.onPrimaryContainer,
    },
    categoryTitleRow: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
      textAlign: "left",
      flex: 1,
    },
    categoryTitleRowSelected: {
      color: COLORS.onPrimaryContainer,
    },
    categoryCount: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.onSurfaceVariant,
      textAlign: "center",
    },
    selectedCategorySection: {
      marginTop: SPACING.lg,
    },
    categoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    selectedCategoryTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurface,
      marginLeft: SPACING.md,
    },
    sectionTitle: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.titleSmall,
      color: COLORS.primary,
      marginBottom: SPACING.sm,
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    card: {
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: RADIUS.xl,
      overflow: "hidden",
    },
    settingItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: SPACING.md,
      minHeight: 72,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.primaryContainer,
      justifyContent: "center",
      alignItems: "center",
      marginRight: SPACING.md,
    },
    settingContent: {
      flex: 1,
    },
    settingLabel: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    settingDescription: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.outlineVariant,
      marginLeft: 72,
    },
    footer: {
      alignItems: "center",
      paddingVertical: SPACING.xl,
      marginTop: SPACING.lg,
    },
    footerText: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurfaceVariant,
    },
    footerSubtext: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      color: COLORS.outline,
      marginTop: SPACING.xs,
    },
  }));

  const [settingsState, setSettingsState] = React.useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    Object.values(CUSTOMIZATION_CONFIG).forEach((section) => {
      section.settings.forEach((setting) => {
        if (setting.type === "toggle" && setting.defaultValue !== null) {
          initialState[setting.codename] = setting.defaultValue as boolean;
        }
      });
    });
    return initialState;
  });

  const handleSettingPress = (codename: string, type: string) => {
    console.log(`Customization setting pressed: ${codename} (type: ${type})`);

    switch (codename) {
      case "reset_customization":
        setPendingTheme("reset");
        setResetModalVisible(true);
        return;
      case "nav_style":
      case "tracks_layout":
      case "playlists_style":
      case "discover_layout":
      case "homescreen":
      case "fonts":
        router.push(`/settings/customizations?type=${codename}`);
        return;
      default:
        break;
    }

    if (
      type === "action" &&
      (codename === "amoled_theme" ||
        codename === "white_mode" ||
        codename === "gray_theme")
    ) {
      let themeName = "";
      let themeDisplayName = "";

      switch (codename) {
        case "amoled_theme":
          themeName = "Black";
          themeDisplayName = "AMOLED Theme";
          break;
        case "white_mode":
          themeName = "Light";
          themeDisplayName = "White Mode";
          break;
        case "gray_theme":
          themeName = "Gray";
          themeDisplayName = "Dark Theme";
          break;
      }

      setPendingTheme(themeName);
      setModalVisible(true);
      return;
    }

    console.log(`Other action: ${codename}`);
  };

  const handleToggleChange = (codename: string, value: boolean) => {
    console.log(`Customization toggle changed: ${codename} = ${value}`);
    setSettingsState((prev) => ({
      ...prev,
      [codename]: value,
    }));
  };

  const handleModalConfirm = async (action: "theme" | "reset") => {
    if (action === "theme" && pendingTheme && pendingTheme !== "reset") {
      applyTheme(pendingTheme);
      setModalVisible(false);
      await saveThemeSettings(pendingTheme, undefined as any, undefined as any);
      setPendingTheme(null);
      router.replace("/");
    } else if (action === "reset") {
      applyTheme("Black");
      setResetModalVisible(false);
      setPendingTheme(null);
      await saveThemeSettings("Black", true, true);
      const configs = [CUSTOMIZATION_CONFIG];
      const findToggles = (
        obj: any
      ): Array<{ codename: string; defaultValue: boolean }> => {
        const results: Array<{ codename: string; defaultValue: boolean }> = [];

        if (Array.isArray(obj)) {
          for (const item of obj) {
            if (
              item &&
              typeof item === "object" &&
              item.type === "toggle" &&
              (item.defaultValue === true || item.defaultValue === false) &&
              item.codename
            ) {
              results.push({
                codename: item.codename,
                defaultValue: item.defaultValue,
              });
            }
            results.push(...findToggles(item));
          }
        } else if (obj && typeof obj === "object") {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              results.push(...findToggles(obj[key]));
            }
          }
        }

        return results;
      };

      const toggles = configs.flatMap((config) => findToggles(config));
      if (toggles.length > 0) {
        const settingsToSave = toggles.map((toggle) => ({
          codename: toggle.codename,
          value: toggle.defaultValue,
        }));
        await saveSettingsBatch(settingsToSave);
      }
      router.replace("/");
    }
  };

  const ModalCancel = () => {
    setModalVisible(false);
    setResetModalVisible(false);
    setPendingTheme(null);
  };

  const renderCategoryBlock = (
    sectionKey: string,
    section: any,
    index: number,
    total: number
  ) => {
    const isRowMode = viewMode === "rows";
    const isFirst = index === 0;
    const isLast = index === total - 1;

    const getRowBlockStyle = () => {
      if (!isRowMode) return styles.categoryBlock;

      if (isFirst && isLast) {
        return styles.categoryBlockRow;
      } else if (isFirst) {
        return styles.categoryBlockRowFirst;
      } else if (isLast) {
        return styles.categoryBlockRowLast;
      } else {
        return styles.categoryBlockRowMiddle;
      }
    };

    return (
      <TouchableOpacity
        key={sectionKey}
        style={[
          getRowBlockStyle(),
          selectedCategory === sectionKey &&
            (isRowMode
              ? styles.categoryBlockRowSelected
              : styles.categoryBlockSelected),
        ]}
        onPress={() => {
          triggerHaptic();
          setSelectedCategory(
            selectedCategory === sectionKey ? null : sectionKey
          );
        }}
      >
        <View style={isRowMode ? styles.categoryIconRow : styles.categoryIcon}>
          <MaterialIcons
            name={CATEGORY_ICON_MAP[sectionKey] || "category"}
            size={isRowMode ? 24 : 32}
            color={
              selectedCategory === sectionKey
                ? themeValues.COLORS.primary
                : themeValues.COLORS.onSurfaceVariant
            }
          />
        </View>
        <Text
          style={[
            isRowMode ? styles.categoryTitleRow : styles.categoryTitle,
            selectedCategory === sectionKey &&
              (isRowMode
                ? styles.categoryTitleRowSelected
                : styles.categoryTitleSelected),
          ]}
        >
          {section.title}
        </Text>
        {!isRowMode && (
          <Text style={styles.categoryCount}>
            {section.settings.length} settings
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderSettingItem = (
    setting: any,
    sectionKey: string,
    index: number,
    isLast: boolean
  ) => {
    const { codename, name, description, emoji, type } = setting;

    const isToggle = type === "toggle";
    const hasRightArrow = type === "menu";

    const isClickable = type === "menu" || type === "action";

    const ItemComponent = isClickable ? TouchableOpacity : View;
    const itemProps = isClickable
      ? {
          onPress: () => {
            triggerHaptic();
            handleSettingPress(codename, type);
          },
        }
      : {};

    return (
      <React.Fragment key={codename}>
        <ItemComponent style={styles.settingItem} {...itemProps}>
          <View style={styles.settingIcon}>
            <MaterialIcons
              name={emoji}
              size={24}
              color={themeValues.COLORS.primary}
            />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>{name}</Text>
            {description && (
              <Text style={styles.settingDescription}>{description}</Text>
            )}
          </View>
          {isToggle && (
            <Switch
              value={settingsState[codename] || false}
              onValueChange={(value) => handleToggleChange(codename, value)}
              trackColor={{
                false: themeValues.COLORS.surfaceVariant,
                true: themeValues.COLORS.primaryContainer,
              }}
              thumbColor={
                settingsState[codename]
                  ? themeValues.COLORS.primary
                  : themeValues.COLORS.outline
              }
            />
          )}
          {hasRightArrow && (
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={themeValues.COLORS.onSurfaceVariant}
            />
          )}
        </ItemComponent>
        {!isLast && <View style={styles.divider} />}
      </React.Fragment>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            triggerHaptic();
            router.push("/settings");
          }}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={themeValues.COLORS.onSurface}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Customize</Text>
        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={() => {
            triggerHaptic();
            setViewMode(viewMode === "grid" ? "rows" : "grid");
          }}
        >
          <Feather
            name={viewMode === "grid" ? "list" : "grid"}
            size={20}
            color={themeValues.COLORS.onSurface}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Category Blocks */}
        <View
          style={
            viewMode === "grid" ? styles.categoryGrid : styles.categoryList
          }
        >
          {Object.entries(CUSTOMIZATION_CONFIG).map(
            ([sectionKey, section], index) =>
              renderCategoryBlock(
                sectionKey,
                section,
                index,
                Object.keys(CUSTOMIZATION_CONFIG).length
              )
          )}
        </View>

        {/* selected category settings */}
        {selectedCategory && (
          <View style={styles.selectedCategorySection}>
            <View style={styles.categoryHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  triggerHaptic();
                  setSelectedCategory(null);
                }}
              >
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={themeValues.COLORS.onSurface}
                />
              </TouchableOpacity>
              <Text style={styles.selectedCategoryTitle}>
                {
                  CUSTOMIZATION_CONFIG[
                    selectedCategory as keyof typeof CUSTOMIZATION_CONFIG
                  ].title
                }
              </Text>
            </View>
            <View style={styles.card}>
              {CUSTOMIZATION_CONFIG[
                selectedCategory as keyof typeof CUSTOMIZATION_CONFIG
              ].settings.map((setting, index) =>
                renderSettingItem(
                  setting,
                  selectedCategory,
                  index,
                  index ===
                    CUSTOMIZATION_CONFIG[
                      selectedCategory as keyof typeof CUSTOMIZATION_CONFIG
                    ].settings.length -
                      1
                )
              )}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerSubtext}>The app is all yours :)</Text>
        </View>
      </ScrollView>

      <SettingsModal
        visible={modalVisible}
        onClose={ModalCancel}
        onConfirm={() => handleModalConfirm("theme")}
        title="Apply Theme"
        message={`Are you sure you want to apply this theme?\nThis action will restart the app for you.`}
        confirmText="Yes"
        cancelText="Cancel"
      />
      <SettingsModal
        visible={resetModalVisible}
        onClose={ModalCancel}
        onConfirm={() => handleModalConfirm("reset")}
        title="Reset configuration"
        message={`Are you sure you want to reset the configuration?\nThis action will restart the app for you.`}
        confirmText="Yes"
        cancelText="Cancel"
      />
    </SafeAreaView>
  );
}
