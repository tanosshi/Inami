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
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { SETTINGS_CONFIG } from "../../constants/settings";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "@/utils/haptics";
import { getAllSettings, saveSetting } from "../../utils/database";
import * as FileSystem from "expo-file-system/legacy";

export default function SettingsScreen() {
  const [cacheSize, setCacheSize] = React.useState<number | null>(null);

  const getDirectorySize = async (dirUri: string): Promise<number> => {
    let total = 0;
    try {
      const items = await FileSystem.readDirectoryAsync(dirUri);
      for (const item of items) {
        const itemUri = dirUri.endsWith("/")
          ? dirUri + item
          : dirUri + "/" + item;
        const info = await FileSystem.getInfoAsync(itemUri);
        if (info.isDirectory) {
          total += await getDirectorySize(itemUri);
        } else if (
          info.exists &&
          !info.isDirectory &&
          typeof info.size === "number"
        ) {
          total += info.size;
        }
      }
    } catch {}
    return total;
  };

  React.useEffect(() => {
    const loadCacheSize = async () => {
      try {
        if (FileSystem.cacheDirectory) {
          const size = await getDirectorySize(FileSystem.cacheDirectory);
          setCacheSize(size);
        } else {
          setCacheSize(null);
        }
      } catch {
        setCacheSize(null);
      }
    };
    loadCacheSize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const router = useRouter();
  const themeValues = useThemeValues();
  const [versionTapCount, setVersionTapCount] = React.useState(0);
  const versionTapTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

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

  const [settingsState, setSettingsState] = React.useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await getAllSettings();

        const initialState: Record<string, boolean> = {};
        Object.values(SETTINGS_CONFIG).forEach((section) => {
          section.settings.forEach((setting) => {
            if (setting.type === "toggle" && setting.defaultValue !== null) {
              initialState[setting.codename] =
                dbSettings[setting.codename] ??
                (setting.defaultValue as boolean);
            }
          });
        });

        setSettingsState(initialState);
      } catch (error) {
        console.warn("Could not load settings from database:", error);

        const fallbackState: Record<string, boolean> = {};
        Object.values(SETTINGS_CONFIG).forEach((section) => {
          section.settings.forEach((setting) => {
            if (setting.type === "toggle" && setting.defaultValue !== null)
              fallbackState[setting.codename] = setting.defaultValue as boolean;
          });
        });
        setSettingsState(fallbackState);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const SettingPress = (codename: string, type: string) => {
    triggerHaptic();
    console.log(`Setting pressed: ${codename} (type: ${type})`);

    switch (codename) {
      case "version":
        VersionTap();
        break;
      case "customize":
        router.push("/customization");
        break;
      case "fetch_id3":
        router.push("/settings/fetch-id3");
        break;
      case "syncing":
        router.push("/settings/syncing");
        break;
      case "lastfm":
        router.push("/settings/lastfm");
        break;
      case "discover":
        router.push("/settings/discovery");
        break;
      case "search":
        router.push("/settings/search");
        break;
      case "dlmusic":
        router.push("/settings/download");
        break;
      case "redo_welcome":
        router.push("/landing");
        break;
      default:
        break;
    }
  };

  const ToggleChange = async (codename: string, value: boolean) => {
    console.log(`Toggle changed: ${codename} = ${value}`);
    setSettingsState((prev) => ({
      ...prev,
      [codename]: value,
    }));

    try {
      await saveSetting(codename, value);
      console.log(`${codename} ok`);
    } catch (error) {
      console.warn(`${codename}:`, error);
    }
  };

  const VersionTap = () => {
    if (versionTapTimeout.current) {
      clearTimeout(versionTapTimeout.current);
    }

    const newCount = versionTapCount + 1;
    if (newCount >= 3) {
      setVersionTapCount(0);
      router.push("/demo");
    } else {
      setVersionTapCount(newCount);
      versionTapTimeout.current = setTimeout(() => {
        setVersionTapCount(0);
      }, 500);
    }
  };

  const renderSettingItem = (
    setting: any,
    sectionKey: string,
    index: number,
    isLast: boolean
  ) => {
    const { codename, name, description, emoji, type } = setting;

    const isToggle = type === "toggle";
    const hasRightArrow = type === "menu" || type === "action";

    const isClickable =
      type === "menu" || type === "action" || codename === "version";

    let shownDescription = description;
    if (codename === "clear_cache") {
      if (cacheSize == null) {
        shownDescription = "0 MB used";
      } else {
        const mb = cacheSize / (1024 * 1024);
        shownDescription = `${mb.toFixed(1)} MB used`;
      }
    }

    const ItemComponent = isClickable ? TouchableOpacity : View;
    const itemProps = isClickable
      ? { onPress: () => SettingPress(codename, type) }
      : {};

    return (
      <React.Fragment key={codename}>
        <ItemComponent style={[styles.settingItem]} {...itemProps}>
          <View style={[styles.settingIcon]}>
            <MaterialIcons
              name={emoji}
              size={24}
              color={themeValues.COLORS.primary}
            />
          </View>
          <View style={[styles.settingContent]}>
            <Text style={styles.settingLabel}>{name}</Text>
            {shownDescription && (
              <Text style={styles.settingDescription}>{shownDescription}</Text>
            )}
          </View>
          {isToggle && (
            <Switch
              value={settingsState[codename] || false}
              onValueChange={(value) => {
                ToggleChange(codename, value);
                triggerHaptic();
              }}
              trackColor={{
                false: themeValues.COLORS.surfaceVariant,
                true: themeValues.COLORS.primaryContainer,
              }}
              thumbColor={
                settingsState[codename]
                  ? themeValues.COLORS.primary
                  : themeValues.COLORS.outline
              }
              disabled={isLoading}
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
        {!isLast && <View style={[styles.divider]} />}
      </React.Fragment>
    );
  };

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
        <Text style={styles.title}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* RENDER ONE BY ONE */}
        {Object.entries(SETTINGS_CONFIG).map(([sectionKey, section]) => (
          <React.Fragment key={sectionKey}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.settings.map((setting, index) =>
                renderSettingItem(
                  setting,
                  sectionKey,
                  index,
                  index === section.settings.length - 1
                )
              )}
            </View>
          </React.Fragment>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Inami</Text>
          <Text style={styles.footerSubtext}>made by tanos</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
