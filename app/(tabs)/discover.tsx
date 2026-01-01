import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Image,
} from "react-native";
import { COLORS, RADIUS, SPACING } from "../../constants/theme";
import { MaterialIcons } from "@expo/vector-icons";
import { useDynamicStyles, useThemeValues } from "../../hooks/useDynamicStyles";
import { triggerHaptic } from "../../utils/haptics";

const { width } = Dimensions.get("window");
const BIG_SQUARE_SIZE = (width - SPACING.md * 3) * 0.6;

// Demo for now but we'll use a similar format
const somethingForYou = [
  { id: "1", title: "Song Title 1", artist: "Artist 1" },
  { id: "2", title: "Song Title 2", artist: "Artist 2" },
  { id: "3", title: "Song Title 3", artist: "Artist 3" },
  { id: "4", title: "Song Title 4", artist: "Artist 4" },
];
// demos too, btw titles are gonna be genres not these things
const featuredTiles = {
  scroll: {
    title: "#scroll",
    gifUrl:
      "https://lastfm.freetls.fastly.net/i/u/770x0/c91a9ddae9137346fcfe44261b15a2b8.gif#c91a9ddae9137346fcfe44261b15a2b8",
  },
  new: {
    title: "#new",
    gifUrl:
      "https://64.media.tumblr.com/c7d8c3431a4ef1e13a8fa15d51d8f2f6/tumblr_p6qhc0WijN1v1hotuo1_540.gifv",
  },
  popular: {
    title: "#popular",
    gifUrl:
      "https://i.pinimg.com/originals/14/5a/39/145a39ff4dfd8afaa067ec938aa8bc14.gif",
  },
};

const handleTilePress = (tileType: string) => {
  console.log(`Pressed ${tileType} tile`);
  // todo
};

export default function DiscoverScreen() {
  const themeValues = useThemeValues();

  const styles = useDynamicStyles(() => ({
    container: {
      flex: 1,
      backgroundColor: COLORS.background,
      paddingHorizontal: SPACING.md,
    },
    header: {
      color: COLORS.onSurface,
      fontSize: 32,
      fontWeight: "bold",
      marginTop: SPACING.md,
      marginBottom: SPACING.lg,
    },
    featuredContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginBottom: SPACING.lg,
    },
    bigSquare: {
      width: BIG_SQUARE_SIZE,
      height: BIG_SQUARE_SIZE,
      backgroundColor: COLORS.surfaceContainerHighest,
      borderRadius: 16,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    smallSquaresContainer: {
      flex: 1,
      gap: SPACING.sm,
    },
    smallSquare: {
      flex: 1,
      backgroundColor: COLORS.surfaceContainerHighest,
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    tileImage: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    },
    tileOverlay: {
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      position: "absolute",
      bottom: SPACING.sm,
      left: SPACING.sm,
    },
    squareText: {
      color: COLORS.onSurface,
      fontSize: 20,
      fontWeight: "600",
    },
    squareTextSmall: {
      color: COLORS.onSurface,
      fontSize: 16,
      fontWeight: "600",
    },
    sectionTitle: {
      color: COLORS.onSurface,
      fontSize: 22,
      fontWeight: "bold",
      marginTop: SPACING.md,
      marginBottom: SPACING.md,
    },
    fyRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: 12,
      padding: SPACING.sm,
      marginBottom: SPACING.sm,
      gap: SPACING.md,
    },
    fyThumbnail: {
      width: 56,
      height: 56,
      backgroundColor: COLORS.surfaceContainerHighest,
      borderRadius: 8,
    },
    fyInfo: {
      flex: 1,
    },
    fyTitle: {
      color: COLORS.onSurface,
      fontSize: 16,
      fontWeight: "600",
      marginBottom: 4,
    },
    fyArtist: {
      color: COLORS.onSurfaceVariant,
      fontSize: 14,
    },
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>Discover</Text>
        <MaterialIcons
          name="more-vert"
          size={24}
          color={themeValues.COLORS.onSurfaceVariant}
          style={{
            position: "absolute",
            right: SPACING.md,
            top: SPACING.md + 5,
          }}
        />

        {/* Featured */}
        <View style={styles.featuredContainer}>
          {/* Big */}
          <TouchableOpacity
            style={styles.bigSquare}
            onPress={() => { triggerHaptic(); handleTilePress("scroll"); }}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: featuredTiles.scroll.gifUrl }}
              style={styles.tileImage}
              resizeMode="cover"
            />
            <View style={styles.tileOverlay}>
              <Text style={styles.squareText}>
                {featuredTiles.scroll.title}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Small */}
          <View style={styles.smallSquaresContainer}>
            <TouchableOpacity
              style={styles.smallSquare}
              onPress={() => { triggerHaptic(); handleTilePress("new"); }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: featuredTiles.new.gifUrl }}
                style={styles.tileImage}
                resizeMode="cover"
              />
              <View style={styles.tileOverlay}>
                <Text style={styles.squareTextSmall}>
                  {featuredTiles.new.title}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallSquare}
              onPress={() => { triggerHaptic(); handleTilePress("popular"); }}
              activeOpacity={0.8}
            >
              <Image
                source={{ uri: featuredTiles.popular.gifUrl }}
                style={styles.tileImage}
                resizeMode="cover"
              />
              <View style={styles.tileOverlay}>
                <Text style={styles.squareTextSmall}>
                  {featuredTiles.popular.title}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: SPACING.md,
          }}
        >
          <Text style={styles.sectionTitle}>Something For You</Text>
          <TouchableOpacity
            onPress={() => { triggerHaptic(); handleTilePress("refresh"); }}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="refresh"
              size={22}
              style={{ marginRight: SPACING.sm, marginBottom: 2 }}
              color={themeValues.COLORS.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>

        {/* only play small part, if plus pressed add full song to tracks (we'll cache entire songs and check waveforms for peaks UNLESSS spotify has an preview api) */}
        {/* todo place plus at the right side of the container,press tile to play music (also give IDs to container per song) */}
        {somethingForYou.map((item) => (
          <View key={item.id} style={styles.fyRow}>
            <View style={styles.fyThumbnail} />
            <View style={styles.fyInfo}>
              <Text style={styles.fyTitle}>{item.title}</Text>
              <Text style={styles.fyArtist}>{item.artist}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
