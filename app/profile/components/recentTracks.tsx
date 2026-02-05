import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const { width } = Dimensions.get('window');
const CONTENT_PADDING = 24;
const COLUMN_GAP = 12;
const ITEM_WIDTH = (width - (CONTENT_PADDING * 2) - COLUMN_GAP) / 2;

interface Track {
  id?: string;
  image_url: string;
  [key: string]: any;
}

interface RecentTracksProps {
  randomTracks: Track[];
}

export default function RecentTracks({ randomTracks }: RecentTracksProps) {
  return (
    <View>
      <Text style={styles.sectionTitle}>recent tracks</Text>
      
      <View style={styles.gridContainer}>
        {randomTracks.map((track, index) => (
          <TouchableOpacity 
            key={track.id || index}
            style={styles.albumCard}
            activeOpacity={0.7}
            //onPress={() => router.push(`/track/${track.id}`)}
          >
            <Image 
              source={track.image_url}
              style={styles.albumImage}
              contentFit="cover"
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 40,
    gap: COLUMN_GAP,
  },
  albumCard: {
    width: ITEM_WIDTH,
    aspectRatio: 1,
    borderRadius: 19,
    overflow: 'hidden',
    backgroundColor: '#1f2937',
  },
  albumImage: {
    width: '100%',
    height: '100%',
  },
});
