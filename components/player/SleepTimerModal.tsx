import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import {
  startSleepTimer,
  cancelSleepTimer,
  isSleepTimerActive,
  getSleepTimerRemaining,
  SLEEP_TIMER_PRESETS,
} from "../../utils/sleepTimer";

interface SleepTimerModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SleepTimerModal({
  visible,
  onClose,
}: SleepTimerModalProps) {
  const themeValues = useThemeValues();
  const [timerActive, setTimerActive] = useState(isSleepTimerActive());
  const [remainingTime, setRemainingTime] = useState(getSleepTimerRemaining());
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customHours, setCustomHours] = useState("");
  const [customMinutes, setCustomMinutes] = useState("");

  useEffect(() => {
    if (visible) {
      setTimerActive(isSleepTimerActive());
      setRemainingTime(getSleepTimerRemaining());
      setShowCustomInput(false);
      setCustomHours("");
      setCustomMinutes("");
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !timerActive) return;

    const interval = setInterval(() => {
      const remaining = getSleepTimerRemaining();
      setRemainingTime(remaining);
      if (remaining <= 0) {
        setTimerActive(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, timerActive]);

  const formatTime = (ms: number): string => {
    if (ms <= 0) return "0:00";
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleSelectPreset = (minutes: number) => {
    startSleepTimer(minutes);
    setTimerActive(true);
    setRemainingTime(minutes * 60 * 1000);
    onClose();
  };

  const handleCancelTimer = () => {
    cancelSleepTimer();
    setTimerActive(false);
    setRemainingTime(0);
  };

  const handleSetCustomTime = () => {
    const hours = parseInt(customHours, 10) || 0;
    const mins = parseInt(customMinutes, 10) || 0;
    const totalMinutes = hours * 60 + mins;

    if (totalMinutes > 0) {
      startSleepTimer(totalMinutes);
      setTimerActive(true);
      setRemainingTime(totalMinutes * 60 * 1000);
      setShowCustomInput(false);
      onClose();
    }
  };

  const styles = useDynamicStyles(() => ({
    overlay: {
      flex: 1,
      justifyContent: "flex-end" as const,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContainer: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingBottom: SPACING.lg,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.onSurfaceVariant,
      opacity: 0.4,
      borderRadius: RADIUS.full,
      alignSelf: "center" as const,
      marginTop: SPACING.sm,
      marginBottom: SPACING.md,
    },
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingHorizontal: SPACING.lg,
      paddingBottom: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.outline + "20",
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleLarge,
      color: COLORS.onSurface,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.surfaceVariant,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    activeTimerContainer: {
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.lg,
    },
    timerRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      marginBottom: SPACING.md,
    },
    timerIcon: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.full,
      backgroundColor: COLORS.primaryContainer,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      marginRight: SPACING.sm,
    },
    timerTextContainer: {
      flexDirection: "row" as const,
      alignItems: "baseline" as const,
      gap: SPACING.xs,
    },
    timerText: {
      fontFamily: "Inter_700Bold",
      fontSize: 24,
      color: COLORS.primary,
    },
    timerLabel: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodySmall,
      marginLeft: SPACING.xs,
      color: COLORS.onSurfaceVariant,
    },
    cancelButton: {
      backgroundColor: COLORS.primaryContainer,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.full,
      width: "100%" as const,
      alignItems: "center" as const,
    },
    cancelButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
    },
    presetsContainer: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.md,
    },
    sectionTitle: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelMedium,
      color: COLORS.onSurfaceVariant,
      textTransform: "uppercase" as const,
      letterSpacing: 0.5,
      marginBottom: SPACING.sm,
    },
    presetsGrid: {
      flexDirection: "row" as const,
      flexWrap: "wrap" as const,
      gap: SPACING.sm,
    },
    presetButton: {
      backgroundColor: COLORS.surfaceVariant,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.lg,
      minWidth: 90,
      alignItems: "center" as const,
    },
    presetButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurface,
    },
    customButton: {
      backgroundColor: COLORS.primaryContainer,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.lg,
      minWidth: 90,
      alignItems: "center" as const,
    },
    customButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.primary,
    },
    customInputContainer: {
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.lg,
    },
    customInputRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: SPACING.md,
      marginBottom: SPACING.lg,
    },
    inputGroup: {
      alignItems: "center" as const,
    },
    inputLabel: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.labelSmall,
      color: COLORS.onSurfaceVariant,
      marginBottom: SPACING.xs,
    },
    timeInput: {
      backgroundColor: COLORS.surfaceVariant,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      fontFamily: "Inter_600SemiBold",
      fontSize: 32,
      color: COLORS.onSurface,
      textAlign: "center" as const,
      minWidth: 80,
    },
    inputSeparator: {
      fontFamily: "Inter_600SemiBold",
      fontSize: 32,
      color: COLORS.onSurfaceVariant,
      marginTop: SPACING.md,
    },
    customButtonsRow: {
      flexDirection: "row" as const,
      gap: SPACING.sm,
      justifyContent: "center" as const,
    },
    backButton: {
      backgroundColor: COLORS.surfaceVariant,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.full,
    },
    backButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onSurface,
    },
    setButton: {
      backgroundColor: COLORS.primary,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm + 2,
      borderRadius: RADIUS.full,
    },
    setButtonDisabled: {
      backgroundColor: COLORS.surfaceVariant,
    },
    setButtonText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.labelLarge,
      color: COLORS.onPrimary,
    },
    setButtonTextDisabled: {
      color: COLORS.onSurfaceVariant,
    },
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.modalContainer}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Sleep Timer</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <MaterialIcons
                name="close"
                size={20}
                color={themeValues.COLORS.onSurface}
              />
            </TouchableOpacity>
          </View>

          {timerActive ? (
            <View style={styles.activeTimerContainer}>
              <View style={styles.timerRow}>
                <View style={styles.timerIcon}>
                  <MaterialIcons
                    name="timer"
                    size={20}
                    color={themeValues.COLORS.primary}
                  />
                </View>
                <View style={styles.timerTextContainer}>
                  <Text style={styles.timerText}>
                    {formatTime(remainingTime)}
                  </Text>
                  <Text style={styles.timerLabel}>until the music stops</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelTimer}
              >
                <Text style={styles.cancelButtonText}>Cancel Timer</Text>
              </TouchableOpacity>
            </View>
          ) : showCustomInput ? (
            <View style={styles.customInputContainer}>
              <Text style={styles.sectionTitle}>Set custom time</Text>
              <View style={styles.customInputRow}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Hours</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={customHours}
                    onChangeText={(text) =>
                      setCustomHours(text.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
                  />
                </View>
                <Text style={styles.inputSeparator}>:</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Minutes</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={customMinutes}
                    onChangeText={(text) =>
                      setCustomMinutes(text.replace(/[^0-9]/g, ""))
                    }
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="0"
                    placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
                  />
                </View>
              </View>
              <View style={styles.customButtonsRow}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowCustomInput(false)}
                >
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.setButton,
                    !(
                      parseInt(customHours, 10) || parseInt(customMinutes, 10)
                    ) && styles.setButtonDisabled,
                  ]}
                  onPress={handleSetCustomTime}
                  disabled={
                    !(parseInt(customHours, 10) || parseInt(customMinutes, 10))
                  }
                >
                  <Text
                    style={[
                      styles.setButtonText,
                      !(
                        parseInt(customHours, 10) || parseInt(customMinutes, 10)
                      ) && styles.setButtonTextDisabled,
                    ]}
                  >
                    Set Timer
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <ScrollView style={styles.presetsContainer}>
              <Text style={styles.sectionTitle}>Stop music after</Text>
              <View style={styles.presetsGrid}>
                {SLEEP_TIMER_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.minutes}
                    style={styles.presetButton}
                    onPress={() => handleSelectPreset(preset.minutes)}
                  >
                    <Text style={styles.presetButtonText}>{preset.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.customButton}
                  onPress={() => setShowCustomInput(true)}
                >
                  <Text style={styles.customButtonText}>Custom</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
