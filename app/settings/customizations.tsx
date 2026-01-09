import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { SETTINGS_CONFIG } from "../../constants/settings";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "@/utils/haptics";
import {
  getAllSettings,
  saveSetting,
  getThemeSettings,
  saveThemeSetting,
} from "../../utils/database";

// Import customization configs
import { NAV_STYLE_CONFIG } from "../../constants/customizations/nav_style";
import { TRACKS_LAYOUT_CONFIG } from "../../constants/customizations/tracks_layout";
import { PLAYLISTS_LAYOUT_CONFIG } from "../../constants/customizations/playlists_layout";
import { DISCOVER_LAYOUT_CONFIG } from "../../constants/customizations/discover_layout";
import { FORYOU_LAYOUT_CONFIG } from "../../constants/customizations/foryou_layout";

type CustomizationConfig =
  | typeof NAV_STYLE_CONFIG
  | typeof TRACKS_LAYOUT_CONFIG
  | typeof PLAYLISTS_LAYOUT_CONFIG
  | typeof DISCOVER_LAYOUT_CONFIG
  | typeof FORYOU_LAYOUT_CONFIG;

const CONFIG_MAP: Record<
  string,
  { config: CustomizationConfig; title: string }
> = {
  nav_style: { config: NAV_STYLE_CONFIG, title: "Navigation Style" },
  tracks_layout: { config: TRACKS_LAYOUT_CONFIG, title: "Tracks Layout" },
  playlists_style: {
    config: PLAYLISTS_LAYOUT_CONFIG,
    title: "Playlists Layout",
  },
  discover_layout: { config: DISCOVER_LAYOUT_CONFIG, title: "Discover Layout" },
  homescreen: { config: FORYOU_LAYOUT_CONFIG, title: "Home Screen" },
  fonts: { config: FORYOU_LAYOUT_CONFIG, title: "Fonts" },
};

export default function SettingsScreen() {
  const router = useRouter();
  const themeValues = useThemeValues();
  const { type } = useLocalSearchParams<{ type?: string }>();

  const selectedConfig =
    type && CONFIG_MAP[type]
      ? CONFIG_MAP[type]
      : { config: NAV_STYLE_CONFIG, title: "Customizations" };

  const [settingsState, setSettingsState] = React.useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [themeSettings, setThemeSettings] = React.useState<{
    navToggle: boolean;
    showNavTextToggle: boolean;
  }>({
    navToggle: true,
    showNavTextToggle: true,
  });

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await getAllSettings();

        const initialState: Record<string, boolean> = {};
        Object.values(selectedConfig.config).forEach((section: any) => {
          const settingsArray = Array.isArray(section.settings)
            ? section.settings
            : [];
          settingsArray.forEach((setting: any) => {
            if (setting.type === "toggle" && setting.defaultValue !== null) {
              initialState[setting.codename] =
                dbSettings[setting.codename] ??
                (setting.defaultValue as boolean);
            }
          });
        });

        setSettingsState(initialState);

        if (selectedConfig.title === "Navigation Style") {
          const themeData = await getThemeSettings();
          if (themeData) {
            setThemeSettings({
              navToggle: themeData.navToggle,
              showNavTextToggle: themeData.showNavTextToggle,
            });
          }
        }
      } catch (error) {
        console.warn(error);

        const fallbackState: Record<string, boolean> = {};
        Object.values(selectedConfig.config).forEach((section: any) => {
          const settingsArray = Array.isArray(section.settings)
            ? section.settings
            : [];
          settingsArray.forEach((setting: any) => {
            if (setting.type === "toggle" && setting.defaultValue !== null) {
              fallbackState[setting.codename] = setting.defaultValue as boolean;
            }
          });
        });
        setSettingsState(fallbackState);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, [selectedConfig.config, selectedConfig.title]);

  const handleSettingPress = (codename: string, type: string) => {
    triggerHaptic();
    console.log(`Setting pressed: ${codename} (type: ${type})`);
  };

  const handleToggleChange = async (codename: string, value: boolean) => {
    triggerHaptic();
    console.log(`Toggle changed: ${codename} = ${value}`);

    setSettingsState((prev) => ({
      ...prev,
      [codename]: value,
    }));

    if (codename === "navToggle" || codename === "showNavTextToggle") {
      setThemeSettings((prev) => ({ ...prev, navToggle: value }));
      try {
        await saveThemeSetting(codename, value);
        console.log(`Theme setting ${codename} saved successfully`);
      } catch (error) {
        console.warn(`Could not save theme setting ${codename}:`, error);
      }
    }

    try {
      await saveSetting(codename, value);
      console.log(`Setting ${codename} saved successfully`);
    } catch (error) {
      console.warn(`Could not save setting ${codename}:`, error);
    }
  };

  const renderSettingItem = (
    setting: any,
    sectionKey: string,
    index: number,
    isLast: boolean
  ) => {
    const { codename, name, description, emoji, type, customEmoji } = setting;

    const isToggle = type === "toggle";
    const hasRightArrow = type === "menu" || type === "action";

    const isClickable = type === "menu" || type === "action";

    const ItemComponent = isClickable ? TouchableOpacity : View;
    const itemProps = isClickable
      ? { onPress: () => handleSettingPress(codename, type) }
      : {};

    return (
      <React.Fragment key={codename}>
        <ItemComponent style={styles.settingItem} {...itemProps}>
          <View style={styles.settingIcon}>
            <MaterialIcons
              name={emoji || "settings"}
              size={24}
              color={COLORS.primary}
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
                false: COLORS.surfaceVariant,
                true: COLORS.primaryContainer,
              }}
              thumbColor={
                settingsState[codename] ? COLORS.primary : COLORS.outline
              }
              disabled={isLoading}
            />
          )}
          {hasRightArrow && (
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={COLORS.onSurfaceVariant}
            />
          )}
        </ItemComponent>
        {!isLast && <View style={styles.divider} />}
      </React.Fragment>
    );
  };

  const smallnavbar = useDynamicStyles(() => ({
    smallnavbaricon: {
      width: 20,
      height: 10,
      backgroundColor: COLORS.onSurfaceVariant,
      borderRadius: RADIUS.full,
      marginHorizontal: 0,
      opacity: 0.5,
    },
    smallnavbariconselected: {
      width: 40,
      height: 10,
      backgroundColor: COLORS.primaryContainer,
      borderRadius: RADIUS.full,
      marginHorizontal: SPACING.sm,
    },
    smallnavbar: {
      width: "100%",
      height: 20,
      backgroundColor: COLORS.surface,
      borderBottomLeftRadius: RADIUS.xl,
      borderBottomRightRadius: RADIUS.xl,
      flexDirection: "row",
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
      bottom: 0,
    },
    smallbottomleftbutton: {
      width: 25,
      height: 25,
      backgroundColor: COLORS.primaryContainer,
      borderRadius: RADIUS.sm,
      position: "absolute",
      bottom: SPACING.xl - 2,
      right: SPACING.sm,
    },
  }));

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: "row" as ViewStyle["flexDirection"],
      alignItems: "center" as ViewStyle["alignItems"],
      justifyContent: "space-between" as ViewStyle["justifyContent"],
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.sm,
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.full,
      justifyContent: "center" as ViewStyle["justifyContent"],
      alignItems: "center" as ViewStyle["alignItems"],
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
    iconBox: {
      width: "100%" as const,
      height: 120,
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: RADIUS.xl,
      marginVertical: SPACING.xl,
      opacity: 0.55,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      alignSelf: "center" as const,
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
      backgroundColor: `${COLORS.surfaceContainer}4D`,
      borderRadius: RADIUS.xl,
      overflow: "hidden" as ViewStyle["overflow"],
    },
    settingItem: {
      flexDirection: "row" as ViewStyle["flexDirection"],
      alignItems: "center" as ViewStyle["alignItems"],
      padding: SPACING.md,
      minHeight: 72,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.primaryContainer,
      justifyContent: "center" as ViewStyle["justifyContent"],
      alignItems: "center" as ViewStyle["alignItems"],
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
      alignItems: "center" as ViewStyle["alignItems"],
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={themeValues.COLORS.onSurface}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{selectedConfig.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {selectedConfig.title === "Navigation Style" && (
          <View style={styles.iconBox}>
            <View
              style={[
                smallnavbar.smallnavbar,
                !themeSettings.navToggle && {
                  backgroundColor: COLORS.background,
                },
              ]}
            >
              <View
                style={[
                  smallnavbar.smallnavbaricon,
                  !themeSettings.showNavTextToggle && {
                    backgroundColor: smallnavbar.smallnavbar.backgroundColor,
                  },
                ]}
              ></View>
              <View style={smallnavbar.smallnavbariconselected}></View>
              <View
                style={[
                  smallnavbar.smallnavbaricon,
                  !themeSettings.showNavTextToggle && {
                    backgroundColor: smallnavbar.smallnavbar.backgroundColor,
                  },
                ]}
              ></View>
            </View>
          </View>
        )}
        {/* RENDER ONE BY ONE */}
        {Object.entries(selectedConfig.config).map(
          ([sectionKey, section]: [string, any]) => {
            const settingsArray = Array.isArray(section.settings)
              ? section.settings
              : [];
            return (
              <React.Fragment key={sectionKey}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.card}>
                  {settingsArray.map((setting: any, index: number) =>
                    renderSettingItem(
                      setting,
                      sectionKey,
                      index,
                      index === settingsArray.length - 1
                    )
                  )}
                </View>
              </React.Fragment>
            );
          }
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Inami</Text>
          <Text style={styles.footerSubtext}>made by tanos</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
