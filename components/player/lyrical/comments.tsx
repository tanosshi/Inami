import React from "react";
import { View } from "react-native";
import { CommentsSection } from "../CommentLogic";

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
  if (!songId || !artistName) {
    return <View />;
  }

  return (
    <CommentsSection
      songTitle={songId}
      artistName={artistName}
      onClose={onClose}
    />
  );
}
