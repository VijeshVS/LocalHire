import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPendingConfirmations, confirmJobCompletion } from '../services/jobCompletionService';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';

interface PendingJob {
  application_id: string;
  job_title: string;
  worker_name: string;
  worker_rating: number;
  completed_at: string;
  completion_notes: string | null;
  days_pending: number;
  job_id: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAllConfirmed: () => void;
}

export default function PendingConfirmationsModal({ visible, onClose, onAllConfirmed }: Props) {
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadPendingJobs();
    }
  }, [visible]);

  // Auto-close if no pending jobs
  useEffect(() => {
    if (!isLoading && visible && pendingJobs.length === 0) {
      onClose();
    }
  }, [isLoading, visible, pendingJobs.length, onClose]);

  const loadPendingJobs = async () => {
    try {
      setIsLoading(true);
      const response = await getPendingConfirmations();
      setPendingJobs(response.data || []);
      setCurrentIndex(0);
      setRating(0);
      setReview('');
    } catch (error) {
      console.error('Error loading pending jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please rate the worker before confirming');
      return;
    }

    try {
      setIsSubmitting(true);
      const currentJob = pendingJobs[currentIndex];
      await confirmJobCompletion(currentJob.application_id, rating, review || undefined);

      // Move to next job or close
      if (currentIndex < pendingJobs.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setRating(0);
        setReview('');
      } else {
        // All confirmed
        onAllConfirmed();
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to confirm job completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (currentIndex < pendingJobs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRating(0);
      setReview('');
    } else {
      onClose();
    }
  };

  if (!visible) return null;

  if (isLoading) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <ActivityIndicator size="large" color={COLORS.employer.primary} />
            <Text style={styles.loadingText}>Loading pending confirmations...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  if (pendingJobs.length === 0) {
    return null;
  }

  const currentJob = pendingJobs[currentIndex];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Job Completion Pending</Text>
              <Text style={styles.headerSubtitle}>
                {currentIndex + 1} of {pendingJobs.length}
              </Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{currentJob.days_pending}d</Text>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Job Info */}
            <View style={styles.jobCard}>
              <Text style={styles.jobTitle}>{currentJob.job_title}</Text>
              <View style={styles.workerInfo}>
                <View style={styles.workerAvatar}>
                  <Text style={styles.workerAvatarText}>
                    {currentJob.worker_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.workerDetails}>
                  <Text style={styles.workerName}>{currentJob.worker_name}</Text>
                  <View style={styles.workerRating}>
                    <Ionicons name="star" size={14} color="#fbbf24" />
                    <Text style={styles.workerRatingText}>{currentJob.worker_rating.toFixed(1)}</Text>
                  </View>
                </View>
              </View>

              {currentJob.completion_notes && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>Worker's Notes:</Text>
                  <Text style={styles.notesText}>{currentJob.completion_notes}</Text>
                </View>
              )}

              <View style={styles.completedInfo}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.completedText}>
                  Completed {new Date(currentJob.completed_at).toLocaleDateString()}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.ratingSection}>
              <Text style={styles.sectionTitle}>Rate Worker *</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? '#fbbf24' : COLORS.gray[300]}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Review */}
            <View style={styles.reviewSection}>
              <Text style={styles.sectionTitle}>Review (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Share your experience with this worker..."
                placeholderTextColor={COLORS.gray[400]}
                value={review}
                onChangeText={setReview}
                multiline
                numberOfLines={4}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isSubmitting}
            >
              <Text style={styles.skipButtonText}>Skip for Now</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm & {currentIndex < pendingJobs.length - 1 ? 'Next' : 'Finish'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    width: '90%',
    maxHeight: '85%',
    ...SHADOWS.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
  },
  pendingBadgeText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#d97706',
  },
  content: {
    padding: SPACING.lg,
  },
  jobCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  workerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.employer.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  workerAvatarText: {
    fontSize: TYPOGRAPHY.sizes.sm,
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
    marginTop: 2,
  },
  workerRatingText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginLeft: 4,
  },
  notesContainer: {
    marginBottom: SPACING.md,
  },
  notesLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.xs,
  },
  notesText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    fontStyle: 'italic',
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  completedText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: '#16a34a',
    marginLeft: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  ratingSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  starButton: {
    padding: SPACING.xs,
  },
  reviewSection: {
    marginBottom: SPACING.md,
  },
  textArea: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
    textAlignVertical: 'top',
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
  },
  skipButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.employer.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
