import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Animated,
  PanResponder,
  Dimensions,
  Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Entypo } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import {
  getAllSettings,
  getSetting,
  saveSetting,
  saveTextSetting,
} from "../../utils/database";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

import { METADATA_CONFIG } from "../../constants/customs/metadata";
import { SYNC_CONFIG } from "../../constants/customs/sync";
import { FM_CONFIG } from "../../constants/customs/fm";
import { DISCOVERY_CONFIG } from "../../constants/customs/discovery";
import { SEARCH_CONFIG } from "../../constants/customs/search";
import { DLMUSIC_CONFIG } from "../../constants/customs/dlmusic";

import { triggerHaptic } from "@/utils/haptics";

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
  const themeValues = useThemeValues();
  const router = useRouter();
  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
    },
    header: {
      flexDirection: "row" as const,
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
      color: COLORS.onSurface,
      marginBottom: SPACING.sm,
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.md,
    },
    card: {
      backgroundColor: `${COLORS.surfaceContainer}4D`,
      borderRadius: RADIUS.xl,
      overflow: "hidden" as const,
    },
    settingItem: {
      flexDirection: "row" as const,
      alignItems: "center",
      padding: SPACING.md,
      minHeight: 72,
    },
    settingIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: themeValues.COLORS.primary,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      width: "80%",
      maxWidth: 300,
    },
    modalDescription: {
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurface,
      marginBottom: SPACING.md,
      marginTop: SPACING.sm,
    },
    textInput: {
      borderWidth: 1,
      borderColor: COLORS.outline,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
      backgroundColor: COLORS.surfaceContainer,
      marginBottom: SPACING.md,
    },
    enterButton: {
      backgroundColor: themeValues.COLORS.primary,
      padding: SPACING.sm + 3,
      borderRadius: RADIUS.full,
      alignItems: "center",
    },
    enterButtonText: {
      color: COLORS.onPrimary,
      ...TYPOGRAPHY.labelLarge,
    },
    modalContainer: {
      position: "absolute" as const,
      left: 0,
      right: 0,
      bottom: 0,
      paddingTop: 20,
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: RADIUS.xxl,
      borderTopRightRadius: RADIUS.xxl,
      paddingBottom: Platform.OS === "ios" ? 28 : 20,
      height: modalContainerHeight,
    },
    modalHandle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.onSurfaceVariant,
      borderRadius: 999,
      alignSelf: "center",
      marginTop: 10,
      marginBottom: 12,
      opacity: 0.6,
    },
    modalContentArea: {
      paddingHorizontal: SPACING.lg,
      flex: 1,
    },
  }));

  const [settingsState, setSettingsState] = React.useState<
    Record<string, boolean>
  >({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [keyModalVisible, setKeyModalVisible] = React.useState(false);
  const [key, setKey] = React.useState("");

  const { height } = Dimensions.get("window");
  const modalContainerHeight = Math.min(230, height * 0.4);

  const translateY = useRef(new Animated.Value(300)).current;
  const translateYKey = useRef(new Animated.Value(300)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newY = Math.max(0, Math.min(300, gestureState.dy));
        translateY.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 300,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setModalVisible(false));
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      translateY.setValue(300);
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: 300,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, translateY]);

  useEffect(() => {
    if (keyModalVisible) {
      translateYKey.setValue(300);
      Animated.spring(translateYKey, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(translateYKey, {
        toValue: 300,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [keyModalVisible, translateYKey]);

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const dbSettings = await getAllSettings();

        const initialState: Record<string, boolean> = {};
        Object.values(config).forEach((section: any) => {
          const settingsArray = Array.isArray(section.settings)
            ? section.settings
            : Array.isArray(section.data)
            ? section.data
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
      } catch (error) {
        console.warn(error);

        const fallbackState: Record<string, boolean> = {};
        Object.values(config).forEach((section: any) => {
          const settingsArray = Array.isArray(section.settings)
            ? section.settings
            : Array.isArray(section.data)
            ? section.data
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
  }, [config]);

  React.useEffect(() => {
    const loadFmSettings = async () => {
      try {
        const dbSettings = await getAllSettings();
        setUsername(String(dbSettings.fm_username || ""));
        setKey(String(dbSettings.fm_key || ""));
      } catch (error) {
        console.warn(error);
      }
    };
    loadFmSettings();
  }, []);

  const getOverrideCodename = (): string | null => {
    for (const section of Object.values(config)) {
      const settingsArray = Array.isArray((section as any).settings)
        ? (section as any).settings
        : Array.isArray((section as any).data)
        ? (section as any).data
        : [];
      for (const setting of settingsArray) {
        if (setting.overrides === true) {
          return setting.codename;
        }
      }
    }
    return null;
  };

  const overrideCodename = getOverrideCodename();
  const isOverrideEnabled = overrideCodename
    ? settingsState[overrideCodename] ?? false
    : true;

  const handleSettingPress = (codename: string, type: string) => {
    triggerHaptic();
    if (codename === "fm_username" && type === "action") setModalVisible(true);
    else if (codename === "fm_key" && type === "action")
      setKeyModalVisible(true);
    else console.log(`Setting pressed: ${codename} (type: ${type})`);
  };

  const handleToggleChange = async (codename: string, value: boolean) => {
    triggerHaptic();
    console.log(`Toggle changed: ${codename} = ${value}`);

    setSettingsState((prev) => ({
      ...prev,
      [codename]: value,
    }));

    try {
      await saveSetting(codename, value);
      console.log(`Setting ${codename} saved successfully`);
    } catch (error) {
      console.warn(`Could not save setting ${codename}:`, error);
    }
  };

  const handleEnter = async () => {
    if (username.trim()) {
      await saveTextSetting("fm_username", username.trim());
      setModalVisible(false);
      console.log(await getSetting("fm_username"));
      if (username.trim().length > 2) {
        router.push("/settings/load-fm");
      }
    }
  };

  const handleEnterKey = async () => {
    if (key.trim()) {
      await saveTextSetting("fm_key", key.trim());
      setKeyModalVisible(false);
      console.log(await getSetting("fm_key"));
    }
  };

  const renderSettingItem = (
    setting: any,
    sectionKey: string,
    index: number,
    isLast: boolean
  ) => {
    const { codename, name, description, emoji, type, customEmoji, overrides } =
      setting;

    const isToggle = type === "toggle";
    const hasRightArrow = type === "menu" || type === "action";

    const isClickable = type === "menu" || type === "action";

    const isOverrideSetting = overrides === true;
    const isDisabled =
      !isOverrideSetting && overrideCodename && !isOverrideEnabled;

    const ItemComponent = isClickable && !isDisabled ? TouchableOpacity : View;
    const itemProps =
      isClickable && !isDisabled
        ? { onPress: () => handleSettingPress(codename, type) }
        : {};

    let EmojiIcon = MaterialIcons;
    let emojiName = emoji;
    if (customEmoji === "Entypo") {
      EmojiIcon = Entypo;
    }
    return (
      <React.Fragment key={codename}>
        <ItemComponent
          style={[styles.settingItem, isDisabled && { opacity: 0.4 }]}
          {...itemProps}
        >
          <View
            style={[
              styles.settingIcon,
              isDisabled && { backgroundColor: COLORS.surfaceVariant },
            ]}
          >
            <EmojiIcon
              name={emojiName}
              size={24}
              color={isDisabled ? COLORS.outline : COLORS.onPrimary}
            />
          </View>
          <View style={styles.settingContent}>
            <Text
              style={[
                styles.settingLabel,
                isDisabled && { color: COLORS.outline },
              ]}
            >
              {name}
            </Text>
            {description && (
              <Text
                style={[
                  styles.settingDescription,
                  isDisabled && { color: COLORS.outline },
                ]}
              >
                {description}
              </Text>
            )}
          </View>
          {isToggle && (
            <Switch
              value={settingsState[codename] || false}
              onValueChange={(value) => handleToggleChange(codename, value)}
              trackColor={{
                false: COLORS.surfaceVariant,
                true: themeValues.COLORS.primary,
              }}
              thumbColor={
                settingsState[codename] ? COLORS.onPrimary : COLORS.outline
              }
              disabled={isLoading || isDisabled}
            />
          )}
          {hasRightArrow && (
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={isDisabled ? COLORS.outline : COLORS.onSurfaceVariant}
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
        {Object.entries(config).map(([sectionKey, section]: [string, any]) => {
          const settingsArray = Array.isArray(section.settings)
            ? section.settings
            : Array.isArray(section.data)
            ? section.data
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
        })}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Inami</Text>
          <Text style={styles.footerSubtext}>made by tanos</Text>
        </View>
      </ScrollView>

      <Modal
        animationType="none"
        visible={modalVisible}
        transparent
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={true}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: translateY.interpolate({
                inputRange: [0, 300],
                outputRange: ["rgba(0,0,0,0.45)", "rgba(0,0,0,0.1)"],
              }),
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={() => {
              Animated.timing(translateY, {
                toValue: 300,
                duration: 100,
                useNativeDriver: true,
              }).start(() => setModalVisible(false));
            }}
          />
        </Animated.View>

        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.modalContentArea}>
            <Text style={styles.modalDescription}>
              Enter your Last.fm username
            </Text>
            <TextInput
              style={styles.textInput}
              value={username}
              onChangeText={setUsername}
              placeholder="Username"
            />
            <TouchableOpacity style={styles.enterButton} onPress={handleEnter}>
              <Text style={styles.enterButtonText}>Enter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>

      <Modal
        animationType="none"
        visible={keyModalVisible}
        transparent
        onRequestClose={() => setKeyModalVisible(false)}
        statusBarTranslucent={true}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              backgroundColor: translateYKey.interpolate({
                inputRange: [0, 300],
                outputRange: ["rgba(0,0,0,0.45)", "rgba(0,0,0,0.1)"],
              }),
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={() => {
              Animated.timing(translateYKey, {
                toValue: 300,
                duration: 100,
                useNativeDriver: true,
              }).start(() => setKeyModalVisible(false));
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: translateYKey }] },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.modalContentArea}>
            <Text style={styles.modalDescription}>
              Enter your Last.fm API key
            </Text>
            <TextInput
              style={styles.textInput}
              value={key}
              onChangeText={setKey}
              placeholder="API Key"
            />
            <TouchableOpacity
              style={styles.enterButton}
              onPress={handleEnterKey}
            >
              <Text style={styles.enterButtonText}>Enter</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Modal>
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
