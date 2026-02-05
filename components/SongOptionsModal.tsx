import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Share,
  Animated,
  PanResponder,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from "../constants/theme";
import { useDynamicStyles, useThemeValues } from "../hooks/useDynamicStyles";
import { useSongStore } from "../store/songStore";
import { safeString } from "../utils/safeString";
import { blendColors } from "../utils/colorUtils";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri: string;
  artwork?: string;
  is_liked: boolean;
  play_count: number;
}

interface SongOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  song: Song;
}

export default function SongOptionsModal({
  visible,
  onClose,
  song,
}: SongOptionsModalProps) {
  const themeValues = useThemeValues();
  const router = useRouter();
  const { deleteSong } = useSongStore();

  const translateY = useRef(new Animated.Value(600)).current;

  const styles = useDynamicStyles(() => ({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end" as const,
    },
    modalContainer: {
      backgroundColor: blendColors(COLORS.background, COLORS.primary, 0.04),
      borderTopLeftRadius: RADIUS.xl,
      borderTopRightRadius: RADIUS.xl,
      paddingBottom: SPACING.lg,
      paddingTop: SPACING.md,
      overflow: "hidden" as const,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: COLORS.onSurfaceVariant,
      opacity: 0.4,
      borderRadius: RADIUS.full,
      alignSelf: "center" as const,
      marginBottom: SPACING.lg,
    },
    songHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: SPACING.lg,
      marginBottom: SPACING.lg,
    },
    artwork: {
      width: 56,
      height: 56,
      borderRadius: RADIUS.md,
      marginRight: SPACING.md,
      backgroundColor: COLORS.surfaceVariant,
    },
    songInfo: {
      flex: 1,
    },
    title: {
      fontFamily: "Inter_600SemiBold",
      ...TYPOGRAPHY.titleMedium,
      color: COLORS.onSurface,
      marginBottom: 2,
    },
    artist: {
      fontFamily: "Inter_400Regular",
      ...TYPOGRAPHY.bodyMedium,
      color: COLORS.onSurfaceVariant,
    },
    optionsList: {
      paddingHorizontal: SPACING.lg,
    },
    optionItem: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingVertical: SPACING.md,
    },
    optionIcon: {
      width: 40,
      alignItems: "center" as const,
      marginRight: SPACING.md,
    },
    optionText: {
      fontFamily: "Inter_500Medium",
      ...TYPOGRAPHY.bodyLarge,
      color: COLORS.onSurface,
    },
    divider: {
      height: 1,
      backgroundColor: COLORS.outline + "20",
      marginVertical: SPACING.xs,
    },
  }));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newY = Math.max(0, gestureState.dy);
        translateY.setValue(newY);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dy > 100) {
          closeModal();
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
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const closeModal = (callback?: () => void) => {
    Animated.timing(translateY, {
      toValue: 600,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onClose();
      if (callback) callback();
    });
  };

  const handleAction = (action: () => void) => {
    closeModal(() => {
        setTimeout(action, 50);
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Song",
      `Are you sure you want to delete "${song.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSong(song.id);
            } catch (error) {
              console.error("Failed to delete song:", error);
              Alert.alert("Error", "Failed to delete song");
            }
          },
        },
      ]
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => closeModal()}
      statusBarTranslucent
    >
        <Animated.View 
            style={[
                styles.overlay,
                {
                    opacity: translateY.interpolate({
                        inputRange: [0, 600],
                        outputRange: [1, 0],
                    }),
                }
            ]}
        >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeModal()} />
            
            <Animated.View
                style={[
                    styles.modalContainer,
                    { transform: [{ translateY }] }
                ]}
                {...panResponder.panHandlers}
            >
                <View style={styles.handle} />

                <View style={styles.songHeader}>
                    <Image
                    source={{ uri: song.artwork }}
                    style={styles.artwork}
                    contentFit="cover"
                    transition={200}
                    />
                    <View style={styles.songInfo}>
                    <Text style={styles.title} numberOfLines={1}>
                        {safeString(song.title) || "Unknown Title"}
                    </Text>
                    <Text style={styles.artist} numberOfLines={1}>
                        {safeString(song.artist) || "Unknown Artist"}
                    </Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Options List */}
                <View style={styles.optionsList}>
                    {/* Add to Playlist */}
                    <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleAction(() => console.log("Add to playlist"))}
                    >
                    <View style={styles.optionIcon}>
                        <MaterialIcons
                        name="playlist-add"
                        size={24}
                        color={themeValues.COLORS.onSurface}
                        />
                    </View>
                    <Text style={styles.optionText}>Add to Playlist</Text>
                    </TouchableOpacity>

                    {/* Track Details */}
                    <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleAction(() => console.log("Track details"))}
                    >
                    <View style={styles.optionIcon}>
                        <MaterialIcons
                        name="info-outline"
                        size={24}
                        color={themeValues.COLORS.onSurface}
                        />
                    </View>
                    <Text style={styles.optionText}>Track Details</Text>
                    </TouchableOpacity>

                    {/* Artist */}
                    <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() =>
                        handleAction(() => {
                        router.push(`/artist/${encodeURIComponent(song.artist)}`);
                        })
                    }
                    >
                    <View style={styles.optionIcon}>
                        <MaterialIcons
                        name="person-outline"
                        size={24}
                        color={themeValues.COLORS.onSurface}
                        />
                    </View>
                    <Text style={styles.optionText}>Artist</Text>
                    </TouchableOpacity>

                    {/* Share */}
                    <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() =>
                        handleAction(async () => {
                        try {
                            await Share.share({
                            message: `Check out "${song.title}" by ${song.artist}`,
                            });
                        } catch (error) {
                            console.error("Error sharing song:", error);
                        }
                        })
                    }
                    >
                    <View style={styles.optionIcon}>
                        <MaterialIcons
                        name="share"
                        size={24}
                        color={themeValues.COLORS.onSurface}
                        />
                    </View>
                    <Text style={styles.optionText}>Share</Text>
                    </TouchableOpacity>

                    <View style={styles.divider} />

                    {/* Delete */}
                    <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleAction(handleDelete)}
                    >
                    <View style={styles.optionIcon}>
                        <MaterialIcons
                        name="delete-outline"
                        size={24}
                        color={themeValues.COLORS.error}
                        />
                    </View>
                    <Text style={[styles.optionText, { color: themeValues.COLORS.error }]}>
                        Delete
                    </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </Animated.View>
    </Modal>
  );
}
