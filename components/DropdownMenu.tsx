import React, { useState, useRef, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";

interface MenuItem {
  id: string;
  title: string;
  icon?: string;
  onPress: () => void;
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  menuItems: MenuItem[];
}

const { width: screenWidth } = Dimensions.get("window");

export default function DropdownMenu({
  trigger,
  menuItems,
}: DropdownMenuProps) {
  const themeValues = useThemeValues();
  const [isVisible, setIsVisible] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<View>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const styles = useDynamicStyles(() => ({
    container: {
      position: "relative",
      zIndex: 1000,
    },
    trigger: {},
    backdrop: {
      position: "absolute",
      top: -1000,
      left: -1000,
      right: -1000,
      bottom: -1000,
      backgroundColor: "transparent",
      zIndex: 1000,
    },
    menu: {
      backgroundColor: COLORS.background,
      borderRadius: RADIUS.md,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1001,
      minWidth: 180,
      maxWidth: 280,
    },
    menuContent: {
      paddingVertical: SPACING.xs,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      minHeight: 44,
    },
    menuIcon: {
      marginRight: SPACING.sm,
    },
    menuText: {
      flex: 1,
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurface,
    },
  }));

  const toggleMenu = () => {
    if (!isVisible) {
      buttonRef.current?.measure((fx, fy, width, height, px, py) => {
        setButtonPosition({ x: px, y: py });
        showMenu();
      });
    } else {
      hideMenu();
    }
  };

  const showMenu = () => {
    setIsVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();
  };

  const hideMenu = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });
  };

  const handleMenuItemPress = (onPress: () => void) => {
    hideMenu();
    onPress();
  };

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {}, 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <View ref={buttonRef} style={styles.container}>
      <TouchableOpacity onPress={toggleMenu} style={styles.trigger}>
        {trigger}
      </TouchableOpacity>

      {isVisible && (
        <>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={hideMenu}
          />

          <Animated.View
            style={[
              styles.menu,
              {
                position: "absolute",
                right: screenWidth - buttonPosition.x - SPACING.xxl,
                top: buttonPosition.y - SPACING.xxl,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.menuContent}>
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => handleMenuItemPress(item.onPress)}
                >
                  {item.icon && (
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={themeValues.COLORS.onSurface}
                      style={styles.menuIcon}
                    />
                  )}
                  <Text style={styles.menuText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </>
      )}
    </View>
  );
}
