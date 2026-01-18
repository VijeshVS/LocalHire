import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { getMyApplications } from '../../services/applicationService';
import { markJobCompleted } from '../../services/jobCompletionService';

export default function MyJobsScreen() {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'applied' | 'accepted' | 'completed'>('applied');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [employerRating, setEmployerRating] = useState(0);
  const [employerReview, setEmployerReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const data = await getMyApplications();
      // Show ALL applications, not just accepted ones
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadApplications();
    setIsRefreshing(false);
  };

  const handleMarkComplete = (application: any) => {
    setSelectedApplication(application);
    setCompletionNotes('');
    setEmployerRating(0);
    setEmployerReview('');
    setShowCompleteModal(true);
  };

  const submitCompletion = async () => {
    if (!selectedApplication) return;

    try {
      setIsSubmitting(true);
      await markJobCompleted(
        selectedApplication.id,
        completionNotes,
        employerRating > 0 ? employerRating : undefined,
        employerReview || undefined
      );
      
      Alert.alert('Success', 'Job marked as completed!');
      setShowCompleteModal(false);
      await loadApplications();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark job as completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWorkStatus = (app: any) => {
    // Check for work_status field from backend
    if (app.work_status === 'completed') return 'completed';
    if (app.work_status === 'in_progress') return 'in_progress';
    // Fallback to status
    return app.status === 'accepted' ? 'in_progress' : 'completed';
  };

  const getFilteredApplications = () => {
    return applications.filter(app => {
      if (selectedTab === 'applied') {
        // Show applied, pending, rejected
        return app.status === 'applied' || app.status === 'pending' || app.status === 'rejected';
      } else if (selectedTab === 'accepted') {
        // Show accepted jobs that are in progress
        return app.status === 'accepted' && app.work_status !== 'completed';
      } else {
        // Show completed jobs
        return app.work_status === 'completed';
      }
    });
  };

  const renderRatingStars = () => (
    <View style={styles.ratingContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setEmployerRating(star)}
          style={styles.starButton}
        >
          <Ionicons
            name={star <= employerRating ? 'star' : 'star-outline'}
            size={32}
            color={star <= employerRating ? '#fbbf24' : COLORS.gray[300]}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderJobCard = ({ item }: any) => {
    const job = item.job_postings || {};
    const status = item.status;
    const workStatus = item.work_status || 'pending';

    // Determine badge color and text
    let badgeStyle = styles.appliedBadge;
    let badgeText = 'Applied';
    
    if (status === 'rejected') {
      badgeStyle = styles.rejectedBadge;
      badgeText = 'Rejected';
    } else if (status === 'accepted' && workStatus === 'completed') {
      badgeStyle = styles.completedBadge;
      badgeText = 'Completed';
    } else if (status === 'accepted') {
      badgeStyle = styles.acceptedBadge;
      badgeText = 'In Progress';
    }

    return (
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle}>{job.title || 'Job'}</Text>
            <View style={badgeStyle}>
              <Text style={styles.statusText}>{badgeText}</Text>
            </View>
          </View>
          <Text style={styles.wage}>₹{job.wage || 0}</Text>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color={COLORS.gray[600]} />
            <Text style={styles.detailText}>{job.address || 'Location'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color={COLORS.gray[600]} />
            <Text style={styles.detailText}>{job.duration || 'Duration'}</Text>
          </View>
        </View>

        {status === 'accepted' && workStatus !== 'completed' && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => handleMarkComplete(item)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
            <Text style={styles.completeButtonText}>Mark as Completed</Text>
          </TouchableOpacity>
        )}

        {workStatus === 'completed' && (
          <View style={styles.completedInfo}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.completedInfoText}>
              Waiting for employer confirmation
            </Text>
          </View>
        )}

        {status === 'rejected' && (
          <View style={styles.rejectedInfo}>
            <Ionicons name="close-circle" size={20} color="#dc2626" />
            <Text style={styles.rejectedInfoText}>
              Application was not accepted
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.worker.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'applied' && styles.activeTab]}
          onPress={() => setSelectedTab('applied')}
        >
          <Text style={[styles.tabText, selectedTab === 'applied' && styles.activeTabText]}>
            Applied
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'accepted' && styles.activeTab]}
          onPress={() => setSelectedTab('accepted')}
        >
          <Text style={[styles.tabText, selectedTab === 'accepted' && styles.activeTabText]}>
            Hired
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jobs List */}
      <FlatList
        data={getFilteredApplications()}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.worker.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.gray[300]} />
            <Text style={styles.emptyTitle}>
              No {selectedTab === 'applied' ? 'pending applications' : selectedTab === 'accepted' ? 'hired jobs' : 'completed jobs'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'applied' 
                ? 'Jobs you apply for will appear here'
                : selectedTab === 'accepted'
                ? 'Accepted jobs will appear here'
                : 'Completed jobs will appear here'}
            </Text>
          </View>
        }
      />

      {/* Complete Job Modal */}
      <Modal
        visible={showCompleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mark Job as Completed</Text>
              <TouchableOpacity onPress={() => setShowCompleteModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Completion Notes (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Add any notes about the completed work..."
                placeholderTextColor={COLORS.gray[400]}
                value={completionNotes}
                onChangeText={setCompletionNotes}
                multiline
                numberOfLines={4}
              />

              <Text style={styles.inputLabel}>Rate Employer (Optional)</Text>
              {renderRatingStars()}

              {employerRating > 0 && (
                <>
                  <Text style={styles.inputLabel}>Review (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Share your experience working with this employer..."
                    placeholderTextColor={COLORS.gray[400]}
                    value={employerReview}
                    onChangeText={setEmployerReview}
                    multiline
                    numberOfLines={3}
                  />
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCompleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitCompletion}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.worker.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[600],
  },
  activeTabText: {
    color: COLORS.worker.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  listContent: {
    padding: SPACING.lg,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  jobTitleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  statusBadge: {
    backgroundColor: COLORS.worker.bg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  appliedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  acceptedBadge: {
    backgroundColor: COLORS.worker.bg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  rejectedBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.worker.primary,
  },
  completedText: {
    color: '#16a34a',
  },
  wage: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  jobDetails: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  detailText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginLeft: SPACING.xs,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.worker.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  completeButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: '#d1fae5',
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  completedInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#16a34a',
  },
  rejectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    backgroundColor: '#fee2e2',
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  rejectedInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#dc2626',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  modalBody: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  textArea: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
    textAlignVertical: 'top',
    minHeight: 100,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.md,
  },
  starButton: {
    padding: SPACING.xs,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
  },
  submitButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.worker.primary,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
