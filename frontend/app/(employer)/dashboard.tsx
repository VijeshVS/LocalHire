import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getMyJobs } from '../../services/jobService';
import PendingConfirmationsModal from '../../components/PendingConfirmationsModal';

type JobStatus = 'searching' | 'assigned' | 'on_the_way' | 'in_progress' | 'completed';

export default function EmployerDashboard() {
  const { user } = useAuth();
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    fetchJobs();
    // Show pending confirmations modal after a short delay
    const timer = setTimeout(() => {
      setShowPendingModal(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const jobs = await getMyJobs();
      const formattedJobs = jobs.slice(0, 5).map((job: any) => ({
        id: job.id,
        title: job.title,
        category: job.category || 'General',
        applicants: 0,
        budget: job.wage,
        posted: formatPostedTime(job.created_at),
        status: job.is_active ? 'searching' : 'completed' as JobStatus,
        urgency: 'today',
        location: job.address || 'Not specified'
      }));
      setActiveJobs(formattedJobs);
    } catch (error) {
      console.log('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPostedTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getStatusConfig = (status: JobStatus) => {
    switch (status) {
      case 'searching':
        return {
          icon: 'search' as const,
          color: COLORS.employer.primary,
          text: 'Searching for worker...',
          pulse: true
        };
      case 'assigned':
        return {
          icon: 'checkmark-circle' as const,
          color: COLORS.worker.primary,
          text: 'Worker Assigned',
          pulse: false
        };
      case 'on_the_way':
        return {
          icon: 'navigate' as const,
          color: COLORS.status.info,
          text: 'Worker on the way (5 min)',
          pulse: true
        };
      case 'in_progress':
        return {
          icon: 'flash' as const,
          color: COLORS.status.warning,
          text: 'Job in progress',
          pulse: true
        };
      default:
        return {
          icon: 'checkmark-done' as const,
          color: COLORS.system.primary,
          text: 'Completed',
          pulse: false
        };
    }
  };

  const renderJobCard = ({ item }: any) => {
    const statusConfig = getStatusConfig(item.status);

    return (
      <TouchableOpacity style={styles.jobCard} activeOpacity={0.7}>
        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.jobMeta}>{item.category} • {item.location}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.gray[500]} />
          </TouchableOpacity>
        </View>

        {/* Live Status */}
        <View style={[styles.statusCard, { borderLeftColor: statusConfig.color }]}>
          <View style={styles.statusIconContainer}>
            <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
            {statusConfig.pulse && (
              <View style={[styles.pulseDot, { backgroundColor: statusConfig.color }]} />
            )}
          </View>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.text}
          </Text>
        </View>

        {/* Worker Info (if assigned) */}
        {item.status !== 'searching' && item.workerName && (
          <View style={styles.workerInfo}>
            <View style={styles.workerAvatar}>
              <Text style={styles.workerInitial}>{item.workerName[0]}</Text>
            </View>
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{item.workerName}</Text>
              <View style={styles.workerRating}>
                <Ionicons name="star" size={12} color={COLORS.status.warning} />
                <Text style={styles.ratingText}>{item.workerRating}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.callButton}>
              <Ionicons name="call" size={18} color={COLORS.employer.primary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Job Details */}
        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color={COLORS.gray[500]} />
            <Text style={styles.detailText}>₹{item.budget}/day</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="people-outline" size={16} color={COLORS.gray[500]} />
            <Text style={styles.detailText}>{item.applicants} applicants</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.gray[500]} />
            <Text style={styles.detailText}>{item.posted}</Text>
          </View>
        </View>

        {/* Primary Action */}
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: statusConfig.color }]}
          onPress={() => {
            if (item.status === 'searching') {
              router.push(`/(employer)/candidates?jobId=${item.id}`);
            } else {
              router.push('/(employer)/jobs');
            }
          }}
        >
          <Text style={styles.primaryButtonText}>
            {item.status === 'searching' ? 'View Candidates' : 'Track Worker'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.white} />
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
          <Text style={styles.greeting}>Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! ☀️</Text>
          <Text style={styles.subGreeting}>Manage your workforce</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={COLORS.gray[700]} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/(employer)/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: COLORS.employer.bg }]}>
            <Ionicons name="briefcase" size={24} color={COLORS.employer.primary} />
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Active Jobs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.worker.bg }]}>
            <Ionicons name="people" size={24} color={COLORS.worker.primary} />
            <Text style={styles.statValue}>23</Text>
            <Text style={styles.statLabel}>Applicants</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: COLORS.employer.light }]}>
            <Ionicons name="checkmark-done" size={24} color={COLORS.status.info} />
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(employer)/post-job')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.employer.bg }]}>
              <Ionicons name="add-circle" size={28} color={COLORS.employer.primary} />
            </View>
            <Text style={styles.actionText}>Post New Job</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(employer)/candidates')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.worker.bg }]}>
              <Ionicons name="people" size={28} color={COLORS.worker.primary} />
            </View>
            <Text style={styles.actionText}>View Candidates</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/(employer)/fast-hire')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="search" size={28} color={COLORS.status.warning} />
            </View>
            <Text style={styles.actionText}>Find Workers</Text>
          </TouchableOpacity>

          {/* New FastHire Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(employer)/fast-hire')}
          >
            <View style={[styles.actionIcon, { backgroundColor: COLORS.employer.light }]}>
              <Ionicons name="flash" size={28} color={COLORS.employer.primary} />
            </View>
            <Text style={styles.actionText}>FastHire AI</Text>
          </TouchableOpacity>
        </View>

        {/* Active Jobs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Jobs</Text>
            <TouchableOpacity onPress={() => router.push('/(employer)/jobs')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.employer.primary} />
              <Text style={{ marginTop: 12, color: COLORS.gray[500] }}>Loading jobs...</Text>
            </View>
          ) : activeJobs.length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Ionicons name="briefcase-outline" size={64} color={COLORS.gray[300]} />
              <Text style={{ marginTop: 12, fontSize: 16, color: COLORS.gray[500] }}>No active jobs</Text>
              <Text style={{ marginTop: 4, color: COLORS.gray[400] }}>Post a job to get started</Text>
            </View>
          ) : (
            <FlatList
              data={activeJobs}
              renderItem={renderJobCard}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
            />
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(employer)/post-job')}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>

      {/* Pending Confirmations Modal */}
      <PendingConfirmationsModal
        visible={showPendingModal}
        onClose={() => setShowPendingModal(false)}
        onAllConfirmed={() => {
          fetchJobs(); // Refresh job list after confirmations
        }}
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
    gap: SPACING.md,
  },
  iconButton: {
    position: 'relative',
  },
  badge: {
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
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {
    padding: SPACING.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[700],
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING.xl,
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
    color: COLORS.employer.primary,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  jobMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  moreButton: {
    padding: SPACING.xs,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderLeftWidth: 4,
    marginBottom: SPACING.md,
  },
  statusIconContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  pulseDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -2,
    right: -2,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    flex: 1,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.worker.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  workerInitial: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  workerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.employer.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobDetails: {
    flexDirection: 'row',
    gap: SPACING.lg,
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  fab: {
    position: 'absolute',
    bottom: SPACING.xxl,
    right: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.employer.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
});