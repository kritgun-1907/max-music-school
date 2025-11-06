// apps/mobile/src/screens/ChordsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';

interface Chord {
  name: string;
  positions: number[];
  fingers: number[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

const CHORD_LIBRARY: Chord[] = [
  { name: 'C Major', positions: [0, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], difficulty: 'beginner', category: 'Major' },
  { name: 'G Major', positions: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3], difficulty: 'beginner', category: 'Major' },
  { name: 'D Major', positions: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], difficulty: 'beginner', category: 'Major' },
  { name: 'A Major', positions: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], difficulty: 'beginner', category: 'Major' },
  { name: 'E Major', positions: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], difficulty: 'beginner', category: 'Major' },
  { name: 'A Minor', positions: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], difficulty: 'beginner', category: 'Minor' },
  { name: 'E Minor', positions: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], difficulty: 'beginner', category: 'Minor' },
  { name: 'D Minor', positions: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], difficulty: 'beginner', category: 'Minor' },
  { name: 'C7', positions: [0, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], difficulty: 'intermediate', category: 'Seventh' },
  { name: 'G7', positions: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], difficulty: 'intermediate', category: 'Seventh' },
  { name: 'F Major', positions: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], difficulty: 'intermediate', category: 'Major' },
  { name: 'B7', positions: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], difficulty: 'intermediate', category: 'Seventh' },
];

const CATEGORIES = ['All', 'Major', 'Minor', 'Seventh'];
const DIFFICULTY_LEVELS = ['All', 'beginner', 'intermediate', 'advanced'];

const ChordDiagram = ({ chord }: { chord: Chord }) => {
  const width = 200;
  const height = 250;
  const fretHeight = 40;
  const stringSpacing = 30;
  const startX = 50;
  const startY = 40;
  const numFrets = 4;

  return (
    <Svg width={width} height={height}>
      {/* Strings */}
      {[0, 1, 2, 3, 4, 5].map((string) => (
        <Line
          key={`string-${string}`}
          x1={startX + string * stringSpacing}
          y1={startY}
          x2={startX + string * stringSpacing}
          y2={startY + fretHeight * numFrets}
          stroke="#374151"
          strokeWidth={1}
        />
      ))}

      {/* Frets */}
      {[0, 1, 2, 3, 4].map((fret) => (
        <Line
          key={`fret-${fret}`}
          x1={startX}
          y1={startY + fret * fretHeight}
          x2={startX + 5 * stringSpacing}
          y2={startY + fret * fretHeight}
          stroke="#374151"
          strokeWidth={fret === 0 ? 3 : 1}
        />
      ))}

      {/* Finger Positions */}
      {chord.positions.map((position, index) => {
        if (position === -1) {
          // X mark for muted string
          return (
            <SvgText
              key={`pos-${index}`}
              x={startX + index * stringSpacing}
              y={startY - 10}
              fontSize="16"
              fill="#EF4444"
              textAnchor="middle"
            >
              ✕
            </SvgText>
          );
        } else if (position === 0) {
          // O mark for open string
          return (
            <Circle
              key={`pos-${index}`}
              cx={startX + index * stringSpacing}
              cy={startY - 10}
              r={8}
              stroke="#10B981"
              strokeWidth={2}
              fill="none"
            />
          );
        } else {
          // Finger position
          return (
            <React.Fragment key={`pos-${index}`}>
              <Circle
                cx={startX + index * stringSpacing}
                cy={startY + (position - 0.5) * fretHeight}
                r={12}
                fill="#7C3AED"
              />
              {chord.fingers[index] > 0 && (
                <SvgText
                  x={startX + index * stringSpacing}
                  y={startY + (position - 0.5) * fretHeight + 5}
                  fontSize="14"
                  fill="#FFF"
                  textAnchor="middle"
                >
                  {chord.fingers[index]}
                </SvgText>
              )}
            </React.Fragment>
          );
        }
      })}

      {/* String labels */}
      {['E', 'A', 'D', 'G', 'B', 'e'].map((note, index) => (
        <SvgText
          key={`label-${index}`}
          x={startX + index * stringSpacing}
          y={startY + fretHeight * numFrets + 20}
          fontSize="12"
          fill="#6B7280"
          textAnchor="middle"
        >
          {note}
        </SvgText>
      ))}
    </Svg>
  );
};

export default function ChordsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedChord, setSelectedChord] = useState<Chord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filteredChords = CHORD_LIBRARY.filter((chord) => {
    const matchesSearch = chord.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || chord.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === 'All' || chord.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const openChordDetail = (chord: Chord) => {
    setSelectedChord(chord);
    setModalVisible(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '#10B981';
      case 'intermediate':
        return '#F59E0B';
      case 'advanced':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  return (
    <LinearGradient colors={['#10B981', '#059669']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chord Library</Text>
        <Text style={styles.subtitle}>Learn and practice guitar chords</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#6B7280" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chords..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.filterButton,
              selectedCategory === category && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedCategory === category && styles.filterButtonTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Difficulty Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {DIFFICULTY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterButton,
              selectedDifficulty === level && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedDifficulty(level)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedDifficulty === level && styles.filterButtonTextActive,
              ]}
            >
              {level === 'All' ? level : level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chord List */}
      <FlatList
        data={filteredChords}
        keyExtractor={(item) => item.name}
        numColumns={2}
        contentContainerStyle={styles.chordList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chordCard}
            onPress={() => openChordDetail(item)}
          >
            <View style={styles.chordCardHeader}>
              <Text style={styles.chordName}>{item.name}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(item.difficulty) },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {item.difficulty.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.chordCategory}>{item.category}</Text>
            <Icon name="music-note" size={40} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      />

      {/* Chord Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Icon name="close" size={28} color="#111827" />
            </TouchableOpacity>

            {selectedChord && (
              <ScrollView>
                <Text style={styles.modalTitle}>{selectedChord.name}</Text>
                <View style={styles.modalBadges}>
                  <View style={styles.modalBadge}>
                    <Text style={styles.modalBadgeText}>
                      {selectedChord.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.modalBadge,
                      {
                        backgroundColor: getDifficultyColor(
                          selectedChord.difficulty
                        ),
                      },
                    ]}
                  >
                    <Text style={styles.modalBadgeText}>
                      {selectedChord.difficulty}
                    </Text>
                  </View>
                </View>

                <View style={styles.diagramContainer}>
                  <ChordDiagram chord={selectedChord} />
                </View>

                <View style={styles.instructions}>
                  <Text style={styles.instructionsTitle}>How to Play:</Text>
                  <View style={styles.instructionItem}>
                    <Icon name="circle" size={8} color="#6B7280" />
                    <Text style={styles.instructionText}>
                      Place your fingers on the marked frets
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Icon name="circle" size={8} color="#6B7280" />
                    <Text style={styles.instructionText}>
                      ✕ = Don't play this string
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Icon name="circle" size={8} color="#6B7280" />
                    <Text style={styles.instructionText}>
                      ○ = Play open string (no finger)
                    </Text>
                  </View>
                  <View style={styles.instructionItem}>
                    <Icon name="circle" size={8} color="#6B7280" />
                    <Text style={styles.instructionText}>
                      Numbers show which finger to use
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterButtonActive: {
    backgroundColor: '#FFF',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  filterButtonTextActive: {
    color: '#10B981',
  },
  chordList: {
    padding: 16,
  },
  chordCard: {
    flex: 1,
    margin: 6,
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minHeight: 140,
  },
  chordCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chordName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  difficultyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
  },
  chordCategory: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modalBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  modalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  modalBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  diagramContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  instructions: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
