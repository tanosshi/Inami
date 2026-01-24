import React, { useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

const getGreeting = () => {
  const hour = new Date().getHours();

  const timeOfDay =
    hour < 5
      ? "night"
      : hour < 12
      ? "morning"
      : hour < 17
      ? "afternoon"
      : hour < 22
      ? "evening"
      : "night";

  const timeGreetings = {
    morning: ["Good morning", "Morning!"],
    afternoon: ["Good afternoon", "Afternoon!"],
    evening: ["Good evening", "Evening!"],
    night: ["Good evening", "Night owl huh?"],
  } as const;

  const generalGreetings = [
    "Missed you",
    "Welcome back",
    "Nice to see you",
    "Hey there",
    "helloo!!",
    "Whats up",
  ];

  const useTimeGreeting = Math.random() < 0.4;
  if (useTimeGreeting) {
    const pool = timeGreetings[timeOfDay] ?? timeGreetings.morning;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const general =
    generalGreetings[Math.floor(Math.random() * generalGreetings.length)];

  return general;
};

const SettingsButton = ({ onPress }: { onPress: () => void }) => {
  const themeValues = useThemeValues();
  const scale = useRef(new Animated.Value(1)).current;

  const buttonStyles = useDynamicStyles(() => ({
    settingsButton: {
      width: 48,
      height: 48,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
  }));

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.85,
      damping: 15,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 12,
      stiffness: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={buttonStyles.settingsButton}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
      >
        <MaterialIcons
          name="more-vert"
          size={24}
          color={themeValues.COLORS.onSurfaceVariant}
        />
      </Animated.View>
    </Pressable>
  );
};

interface HeaderProps {
  onSettingsPress: () => void;
}

export default function Header({ onSettingsPress }: HeaderProps) {
  const styles = useDynamicStyles(() => ({
    header: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "flex-start" as const,
      marginBottom: SPACING.lg,
    },
    greeting: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.headlineLarge,
      color: COLORS.onSurface,
      marginTop: 4,
    },
  }));

  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.title}>Inami</Text>
      </View>
      <SettingsButton onPress={onSettingsPress} />
    </View>
  );
}
