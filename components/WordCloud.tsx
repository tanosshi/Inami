import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import Svg, { Text as SvgText } from "react-native-svg";
import { getTopGenres } from "../utils/database";
import { COLORS } from "../constants/theme";
import { pastelify, lightenColor } from "@/utils/colorUtils";

interface WordCloudProps {
  width?: number;
  height?: number;
  accentColor: string;
}

interface WordPosition {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

const checkCollision = (
  word: { x: number; y: number; width: number; height: number },
  placedWords: { x: number; y: number; width: number; height: number }[]
): boolean => {
  for (const placed of placedWords) {
    if (
      !(
        word.x + word.width < placed.x ||
        word.x > placed.x + placed.width ||
        word.y + word.height < placed.y ||
        word.y > placed.y + placed.height
      )
    ) {
      return true;
    }
  }
  return false;
};

const generateWordCloud = (
  words: { text: string; weight: number }[],
  width: number,
  height: number,
  accentColor: string
): WordPosition[] => {
  if (words.length === 0) return [];

  const maxWeight = Math.max(...words.map((w) => w.weight));
  const minWeight = Math.min(...words.map((w) => w.weight));
  const positions: WordPosition[] = [];
  const placedWords: { x: number; y: number; width: number; height: number }[] =
    [];

  const centerX = width / 2;
  const centerY = height / 2;

  words.forEach((word, index) => {
    const normalizedWeight =
      (word.weight - minWeight) / (maxWeight - minWeight || 1);
    const fontSize = Math.max(12, Math.min(60, 12 + normalizedWeight * 28));

    const textWidth = word.text.length * fontSize * 0.7;
    const textHeight = fontSize;

    const color =
      normalizedWeight > 0.7
        ? COLORS.background === "#000000"
          ? lightenColor(accentColor, 25)
          : accentColor
        : pastelify(accentColor);

    let placed = false;
    let angle = 0;
    let radius = 0;
    const radiusIncrement = 5;
    const angleIncrement = 0.5;

    for (let attempt = 0; attempt < 500 && !placed; attempt++) {
      const x = centerX + radius * Math.cos(angle) - textWidth / 2;
      const y = centerY + radius * Math.sin(angle) + textHeight / 4;

      const wordBox = {
        x,
        y: y - textHeight,
        width: textWidth,
        height: textHeight,
      };

      if (
        x >= 0 &&
        y - textHeight >= 0 &&
        x + textWidth <= width &&
        y <= height
      ) {
        if (!checkCollision(wordBox, placedWords)) {
          positions.push({ text: word.text, x, y, fontSize, color });
          placedWords.push(wordBox);
          placed = true;
        }
      }

      angle += angleIncrement;
      radius += radiusIncrement * (angleIncrement / (2 * Math.PI));
    }
  });

  return positions;
};

export default function WordCloud({
  width,
  height = 300,
  accentColor = "#a3e635",
}: WordCloudProps) {
  const { width: screenWidth } = useWindowDimensions();
  const containerWidth = width || screenWidth - 40;
  const containerHeight = height;

  const [words, setWords] = useState<WordPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setLoading(true);
        let genres = await getTopGenres(25);
        const positions = generateWordCloud(
          genres,
          containerWidth,
          containerHeight,
          accentColor
        );
        setWords(positions);
        setLoading(false);
      } catch (err) {
        console.error("Error loading genres:", err);
        setError("Failed to load genres");
        setLoading(false);
      }
    };

    loadGenres();
  }, [containerWidth, containerHeight, accentColor]);

  if (loading) {
    return (
      <View
        style={{
          width: containerWidth,
          height: containerHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.onBackground} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={{
          width: containerWidth,
          height: containerHeight,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <Text
          style={{
            color: COLORS.onBackground,
            textAlign: "center",
            padding: 20,
          }}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width: containerWidth,
        height: containerHeight,
        marginBottom: 25,
        backgroundColor: COLORS.background,
      }}
    >
      <Svg width={containerWidth} height={containerHeight}>
        {words.map((word, index) => (
          <SvgText
            key={`${word.text}-${index}`}
            x={word.x}
            y={word.y}
            fontSize={word.fontSize}
            fill={word.color}
            fontFamily="Inter"
            fontWeight="bold"
          >
            {word.text}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}
