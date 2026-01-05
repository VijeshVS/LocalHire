import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getEmployeeProfile } from '../../services/profileService';

export default function WorkerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({
    name: '',
    phone: '',
    email: '',
    rating: 0,
    totalJobs: 0,
    completionRate: 0,
    earnings: { today: 0, week: 0, month: 0 },
    skills: [],
    years_of_experience: '0',
    languages: [],
    status: 'active',
    verified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<'Available' | 'Busy' | 'Offline'>('Available');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getEmployeeProfile();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        rating: data.rating || 0,
        totalJobs: 0,
        completionRate: 0,
        earnings: { today: 0, week: 0, month: 0 },
        skills: data.skills?.map((s: any) => s.skill_name) || [],
        years_of_experience: data.years_of_experience ? `${data.years_of_experience} years` : '0 years',
        languages: data.language ? [data.language] : [],
        status: data.status || 'active',
        verified: data.status === 'active',
        address: data.address || '',
      });
      setAvailability(data.status === 'active' ? 'Available' : 'Offline');
    } catch (error) {
      console.log('Error fetching profile:', error);
      if (user) {
        setProfile((prev: any) => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    Alert.alert('Share Profile', 'Profile sharing feature coming soon!');
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile feature coming soon!');
  };

  const getAvailabilityConfig = (status: string) => {
    switch (status) {
      case 'Available':
        return { color: COLORS.status.success, bg: '#d1fae5', icon: 'checkmark-circle' };
      case 'Busy':
        return { color: COLORS.status.warning, bg: '#fef3c7', icon: 'time' };
      default:
        return { color: COLORS.gray[500], bg: COLORS.gray[100], icon: 'power' };
    }
  };

  const availabilityConfig = getAvailabilityConfig(availability);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.worker.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name?.[0] || 'W'}</Text>
            </View>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.phone}>{profile.phone || profile.email}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={styles.ratingText}>{profile.rating || 0}</Text>
            <Text style={styles.ratingSubtext}>({profile.totalJobs || 0} jobs)</Text>
          </View>

          {/* Availability Toggle */}
          <View style={[styles.availabilityBadge, { backgroundColor: availabilityConfig.bg }]}>
            <Ionicons name={availabilityConfig.icon as any} size={16} color={availabilityConfig.color} />
            <Text style={[styles.availabilityText, { color: availabilityConfig.color }]}>
              {availability}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{profile.earnings?.month || 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.completionRate || 0}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.totalJobs || 0}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
        </View>

        {/* Info Sections */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsContainer}>
            {(profile.skills || []).map((skill: string, index: number) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>{profile.years_of_experience || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.infoRow}>
            <Ionicons name="language-outline" size={20} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>{profile.language || 'Not specified'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color={COLORS.white} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/(worker)/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.worker.primary} />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.worker.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    ...SHADOWS.lg,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  phone: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
    marginBottom: SPACING.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  ratingSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  availabilityText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  statsSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillChip: {
    backgroundColor: COLORS.worker.bg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  skillText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.worker.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[700],
  },
  actionSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.worker.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.worker.primary,
  },
  settingsButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.worker.primary,
  },
});