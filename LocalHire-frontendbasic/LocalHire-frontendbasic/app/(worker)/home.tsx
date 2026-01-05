import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { findNearbyJobs } from '../../services/locationService';

type AvailabilityStatus = 'available' | 'busy' | 'offline';

export default function WorkerHome() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilityStatus>('available');
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyJobs();
  }, []);

  const fetchNearbyJobs = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      console.log('🔄 Fetching nearby jobs...');
      const latitude = 12.9716;
      const longitude = 77.5946;
      const jobs = await findNearbyJobs(latitude, longitude, 10);
      console.log('✅ Jobs fetched:', jobs?.length || 0);
      
      const formattedJobs = jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        distance: job.distance_km ? `${job.distance_km.toFixed(1)}km` : 'N/A',
        pay: job.wage || 0,
        urgency: 'today',
        location: job.address || 'N/A',
        rating: 4.0,
        company: 'Employer',
        category: 'General'
      }));
      setNearbyJobs(formattedJobs);
    } catch (error: any) {
      console.error('❌ Error fetching nearby jobs:', error);
      setErrorMsg(error.message || 'Failed to connect to server');
      setNearbyJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailabilityConfig = (status: AvailabilityStatus) => {
    switch (status) {
      case 'available':
        return { 
          color: COLORS.worker.primary, 
          bg: COLORS.worker.bg,
          icon: 'checkmark-circle' as const,
          text: 'Available for Work',
          subtitle: 'You can receive job alerts'
        };
      case 'busy':
        return { 
          color: COLORS.status.warning, 
          bg: '#fef3c7',
          icon: 'time' as const,
          text: 'Busy',
          subtitle: 'No new alerts until available'
        };
      case 'offline':
        return { 
          color: COLORS.gray[500], 
          bg: COLORS.gray[100],
          icon: 'moon' as const,
          text: 'Offline',
          subtitle: 'Invisible to employers'
        };
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return { text: '🔥 URGENT', color: COLORS.status.error, bg: '#fef2f2' };
      case 'today':
        return { text: 'Today', color: COLORS.status.warning, bg: '#fef3c7' };
      default:
        return { text: 'Tomorrow', color: COLORS.status.info, bg: '#dbeafe' };
    }
  };

  const config = getAvailabilityConfig(availability);

  const renderJobCard = ({ item }: any) => {
    const urgency = getUrgencyBadge(item.urgency);
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => router.push(`/(worker)/job/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Urgency Badge */}
        {item.urgency === 'immediate' && (
          <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
            <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.text}</Text>
          </View>
        )}

        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleSection}>
            <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.jobCompany}>{item.company}</Text>
          </View>
          <View style={styles.payBadge}>
            <Text style={styles.payAmount}>₹{item.pay}</Text>
            <Text style={styles.payPeriod}>/day</Text>
          </View>
        </View>

        {/* Job Meta */}
        <View style={styles.jobMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="location" size={14} color={COLORS.gray[500]} />
            <Text style={styles.metaText}>{item.distance}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="briefcase" size={14} color={COLORS.gray[500]} />
            <Text style={styles.metaText}>{item.category}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#f59e0b" />
            <Text style={styles.metaText}>{item.rating}</Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={() => router.push(`/(worker)/job/${item.id}`)}
        >
          <Text style={styles.viewButtonText}>View Details</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.worker.primary} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋</Text>
          <Text style={styles.subGreeting}>Find your next opportunity</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.gray[700]} />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={nearbyJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.worker.primary} />
              <Text style={{ marginTop: 12, color: COLORS.gray[500] }}>Finding jobs near you...</Text>
            </View>
          ) : (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="briefcase-outline" size={64} color={COLORS.gray[300]} />
              <Text style={{ marginTop: 12, fontSize: 16, color: COLORS.gray[500] }}>No jobs found nearby</Text>
              <Text style={{ marginTop: 4, color: COLORS.gray[400], textAlign: 'center' }}>Check back later or expand your search</Text>
            </View>
          )
        }
        ListHeaderComponent={
          <>
            {/* Availability Card */}
            <View style={[styles.availabilityCard, { backgroundColor: config.bg }]}>
              <View style={styles.availabilityHeader}>
                <View style={styles.availabilityInfo}>
                  <Ionicons name={config.icon} size={24} color={config.color} />
                  <View style={styles.availabilityText}>
                    <Text style={[styles.availabilityTitle, { color: config.color }]}>
                      {config.text}
                    </Text>
                    <Text style={styles.availabilitySubtitle}>{config.subtitle}</Text>
                  </View>
                </View>
              </View>

              {/* Status Toggle */}
              <View style={styles.statusToggle}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    availability === 'available' && { 
                      backgroundColor: COLORS.worker.primary,
                      borderColor: COLORS.worker.primary 
                    }
                  ]}
                  onPress={() => setAvailability('available')}
                >
                  <Ionicons 
                    name="checkmark-circle" 
                    size={18} 
                    color={availability === 'available' ? COLORS.white : COLORS.gray[400]} 
                  />
                  <Text style={[
                    styles.statusButtonText,
                    availability === 'available' && styles.statusButtonTextActive
                  ]}>
                    Available
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    availability === 'busy' && { 
                      backgroundColor: COLORS.status.warning,
                      borderColor: COLORS.status.warning 
                    }
                  ]}
                  onPress={() => setAvailability('busy')}
                >
                  <Ionicons 
                    name="time" 
                    size={18} 
                    color={availability === 'busy' ? COLORS.white : COLORS.gray[400]} 
                  />
                  <Text style={[
                    styles.statusButtonText,
                    availability === 'busy' && styles.statusButtonTextActive
                  ]}>
                    Busy
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    availability === 'offline' && { 
                      backgroundColor: COLORS.gray[500],
                      borderColor: COLORS.gray[500] 
                    }
                  ]}
                  onPress={() => setAvailability('offline')}
                >
                  <Ionicons 
                    name="moon" 
                    size={18} 
                    color={availability === 'offline' ? COLORS.white : COLORS.gray[400]} 
                  />
                  <Text style={[
                    styles.statusButtonText,
                    availability === 'offline' && styles.statusButtonTextActive
                  ]}>
                    Offline
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>₹2,400</Text>
                <Text style={styles.statLabel}>Today's Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>Jobs Completed</Text>
              </View>
              <View style={styles.statCard}>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={18} color="#f59e0b" />
                  <Text style={styles.statValue}>4.8</Text>
                </View>
                <Text style={styles.statLabel}>Your Rating</Text>
              </View>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jobs Near You</Text>
              <TouchableOpacity onPress={() => router.push('/(worker)/search')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
          </>
        }
      />
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
  greeting: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  subGreeting: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.status.error,
    borderRadius: RADIUS.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  listContainer: {
    padding: SPACING.xl,
  },
  availabilityCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  availabilityHeader: {
    marginBottom: SPACING.lg,
  },
  availabilityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityText: {
    marginLeft: SPACING.md,
  },
  availabilityTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  availabilitySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  statusToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  statusButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[600],
  },
  statusButtonTextActive: {
    color: COLORS.white,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  seeAllText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.worker.primary,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  urgencyBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  urgencyText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  jobTitleSection: {
    flex: 1,
    marginRight: SPACING.md,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  payBadge: {
    backgroundColor: COLORS.worker.bg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'flex-end',
  },
  payAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  payPeriod: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.worker.dark,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.gray[300],
    marginHorizontal: SPACING.sm,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.worker.primary,
    gap: SPACING.xs,
  },
  viewButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.worker.primary,
  },
});