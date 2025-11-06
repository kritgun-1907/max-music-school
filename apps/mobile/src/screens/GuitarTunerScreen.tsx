// apps/mobile/src/screens/GuitarTunerScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Audio } from 'expo-av';

interface GuitarString {
  note: string;
  frequency: number;
  color: string[];
}

const GUITAR_STRINGS: GuitarString[] = [
  { note: 'E', frequency: 329.63, color: ['#EF4444', '#DC2626'] }, // High E
  { note: 'B', frequency: 246.94, color: ['#F59E0B', '#D97706'] },
  { note: 'G', frequency: 196.00, color: ['#10B981', '#059669'] },
  { note: 'D', frequency: 146.83, color: ['#3B82F6', '#2563EB'] },
  { note: 'A', frequency: 110.00, color: ['#8B5CF6', '#7C3AED'] },
  { note: 'E', frequency: 82.41, color: ['#EC4899', '#DB2777'] }, // Low E
];

export default function GuitarTunerScreen() {
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [tuningMode, setTuningMode] = useState<'standard' | 'chromatic'>('standard');
  
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playNote = async (guitarString: GuitarString, index: number) => {
    try {
      // Stop current sound if playing
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
      }

      setSelectedString(index);
      setIsPlaying(true);

      // Generate tone using frequency
      // Note: In production, use actual audio files or a tone generator library
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: `tone://${guitarString.frequency}` }, // Placeholder
        { shouldPlay: true, isLooping: true }
      );

      setSound(newSound);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Error playing note:', error);
      setIsPlaying(false);
      setSelectedString(null);
    }
  };

  const stopNote = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
    setIsPlaying(false);
    setSelectedString(null);
  };

  return (
    <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Guitar Tuner</Text>
        <Text style={styles.subtitle}>Tune your guitar perfectly</Text>
      </View>

      {/* Tuning Mode Selector */}
      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            tuningMode === 'standard' && styles.modeButtonActive,
          ]}
          onPress={() => setTuningMode('standard')}
        >
          <Text
            style={[
              styles.modeButtonText,
              tuningMode === 'standard' && styles.modeButtonTextActive,
            ]}
          >
            Standard Tuning
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            tuningMode === 'chromatic' && styles.modeButtonActive,
          ]}
          onPress={() => setTuningMode('chromatic')}
        >
          <Text
            style={[
              styles.modeButtonText,
              tuningMode === 'chromatic' && styles.modeButtonTextActive,
            ]}
          >
            Chromatic
          </Text>
        </TouchableOpacity>
      </View>

      {/* Microphone Input Indicator */}
      <View style={styles.micContainer}>
        <View style={styles.micCircle}>
          <Icon name="mic" size={48} color="#FFF" />
        </View>
        <Text style={styles.micLabel}>
          {isPlaying ? 'Playing...' : 'Tap a string to hear its sound'}
        </Text>
      </View>

      {/* Guitar Strings */}
      <View style={styles.stringsContainer}>
        {GUITAR_STRINGS.map((string, index) => (
          <TouchableOpacity
            key={`${string.note}-${index}`}
            style={styles.stringButton}
            onPress={() =>
              selectedString === index ? stopNote() : playNote(string, index)
            }
          >
            <LinearGradient
              colors={
                selectedString === index
                  ? string.color
                  : ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']
              }
              style={styles.stringGradient}
            >
              <View style={styles.stringInfo}>
                <Text
                  style={[
                    styles.stringNumber,
                    selectedString === index && styles.stringNumberActive,
                  ]}
                >
                  {index + 1}
                </Text>
                <View>
                  <Text
                    style={[
                      styles.stringNote,
                      selectedString === index && styles.stringNoteActive,
                    ]}
                  >
                    {string.note}
                  </Text>
                  <Text
                    style={[
                      styles.stringFrequency,
                      selectedString === index && styles.stringFrequencyActive,
                    ]}
                  >
                    {string.frequency.toFixed(2)} Hz
                  </Text>
                </View>
              </View>

              {selectedString === index && (
                <Animated.View
                  style={[
                    styles.playingIndicator,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Icon name="volume-up" size={32} color="#FFF" />
                </Animated.View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <View style={styles.instructionItem}>
          <Icon name="info-outline" size={20} color="#FFF" />
          <Text style={styles.instructionText}>
            Tap any string to hear its reference pitch
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="hearing" size={20} color="#FFF" />
          <Text style={styles.instructionText}>
            Tune your guitar to match the sound
          </Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="check-circle-outline" size={20} color="#FFF" />
          <Text style={styles.instructionText}>
            Standard tuning: E-A-D-G-B-E (low to high)
          </Text>
        </View>
      </View>

      {/* Auto-tune toggle */}
      <TouchableOpacity style={styles.autoTuneButton}>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={styles.autoTuneGradient}
        >
          <Icon name="auto-fix-high" size={24} color="#FFF" />
          <Text style={styles.autoTuneText}>Auto-detect (Coming Soon)</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 30,
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
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 30,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#FFF',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  modeButtonTextActive: {
    color: '#3B82F6',
  },
  micContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  micLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  stringsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  stringButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  stringGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  stringInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stringNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    width: 32,
  },
  stringNumberActive: {
    color: '#FFF',
  },
  stringNote: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
  },
  stringNoteActive: {
    color: '#FFF',
  },
  stringFrequency: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  stringFrequencyActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  playingIndicator: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    marginBottom: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
  },
  autoTuneButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  autoTuneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
  },
  autoTuneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
