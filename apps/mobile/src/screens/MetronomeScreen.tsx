// apps/mobile/src/screens/MetronomeScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Slider from '@react-native-community/slider';
import { Audio } from 'expo-av';

export default function MetronomeScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [beats, setBeats] = useState(4);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sound]);

  const playTick = async (isAccent: boolean) => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        isAccent
          ? require('../assets/sounds/metronome-accent.mp3')
          : require('../assets/sounds/metronome-tick.mp3')
      );
      await newSound.playAsync();
      
      // Unload after playing
      setTimeout(() => {
        newSound.unloadAsync();
      }, 100);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const startMetronome = () => {
    setIsPlaying(true);
    setCurrentBeat(0);
    
    const interval = 60000 / bpm; // Convert BPM to milliseconds
    let beatCount = 0;

    intervalRef.current = setInterval(() => {
      const isAccent = beatCount % beats === 0;
      playTick(isAccent);
      
      // Pulse animation
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();

      setCurrentBeat(beatCount % beats);
      beatCount++;
    }, interval);
  };

  const stopMetronome = () => {
    setIsPlaying(false);
    setCurrentBeat(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const toggleMetronome = () => {
    if (isPlaying) {
      stopMetronome();
    } else {
      startMetronome();
    }
  };

  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(40, Math.min(240, bpm + delta));
    setBpm(newBpm);
    if (isPlaying) {
      stopMetronome();
      setTimeout(() => startMetronome(), 100);
    }
  };

  const tempoDescriptions: { [key: number]: string } = {
    40: 'Grave',
    60: 'Largo',
    76: 'Adagio',
    108: 'Andante',
    120: 'Moderato',
    156: 'Allegro',
    176: 'Vivace',
    200: 'Presto',
  };

  const getTempoDescription = () => {
    const tempos = Object.keys(tempoDescriptions)
      .map(Number)
      .sort((a, b) => a - b);
    
    for (let i = 0; i < tempos.length; i++) {
      if (bpm <= tempos[i]) {
        return tempoDescriptions[tempos[i]];
      }
    }
    return 'Prestissimo';
  };

  return (
    <LinearGradient colors={['#9333EA', '#EC4899']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Metronome</Text>
        <Text style={styles.subtitle}>Practice with precision</Text>
      </View>

      {/* BPM Display */}
      <View style={styles.bpmContainer}>
        <TouchableOpacity
          style={styles.bpmButton}
          onPress={() => adjustBpm(-10)}
          disabled={isPlaying}
        >
          <Icon name="remove" size={32} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.bpmDisplay}>
          <Animated.View
            style={[
              styles.bpmCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text style={styles.bpmNumber}>{bpm}</Text>
            <Text style={styles.bpmLabel}>BPM</Text>
          </Animated.View>
          <Text style={styles.tempoDescription}>{getTempoDescription()}</Text>
        </View>

        <TouchableOpacity
          style={styles.bpmButton}
          onPress={() => adjustBpm(10)}
          disabled={isPlaying}
        >
          <Icon name="add" size={32} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* BPM Slider */}
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>40</Text>
        <Slider
          style={styles.slider}
          minimumValue={40}
          maximumValue={240}
          step={1}
          value={bpm}
          onValueChange={setBpm}
          minimumTrackTintColor="#FFF"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          thumbTintColor="#FFF"
          disabled={isPlaying}
        />
        <Text style={styles.sliderLabel}>240</Text>
      </View>

      {/* Beat Selector */}
      <View style={styles.beatsContainer}>
        <Text style={styles.beatsLabel}>Beats per Measure</Text>
        <View style={styles.beatsSelector}>
          {[2, 3, 4, 5, 6].map((beat) => (
            <TouchableOpacity
              key={beat}
              style={[
                styles.beatButton,
                beats === beat && styles.beatButtonActive,
              ]}
              onPress={() => setBeats(beat)}
              disabled={isPlaying}
            >
              <Text
                style={[
                  styles.beatButtonText,
                  beats === beat && styles.beatButtonTextActive,
                ]}
              >
                {beat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Beat Indicators */}
      <View style={styles.beatIndicators}>
        {Array.from({ length: beats }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.beatIndicator,
              currentBeat === index && isPlaying && styles.beatIndicatorActive,
              index === 0 && styles.beatIndicatorAccent,
            ]}
          />
        ))}
      </View>

      {/* Play/Stop Button */}
      <TouchableOpacity style={styles.playButton} onPress={toggleMetronome}>
        <LinearGradient
          colors={isPlaying ? ['#EF4444', '#DC2626'] : ['#10B981', '#059669']}
          style={styles.playButtonGradient}
        >
          <Icon name={isPlaying ? 'stop' : 'play-arrow'} size={64} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Tap Tempo */}
      <TouchableOpacity style={styles.tapButton}>
        <Text style={styles.tapButtonText}>Tap Tempo</Text>
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
    marginBottom: 40,
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
  bpmContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  bpmButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bpmDisplay: {
    alignItems: 'center',
    marginHorizontal: 40,
  },
  bpmCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  bpmNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFF',
  },
  bpmLabel: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 4,
  },
  tempoDescription: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 16,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  slider: {
    flex: 1,
    marginHorizontal: 16,
  },
  sliderLabel: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  beatsContainer: {
    marginBottom: 40,
  },
  beatsLabel: {
    fontSize: 18,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  beatsSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  beatButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  beatButtonActive: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  beatButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  beatButtonTextActive: {
    color: '#9333EA',
  },
  beatIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  beatIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  beatIndicatorActive: {
    backgroundColor: '#FFF',
    transform: [{ scale: 1.5 }],
  },
  beatIndicatorAccent: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  playButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  playButtonGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  tapButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  tapButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
});
