import React, { useRef, useEffect } from "react";
import { View, TextInput, TouchableOpacity, Animated } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useThemeValues, useDynamicStyles } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from "../../constants/theme";

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchExpanded: boolean;
  setSearchExpanded: (expanded: boolean) => void;
  placeholderArtist: string;
  searchAnimation: Animated.Value;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  searchExpanded,
  setSearchExpanded,
  placeholderArtist,
  searchAnimation,
}: SearchBarProps) {
  const themeValues = useThemeValues();
  const searchInputRef = useRef<TextInput>(null);

  const styles = useDynamicStyles(() => ({
    searchWrapper: {
      overflow: "hidden" as const,
      position: "absolute" as const,
      top: 15,
      height: 56,
      zIndex: 10,
      alignSelf: "center" as const,
      left: SPACING.md, 
      right: SPACING.md,
    },
    searchContainer: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: RADIUS.xl,
      paddingHorizontal: SPACING.md,
      height: 56,
      gap: SPACING.md,
      width: "88%" as const,
    },
    searchInput: {
      flex: 1,
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    searchInputPlaceholder: {
      fontStyle: "italic" as const,
      opacity: 0.3,
    },
  }));

  useEffect(() => {
    if (searchExpanded) searchInputRef.current?.focus();
  }, [searchExpanded]);

  useEffect(() => {
    Animated.timing(searchAnimation, {
      toValue: searchExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [searchExpanded, searchAnimation]);

  const toggleSearch = () => {
    if (searchExpanded) setSearchQuery("");
    setSearchExpanded(!searchExpanded);
  };

  const searchBarWidth = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const searchBarOpacity = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View
      style={[
        styles.searchWrapper,
        {
          width: searchBarWidth,
          opacity: searchBarOpacity,
          height: 56,
        },
      ]}
    >
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={24}
          color={themeValues.COLORS.onSurfaceVariant}
        />
        <TextInput
          ref={searchInputRef}
          style={[
            styles.searchInput,
            searchQuery === "" && styles.searchInputPlaceholder,
          ]}
          placeholder={`${placeholderArtist}?`}
          placeholderTextColor={themeValues.COLORS.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={{ marginRight: 3 }}
          onPress={() => {
            triggerHaptic();
            toggleSearch();
          }}
        >
          <MaterialIcons
            name="close"
            size={24}
            color={themeValues.COLORS.onSurfaceVariant}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
