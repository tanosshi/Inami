export interface LyricLine {
  time: number;
  text: string;
  originalTime: string;
}

export interface ParsedLyrics {
  lines: LyricLine[];
  metadata: {
    title?: string;
    artist?: string;
    album?: string;
    by?: string;
  };
}

export const parseLyrics = (lyricsText: string): ParsedLyrics => {
  const lines = lyricsText.split("\n");
  const parsed: ParsedLyrics = {
    lines: [],
    metadata: {},
  };

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    const metadataMatch = trimmedLine.match(/^\[(ti|ar|al|by):(.+)\]$/);
    if (metadataMatch) {
      const [, tag, value] = metadataMatch;
      switch (tag) {
        case "ti":
          parsed.metadata.title = value.trim();
          break;
        case "ar":
          parsed.metadata.artist = value.trim();
          break;
        case "al":
          parsed.metadata.album = value.trim();
          break;
        case "by":
          parsed.metadata.by = value.trim();
          break;
      }
      continue;
    }

    const timestampMatches = trimmedLine.matchAll(
      /\[(\d{2}):(\d{2}\.\d{2})\]/g
    );
    const timestamps = Array.from(timestampMatches);

    if (timestamps.length > 0) {
      const textPart = trimmedLine
        .replace(/\[\d{2}:\d{2}\.\d{2}\]/g, "")
        .trim();

      for (const match of timestamps) {
        const [, minutes, seconds] = match;
        const time = parseInt(minutes) * 60 * 1000 + parseFloat(seconds) * 1000;

        parsed.lines.push({
          time,
          text: textPart,
          originalTime: match[0],
        });
      }
    }
  }

  parsed.lines.sort((a, b) => a.time - b.time);

  return parsed;
};

export const getCurrentLyricIndex = (
  lyrics: ParsedLyrics,
  currentTime: number
): number => {
  if (!lyrics.lines.length) return -1;

  let currentIndex = -1;
  for (let i = 0; i < lyrics.lines.length; i++) {
    if (lyrics.lines[i].time <= currentTime) {
      currentIndex = i;
    } else {
      break;
    }
  }

  return currentIndex;
};

export const getVisibleLyrics = (
  lyrics: ParsedLyrics,
  currentIndex: number,
  visibleLines: number = 5
): LyricLine[] => {
  if (currentIndex === -1)
    return lyrics.lines.slice(0, Math.min(visibleLines, lyrics.lines.length));

  const start = Math.max(0, currentIndex - Math.floor(visibleLines / 2));
  const end = Math.min(lyrics.lines.length, start + visibleLines);

  return lyrics.lines.slice(start, end);
};
