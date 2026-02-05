import React from "react";
import SongCard from "../SongCard";

interface SongListItemProps {
  song: any;
  onPress: () => void;
  onLongPress?: () => void;
  showOptions?: boolean;
}

function SongListItem({
  song,
  onPress,
  onLongPress,
  showOptions = true,
}: SongListItemProps) {
  return (
    <SongCard
      song={song}
      onPress={onPress}
      onLongPress={onLongPress}
      showOptions={showOptions}
    />
  );
}

export default React.memo(SongListItem, (prev, next) => {
  return (
    prev.song.id === next.song.id &&
    prev.song.title === next.song.title &&
    prev.song.artist === next.song.artist &&
    prev.song.artwork === next.song.artwork &&
    prev.song.is_liked === next.song.is_liked &&
    prev.onPress === next.onPress &&
    prev.onLongPress === next.onLongPress &&
    prev.showOptions === next.showOptions
  );
});
