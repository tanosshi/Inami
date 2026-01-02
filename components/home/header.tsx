import React, { useRef } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const SettingsButton = ({ onPress }: { onPress: () => void }) => {
  const themeValues = useThemeValues();
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

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
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(rotation, {
          toValue: 15,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(rotation, {
          toValue: 0,
          damping: 8,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [-360, 360],
    outputRange: ["-360deg", "360deg"],
  });

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={buttonStyles.settingsButton}
    >
      <Animated.View
        style={{
          transform: [{ scale }, { rotate: rotateInterpolate }],
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
