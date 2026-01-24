import React, { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { Image } from "expo-image";
import { COLORS, SPACING, RADIUS } from "../../constants/theme";
import { useDynamicStyles } from "../../hooks/useDynamicStyles";
import {
  getArtistComments,
  ArtistComment,
} from "../../utils/database/artistCommentOperations";

interface CommentItem {
  id: string;
  author: string;
  comment: string;
  profile?: string;
}

interface CommentCardProps {
  comment: CommentItem;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  const styles = useDynamicStyles(() => ({
    commentCard: {
      backgroundColor: COLORS.background,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.sm,
    },
    commentHeader: {
      flexDirection: "row" as const,
      alignItems: "flex-start" as const,
      marginBottom: SPACING.xs,
      gap: SPACING.sm,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primary,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      position: "relative" as const,
    },
    authorContainer: {
      flex: 1,
    },
    authorText: {
      fontSize: 14,
      fontWeight: "600" as const,
      color: COLORS.onSurface,
    },
    siteIndicator: {
      fontSize: 8,
      color: COLORS.onSurfaceVariant,
      opacity: 0.7,
      marginTop: 1,
    },
    commentText: {
      fontSize: 14,
      color: COLORS.onSurface,
      lineHeight: 20,
      marginTop: SPACING.xs,
      marginBottom: SPACING.sm,
    },
  }));

  const getAvatarLetter = (author: string) => {
    return author.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.avatar}>
          <Text
            style={{
              color: COLORS.onPrimary,
              fontSize: 14,
              fontWeight: "bold",
              position: "absolute" as const,
            }}
          >
            {getAvatarLetter(comment.author)}
          </Text>
          {comment.profile ? (
            <Image
              source={{ uri: comment.profile }}
              style={{
                width: 32,
                height: 32,
                borderRadius: RADIUS.md,
                position: "absolute" as const,
              }}
              contentFit="cover"
            />
          ) : null}
        </View>
        <View style={styles.authorContainer}>
          <Text style={styles.authorText}>{comment.author}</Text>
          <Text style={styles.siteIndicator}>PLACEHOLDER_X</Text>
          {/* either show site or scrobbles from artist from commenter */}
        </View>
      </View>
      <Text style={styles.commentText}>{comment.comment}</Text>
    </View>
  );
};

interface CommentsSectionProps {
  artistName: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  artistName,
}) => {
  const [comments, setComments] = useState<ArtistComment[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
      const fetched = await getArtistComments(artistName);
      setComments(fetched);
    };
    fetchComments();
  }, [artistName]);

  const styles = useDynamicStyles(() => ({
    container: {
      paddingTop: SPACING.lg,
      paddingBottom: 120,
      paddingHorizontal: SPACING.sm + 3,
    },
    sectionHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: SPACING.sm,
      marginBottom: SPACING.md,
    },
    sectionTitle: {
      paddingLeft: SPACING.sm,
      fontSize: 18,
      fontWeight: "bold" as const,
      color: COLORS.onSurface,
    },
  }));

  const hasComments = comments.length > 0;

  if (!hasComments) {
    return null;
  }

  const commentItems: CommentItem[] = comments.map((c) => ({
    id: c.id?.toString() || "",
    author: c.userName,
    comment: c.text,
    profile: c.profile,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Comments</Text>
      </View>

      <FlatList
        data={commentItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommentCard comment={item} />}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        initialNumToRender={5}
      />
    </View>
  );
};
