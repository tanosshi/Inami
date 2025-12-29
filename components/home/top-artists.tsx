import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../../constants/theme";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";

const { width } = Dimensions.get("window");
const BIG_SQUARE_SIZE = (width - SPACING.md * 3) * 0.55;

interface Artist {
  name: string;
  playCount: number;
  image?: string;
}

interface TopArtistsProps {
  topArtists: Artist[];
}

export default function TopArtists({ topArtists }: TopArtistsProps) {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    section: {
      marginBottom: SPACING.lg,
    },
    sectionTitle: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurface,
      marginBottom: SPACING.md,
    },
    featuredContainer: {
      flexDirection: "row" as const,
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    bigSquare: {
      width: BIG_SQUARE_SIZE,
      height: BIG_SQUARE_SIZE,
      backgroundColor: COLORS.surfaceContainerHighest,
      borderRadius: RADIUS.xxl,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    bigSquareImage: {
      width: "100%" as const,
      height: "100%" as const,
      borderRadius: RADIUS.xxl,
    },
    smallSquaresContainer: {
      flex: 1,
      gap: SPACING.sm + 2,
    },
    smallSquare: {
      flex: 1,
      backgroundColor: COLORS.surfaceContainerHighest,
      borderRadius: RADIUS.xxl,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    smallSquareImage: {
      width: "100%" as const,
      height: "100%" as const,
      borderRadius: RADIUS.xxl,
    },
  }));

  if (topArtists.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Your Top Artists</Text>

      <View style={styles.featuredContainer}>
        {/* Big #1 */}
        <TouchableOpacity style={styles.bigSquare}>
          {topArtists[0]?.image ? (
            <Image
              source={{ uri: topArtists[0].image }}
              style={styles.bigSquareImage}
              contentFit="cover"
            />
          ) : (
            <MaterialIcons
              name="person"
              size={48}
              color={themeValues.COLORS.primary}
            />
          )}
        </TouchableOpacity>

        {/* Small #2, #3 */}
        <View style={styles.smallSquaresContainer}>
          {[1, 2].map((index) => (
            <TouchableOpacity key={index} style={styles.smallSquare}>
              {topArtists[index]?.image ? (
                <Image
                  source={{ uri: topArtists[index].image }}
                  style={styles.smallSquareImage}
                  contentFit="cover"
                />
              ) : (
                <MaterialIcons
                  name="person"
                  size={32}
                  color={themeValues.COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}
