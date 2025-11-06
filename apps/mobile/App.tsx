// apps/mobile/App.tsx - Main App Entry Point with Navigation
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ===========================
// SCREEN COMPONENTS (Placeholders - to be implemented)
// ===========================

function LoginScreen({ navigation }: any) {
  return (
    <LinearGradient colors={['#4C1D95', '#7C3AED']} style={styles.loginContainer}>
      <View style={styles.loginCard}>
        <Text style={styles.loginTitle}>Max Music School</Text>
        <Text style={styles.loginSubtitle}>Student Portal</Text>
        {/* Add login form here */}
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => navigation.replace('Dashboard')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

function DashboardScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Dashboard</Text>
      {/* Implement dashboard with attendance, payment status */}
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Profile</Text>
      {/* Implement profile details */}
    </View>
  );
}

function PracticeToolsScreen({ navigation }: any) {
  const tools = [
    {
      name: 'Metronome',
      icon: 'speed',
      color: ['#9333EA', '#EC4899'],
      screen: 'Metronome',
    },
    {
      name: 'Guitar Tuner',
      icon: 'music-note',
      color: ['#3B82F6', '#2563EB'],
      screen: 'GuitarTuner',
    },
    {
      name: 'Chord Library',
      icon: 'library-music',
      color: ['#10B981', '#059669'],
      screen: 'Chords',
    },
  ];

  return (
    <LinearGradient colors={['#F5F5F0', '#E8E6E1']} style={styles.toolsContainer}>
      <View style={styles.toolsHeader}>
        <Text style={styles.toolsTitle}>Practice Tools</Text>
        <Text style={styles.toolsSubtitle}>Choose a tool to practice</Text>
      </View>
      <View style={styles.toolsGrid}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.name}
            style={styles.toolCard}
            onPress={() => navigation.navigate(tool.screen)}
          >
            <LinearGradient colors={tool.color} style={styles.toolGradient}>
              <Icon name={tool.icon} size={48} color="#FFF" />
              <Text style={styles.toolName}>{tool.name}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </LinearGradient>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Settings</Text>
      {/* Implement settings */}
    </View>
  );
}

// Practice Tool Screens
function MetronomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Metronome</Text>
      {/* Implement metronome */}
    </View>
  );
}

function GuitarTunerScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Guitar Tuner</Text>
      {/* Implement guitar tuner */}
    </View>
  );
}

function ChordsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Chord Library</Text>
      {/* Implement chord library */}
    </View>
  );
}

// ===========================
// TAB NAVIGATOR
// ===========================

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Tools':
              iconName = 'music-note';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Tools" component={PracticeToolsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// ===========================
// MAIN APP NAVIGATION
// ===========================

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Dashboard" component={TabNavigator} />
        <Stack.Screen name="Metronome" component={MetronomeScreen} />
        <Stack.Screen name="GuitarTuner" component={GuitarTunerScreen} />
        <Stack.Screen name="Chords" component={ChordsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ===========================
// STYLES
// ===========================

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 40,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  loginTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  loginButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  toolsContainer: {
    flex: 1,
  },
  toolsHeader: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  toolsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  toolsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  toolsGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },
  toolCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  toolGradient: {
    padding: 32,
    alignItems: 'center',
  },
  toolName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
});
