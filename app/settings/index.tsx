import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { SETTINGS_CONFIG } from "../../constants/settings";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

export default function SettingsScreen() {
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
    Object.values(SETTINGS_CONFIG).forEach((section) => {
      section.settings.forEach((setting) => {
        if (setting.type === "toggle" && setting.defaultValue !== null) {
          initialState[setting.codename] = setting.defaultValue as boolean;
        }
      });
    });
    return initialState;
  });

  const SettingPress = (codename: string, type: string) => {
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

  const ToggleChange = (codename: string, value: boolean) => {
    console.log(`Toggle changed: ${codename} = ${value}`);
    setSettingsState((prev) => ({
      ...prev,
      [codename]: value,
    }));
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

    const ItemComponent = isClickable ? TouchableOpacity : View;
    const itemProps = isClickable
      ? { onPress: () => SettingPress(codename, type) }
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
              onValueChange={(value) => ToggleChange(codename, value)}
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
          <Text style={styles.footerText}>Myoraei</Text>
          <Text style={styles.footerSubtext}>made by tanos</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
