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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { findNearbyJobs } from '../../services/locationService';
import { getJobOffers } from '../../services/jobOfferService';
import { getMyApplications } from '../../services/applicationService';
import { getNotifications } from '../../services/notificationService';
import JobCompletionModal from '../../components/JobCompletionModal';
import * as Location from 'expo-location';

type AvailabilityStatus = 'available' | 'busy' | 'offline';

// Format time ago helper
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return 'Recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Format scheduled time for display
const formatScheduledTime = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 'Flexible';
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Get urgency based on scheduled date
const getJobUrgency = (scheduledDate: string) => {
  if (!scheduledDate) return 'flexible';
  
  const scheduled = new Date(scheduledDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Reset time parts for date comparison
  scheduled.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  
  if (scheduled.getTime() === today.getTime()) return 'today';
  if (scheduled.getTime() === tomorrow.getTime()) return 'tomorrow';
  if (scheduled < today) return 'past';
  return 'upcoming';
};

// Format scheduled date for display
const formatScheduledDate = (dateString: string) => {
  if (!dateString) return 'Flexible';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function WorkerHome() {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailabilityStatus>('available');
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationName, setLocationName] = useState<string>('Getting location...');
  const [jobOffersCount, setJobOffersCount] = useState<number>(0);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [completionModalVisible, setCompletionModalVisible] = useState(false);
  const [jobToComplete, setJobToComplete] = useState<any>(null);

  useEffect(() => {
    getUserLocationAndFetchJobs();
    fetchJobOffersCount();
    fetchNotificationCount();
    checkForCompletedJobs();
  }, []);

  const fetchJobOffersCount = async () => {
    try {
      const response = await getJobOffers();
      setJobOffersCount(response.offers?.length || 0);
    } catch (error) {
      console.error('Error fetching job offers:', error);
    }
  };

  const fetchNotificationCount = async () => {
    try {
      const notifications = await getNotifications();
      const unreadCount = notifications.filter((n: any) => !n.is_read).length;
      setNotificationCount(unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotificationCount(0);
    }
  };

  const checkForCompletedJobs = async () => {
    try {
      const applications = await getMyApplications();
      
      // Find hired jobs where the scheduled time has passed
      const hiredJobs = applications.filter((app: any) => 
        app.status === 'accepted' && 
        app.work_status === 'in_progress' &&
        app.job_postings?.scheduled_date &&
        app.job_postings?.scheduled_end_time
      );

      for (const job of hiredJobs) {
        const scheduledDate = job.job_postings.scheduled_date;
        const scheduledEndTime = job.job_postings.scheduled_end_time;
        
        // Combine date and time to check if job should be completed
        const endDateTime = new Date(`${scheduledDate}T${scheduledEndTime}`);
        const now = new Date();
        
        if (now > endDateTime) {
          // Job time has passed, show completion modal
          setJobToComplete(job);
          setCompletionModalVisible(true);
          break; // Show only one at a time
        }
      }
    } catch (error) {
      console.error('Error checking for completed jobs:', error);
    }
  };

  const handleJobCompleted = () => {
    // Refresh data after marking complete
    checkForCompletedJobs();
    fetchJobOffersCount();
  };

  const getUserLocationAndFetchJobs = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable location to see nearby jobs.');
        setLocationName('Location not available');
        setIsLoading(false);
        return;
      }

      // Get current location
      console.log('📍 Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      console.log('📍 Location obtained:', latitude, longitude);

      // Get location name
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) {
          const name = address.district || address.city || address.region || 'Your Location';
          setLocationName(name);
        }
      } catch {
        setLocationName('Your Location');
      }

      // Fetch jobs near user's location
      await fetchJobsAtLocation(latitude, longitude);
    } catch (error: any) {
      console.error('❌ Location error:', error);
      setErrorMsg('Failed to get location. Please try again.');
      setLocationName('Location error');
      setIsLoading(false);
    }
  };

  const fetchJobsAtLocation = async (latitude: number, longitude: number) => {
    try {
      console.log('🔄 Fetching jobs near:', latitude, longitude);
      const jobs = await findNearbyJobs(latitude, longitude, 50);
      console.log('✅ Nearby jobs fetched:', jobs?.length || 0);
      
      const formattedJobs = jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        distance: job.distance_km ? `${job.distance_km.toFixed(1)}km` : (job.dist_km ? `${job.dist_km.toFixed(1)}km` : 'N/A'),
        pay: job.wage || 0,
        urgency: getJobUrgency(job.scheduled_date),
        scheduledDate: formatScheduledDate(job.scheduled_date),
        scheduledTime: formatScheduledTime(job.scheduled_start_time, job.scheduled_end_time),
        location: job.address || 'N/A',
        rating: 4.0,
        company: 'Employer',
        category: job.category || 'General',
        created_at: job.created_at,
        postedTime: formatTimeAgo(job.created_at)
      }));
      setNearbyJobs(formattedJobs);
    } catch (error: any) {
      console.error('❌ Error fetching jobs:', error);
      setErrorMsg(error.message || 'Failed to fetch jobs');
      setNearbyJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = () => {
    getUserLocationAndFetchJobs();
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

  const getUrgencyBadge = (urgency: string, scheduledDate?: string) => {
    switch (urgency) {
      case 'immediate':
        return { text: '🔥 URGENT', color: COLORS.status.error, bg: '#fef2f2' };
      case 'today':
        return { text: '📅 Today', color: COLORS.status.warning, bg: '#fef3c7' };
      case 'tomorrow':
        return { text: '📅 Tomorrow', color: COLORS.status.info, bg: '#dbeafe' };
      case 'upcoming':
        return { text: scheduledDate || 'Upcoming', color: COLORS.status.info, bg: '#dbeafe' };
      case 'flexible':
        return { text: 'Flexible', color: COLORS.gray[600], bg: COLORS.gray[100] };
      default:
        return { text: scheduledDate || 'Flexible', color: COLORS.gray[600], bg: COLORS.gray[100] };
    }
  };

  const config = getAvailabilityConfig(availability);

  const renderJobCard = ({ item }: any) => {
    const urgency = getUrgencyBadge(item.urgency, item.scheduledDate);
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => router.push(`/(worker)/job/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Date Badge - Always show */}
        <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
          <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.text}</Text>
        </View>

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
            <Ionicons name="time-outline" size={14} color={COLORS.gray[500]} />
            <Text style={styles.metaText}>{item.scheduledTime || 'Flexible'}</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="briefcase" size={14} color={COLORS.gray[500]} />
            <Text style={styles.metaText}>{item.category}</Text>
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
        <View style={styles.headerActions}>
          {jobOffersCount > 0 && (
            <TouchableOpacity 
              style={styles.offersButton}
              onPress={() => router.push('/(worker)/job-offers')}
            >
              <Ionicons name="briefcase" size={22} color={COLORS.worker.primary} />
              <View style={styles.offersBadge}>
                <Text style={styles.offersCount}>{jobOffersCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(worker)/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={COLORS.gray[700]} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={18} color={COLORS.worker.primary} />
          <Text style={styles.locationText} numberOfLines={1}>{locationName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshLocationButton}
          onPress={refreshLocation}
          disabled={isLoading}
        >
          <Ionicons 
            name="refresh" 
            size={18} 
            color={isLoading ? COLORS.gray[400] : COLORS.worker.primary} 
          />
          <Text style={[
            styles.refreshLocationText,
            isLoading && { color: COLORS.gray[400] }
          ]}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Access */}
      <View style={styles.quickAccessContainer}>
        <TouchableOpacity 
          style={styles.quickAccessButton}
          onPress={() => router.push('/(worker)/my-jobs')}
        >
          <Ionicons name="briefcase" size={20} color={COLORS.worker.primary} />
          <Text style={styles.quickAccessText}>My Jobs</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.gray[400]} />
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
      
      {/* Job Completion Modal */}
      <JobCompletionModal
        visible={completionModalVisible}
        job={jobToComplete}
        onClose={() => setCompletionModalVisible(false)}
        onCompleted={handleJobCompleted}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  offersButton: {
    position: 'relative',
    padding: SPACING.xs,
    backgroundColor: COLORS.worker.bg,
    borderRadius: RADIUS.md,
  },
  offersBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.worker.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  offersCount: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.white,
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
  locationBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.worker.bg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[700],
    flex: 1,
  },
  refreshLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  refreshLocationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.worker.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  quickAccessContainer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  quickAccessText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[900],
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