import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
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
    scrollView: {
      flex: 1,
    },
    content: {
      padding: SPACING.md,
      paddingBottom: 40,
    },
    categoryHorizontalContainer: {
      marginBottom: SPACING.md,
      maxHeight: 40,
    },
    categoryHorizontalContent: {
      paddingHorizontal: SPACING.md,
      alignItems: "center",
    },
    categoryChip: {
      paddingHorizontal: SPACING.md + 2,
      paddingVertical: SPACING.xs + 2,
      backgroundColor: COLORS.surfaceContainerHigh,
      borderRadius: RADIUS.full,
      marginRight: SPACING.sm,
      borderWidth: 1,
      borderColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
    },
    categoryChipSelected: {
      backgroundColor: COLORS.primaryContainer,
      borderColor: COLORS.primary,
    },
    categoryChipIcon: {
      marginRight: SPACING.xs,
    },
    categoryChipText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelSmall,
      color: COLORS.onSurfaceVariant,
    },
    categoryChipTextSelected: {
      color: COLORS.onPrimaryContainer,
    },
    selectedCategorySection: {
      marginTop: 0,
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
      marginLeft: -SPACING.xs,
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
      case "player_style":
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
        <View style={styles.placeholder} />
      </View>

      {/* Horizontal Category Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryHorizontalContainer}
        contentContainerStyle={styles.categoryHorizontalContent}
      >
        {Object.entries(CUSTOMIZATION_CONFIG).map(([sectionKey, section]) => (
          <TouchableOpacity
            key={sectionKey}
            style={[
              styles.categoryChip,
              selectedCategory === sectionKey && styles.categoryChipSelected,
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedCategory(
                selectedCategory === sectionKey ? null : sectionKey
              );
            }}
          >
            <MaterialIcons
              name={CATEGORY_ICON_MAP[sectionKey] || "category"}
              size={16}
              color={
                selectedCategory === sectionKey
                  ? themeValues.COLORS.primary
                  : themeValues.COLORS.onSurfaceVariant
              }
              style={styles.categoryChipIcon}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === sectionKey &&
                  styles.categoryChipTextSelected,
              ]}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* selected category settings */}
        {selectedCategory && (
          <View style={styles.selectedCategorySection}>
            <View style={styles.categoryHeader}>
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
