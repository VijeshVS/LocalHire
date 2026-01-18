import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';
import { markJobCompleted } from '../services/jobCompletionService';

interface JobCompletionModalProps {
  visible: boolean;
  job: any;
  onClose: () => void;
  onCompleted: () => void;
}

export default function JobCompletionModal({ visible, job, onClose, onCompleted }: JobCompletionModalProps) {
  const [completionNotes, setCompletionNotes] = useState('');
  const [employerRating, setEmployerRating] = useState(0);
  const [employerReview, setEmployerReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await markJobCompleted(
        job.id,
        completionNotes,
        employerRating > 0 ? employerRating : undefined,
        employerReview || undefined
      );
      
      Alert.alert('Success', 'Job marked as completed! 🎉');
      setCompletionNotes('');
      setEmployerRating(0);
      setEmployerReview('');
      onCompleted();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark job as completed');
    } finally {
      setIsSubmitting(false);
    }
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

  if (!job) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Job Complete!</Text>
              <Text style={styles.modalSubtitle}>{job.job_postings?.title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.gray[600]} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Completion Message */}
            <View style={styles.messageCard}>
              <Ionicons name="checkmark-circle" size={48} color={COLORS.status.success} />
              <Text style={styles.messageTitle}>Time to Mark Complete!</Text>
              <Text style={styles.messageText}>
                Your scheduled work time has ended. Please confirm completion and rate your employer.
              </Text>
            </View>

            {/* Completion Notes */}
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

            {/* Rate Employer */}
            <Text style={styles.inputLabel}>Rate Employer (Optional)</Text>
            {renderRatingStars()}

            {/* Review */}
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
              style={styles.laterButton}
              onPress={onClose}
            >
              <Text style={styles.laterButtonText}>Later</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color={COLORS.white} />
                  <Text style={styles.submitButtonText}>Mark Complete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
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
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  modalBody: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
  },
  messageCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  messageTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  messageText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 20,
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
  laterButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
  },
  laterButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.status.success,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});
