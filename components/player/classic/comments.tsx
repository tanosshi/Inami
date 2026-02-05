import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { CommentsSection } from "../CommentLogic";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../../../constants/theme";
import { getSongComments } from "../../../utils/database/songCommentOperations";

interface CommentsProps {
  songId?: string;
  artistName?: string;
  onClose?: () => void;
}

export default function Comments({
  songId,
  artistName,
  onClose,
}: CommentsProps) {
  const [hasComments, setHasComments] = useState<boolean | null>(null);

  useEffect(() => {
    if (songId && artistName) {
      getSongComments(songId, artistName).then((comments) => {
        setHasComments(comments.length > 0);
      });
    }
  }, [songId, artistName]);

  if (!songId || !artistName) {
    return <View style={{ flex: 1, backgroundColor: COLORS.background }} />;
  }

  if (hasComments === null) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.md,
          }}
        >
          <Text
            style={{
              paddingLeft: SPACING.sm,
              fontSize: 18,
              fontWeight: "bold",
              color: COLORS.onSurface,
            }}
          >
            Comments
          </Text>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={{ padding: SPACING.sm, marginRight: SPACING.xs }}
            >
              <MaterialIcons name="close" size={15} color={COLORS.onSurface} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (hasComments === false) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.lg,
            paddingBottom: SPACING.md,
          }}
        >
          <Text
            style={{
              paddingLeft: SPACING.sm,
              fontSize: 18,
              fontWeight: "bold",
              color: COLORS.onSurface,
            }}
          >
            Comments
          </Text>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={{ padding: SPACING.sm, marginRight: SPACING.xs }}
            >
              <MaterialIcons name="close" size={15} color={COLORS.onSurface} />
            </TouchableOpacity>
          )}
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: COLORS.onSurfaceVariant,
              fontSize: 14,
            }}
          >
            No comments yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <CommentsSection
      songTitle={songId}
      artistName={artistName}
      onClose={onClose}
    />
  );
}
