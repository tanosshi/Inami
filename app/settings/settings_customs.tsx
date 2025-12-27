import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";

import { METADATA_CONFIG } from "../../constants/customs/metadata";
import { SYNC_CONFIG } from "../../constants/customs/sync";
import { FM_CONFIG } from "../../constants/customs/fm";
import { DISCOVERY_CONFIG } from "../../constants/customs/discovery";
import { SEARCH_CONFIG } from "../../constants/customs/search";
import { DLMUSIC_CONFIG } from "../../constants/customs/dlmusic";

type SettingsConfig =
  | typeof METADATA_CONFIG
  | typeof SYNC_CONFIG
  | typeof FM_CONFIG
  | typeof DISCOVERY_CONFIG
  | typeof DLMUSIC_CONFIG
  | typeof SEARCH_CONFIG;

function SettingsScreen({
  config,
  title,
}: {
  config: SettingsConfig;
  title: string;
}) {
  const router = useRouter();

  const [settingsState, setSettingsState] = React.useState<
    Record<string, boolean>
  >(() => {
    const initialState: Record<string, boolean> = {};
    Object.values(config).forEach((section) => {
      const settingsArray = section.settings || section.data || [];
      settingsArray.forEach((setting: any) => {
        if (setting.type === "toggle" && setting.defaultValue !== null) {
          initialState[setting.codename] = setting.defaultValue as boolean;
        }
      });
    });
    return initialState;
  });

  const handleSettingPress = (codename: string, type: string) => {
    console.log(`Setting pressed: ${codename} (type: ${type})`);
  };

  const handleToggleChange = (codename: string, value: boolean) => {
    console.log(`Toggle changed: ${codename} = ${value}`);
    setSettingsState((prev) => ({
      ...prev,
      [codename]: value,
    }));
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

    const isClickable = type === "menu" || type === "action";

    const ItemComponent = isClickable ? TouchableOpacity : View;
    const itemProps = isClickable
      ? { onPress: () => handleSettingPress(codename, type) }
      : {};

    return (
      <React.Fragment key={codename}>
        <ItemComponent style={styles.settingItem} {...itemProps}>
          <View style={styles.settingIcon}>
            <MaterialIcons name={emoji} size={24} color={COLORS.primary} />
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* RENDER ONE BY ONE */}
        {Object.entries(config).map(([sectionKey, section]) => {
          const settingsArray = section.settings || section.data || [];
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
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Myoraei</Text>
          <Text style={styles.footerSubtext}>made by tanos</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function SettingsMetadataScreen() {
  return <SettingsScreen config={METADATA_CONFIG} title="Fetch ID3" />;
}

export function SettingsSyncScreen() {
  return <SettingsScreen config={SYNC_CONFIG} title="Syncing" />;
}

export function SettingsFmScreen() {
  return <SettingsScreen config={FM_CONFIG} title="Last.fm" />;
}
export function SettingsDiscoveryScreen() {
  return <SettingsScreen config={DISCOVERY_CONFIG} title="Discovery" />;
}
export function SettingsSearchScreen() {
  return <SettingsScreen config={SEARCH_CONFIG} title="Search" />;
}
export function SettingsDLScreen() {
  return <SettingsScreen config={DLMUSIC_CONFIG} title="Download Music" />;
}

const styles = StyleSheet.create({
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
});
