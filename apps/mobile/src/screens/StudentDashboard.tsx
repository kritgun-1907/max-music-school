// apps/mobile/src/screens/StudentDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { studentService } from '../services/api';

interface StudentData {
  name: string;
  email: string;
  phone: string;
  batchDay: string;
  batchTime: string;
  monthlyFees: string;
  paymentStatus: string;
  attendance: number;
  totalClasses: number;
  attendancePercentage: number;
}

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStudentData = async () => {
    try {
      const response = await studentService.getDashboard();
      setStudentData(response.data);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudentData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  if (!studentData) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudentData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Card */}
      <LinearGradient colors={['#7C3AED', '#4C1D95']} style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {studentData.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.studentName}>{studentData.name}</Text>
            <Text style={styles.studentEmail}>{studentData.email}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          {/* Attendance Card */}
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Icon name="event-available" size={32} color="#3B82F6" />
            <Text style={styles.statValue}>{studentData.attendancePercentage}%</Text>
            <Text style={styles.statLabel}>Attendance</Text>
            <Text style={styles.statDetail}>
              {studentData.attendance}/{studentData.totalClasses} classes
            </Text>
          </View>

          {/* Payment Status Card */}
          <View
            style={[
              styles.statCard,
              {
                backgroundColor:
                  studentData.paymentStatus === 'Paid' ? '#D1FAE5' : '#FEE2E2',
              },
            ]}
          >
            <Icon
              name={studentData.paymentStatus === 'Paid' ? 'check-circle' : 'pending'}
              size={32}
              color={studentData.paymentStatus === 'Paid' ? '#10B981' : '#EF4444'}
            />
            <Text style={styles.statValue}>{studentData.paymentStatus}</Text>
            <Text style={styles.statLabel}>Payment</Text>
            <Text style={styles.statDetail}>₹{studentData.monthlyFees}/month</Text>
          </View>
        </View>
      </View>

      {/* Batch Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Batch Details</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="calendar-today" size={24} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Batch Day</Text>
              <Text style={styles.infoValue}>{studentData.batchDay}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Icon name="access-time" size={24} color="#6B7280" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Batch Time</Text>
              <Text style={styles.infoValue}>{studentData.batchTime}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionCard}>
          <LinearGradient
            colors={['#9333EA', '#EC4899']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="edit-calendar" size={32} color="#FFF" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Request Batch Change</Text>
              <Text style={styles.actionDescription}>
                Change your batch timing or day
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Icon name="support-agent" size={32} color="#FFF" />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Contact Teacher</Text>
              <Text style={styles.actionDescription}>
                Get help or ask questions
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statDetail: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContent: {
    marginLeft: 16,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  bottomSpacing: {
    height: 32,
  },
});
