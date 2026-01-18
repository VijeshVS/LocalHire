import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { getJobOffers, acceptJobOffer, rejectJobOffer } from '../../services/jobOfferService';

// Color aliases for easier usage
const TEXT_COLOR = COLORS.gray[900];
const BG_COLOR = COLORS.gray[50];
const PRIMARY_COLOR = COLORS.worker.primary;
const ERROR_COLOR = COLORS.status.error;
const MD_SIZE = TYPOGRAPHY.sizes.base; // 'md' equivalent

export default function JobOffersScreen() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingOffer, setProcessingOffer] = useState<string | null>(null);

  useEffect(() => {
    loadJobOffers();
  }, []);

  const loadJobOffers = async () => {
    try {
      setLoading(true);
      const response = await getJobOffers();
      setOffers(response.offers || []);
    } catch (error: any) {
      console.error('Error loading job offers:', error);
      Alert.alert('Error', error.message || 'Failed to load job offers');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobOffers();
    setRefreshing(false);
  };

  const handleAcceptOffer = async (offerId: string, jobTitle: string) => {
    Alert.alert(
      'Accept Job Offer',
      `Do you want to accept the offer for "${jobTitle}"?\n\nNote: Accepting this will reject any conflicting job offers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              setProcessingOffer(offerId);
              const response = await acceptJobOffer(offerId);
              
              if (response.success) {
                Alert.alert('Success', 'Job offer accepted! The job has been added to your schedule.');
                await loadJobOffers();
              } else {
                Alert.alert('Error', response.error || 'Failed to accept job offer');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to accept job offer');
            } finally {
              setProcessingOffer(null);
            }
          }
        }
      ]
    );
  };

  const handleRejectOffer = async (offerId: string, jobTitle: string) => {
    Alert.alert(
      'Reject Job Offer',
      `Are you sure you want to reject the offer for "${jobTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingOffer(offerId);
              const response = await rejectJobOffer(offerId);
              
              if (response.success) {
                Alert.alert('Success', 'Job offer rejected');
                await loadJobOffers();
              } else {
                Alert.alert('Error', response.error || 'Failed to reject job offer');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject job offer');
            } finally {
              setProcessingOffer(null);
            }
          }
        }
      ]
    );
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'Not scheduled';
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const renderOfferCard = (offer: any) => {
    const isProcessing = processingOffer === offer.offer_id;
    const hasConflict = !offer.is_available;
    
    return (
      <View key={offer.offer_id} style={styles.offerCard}>
        {/* Header */}
        <View style={styles.offerHeader}>
          <View style={styles.offerTitleContainer}>
            <Text style={styles.offerTitle}>{offer.job_title}</Text>
            {hasConflict && (
              <View style={styles.conflictBadge}>
                <Ionicons name="warning" size={14} color={COLORS.white} />
                <Text style={styles.conflictText}>Conflict</Text>
              </View>
            )}
          </View>
          <Text style={styles.offerExpiry}>{getTimeRemaining(offer.expires_at)}</Text>
        </View>

        {/* Employer Info */}
        <View style={styles.employerInfo}>
          <Ionicons name="business" size={16} color={COLORS.gray[600]} />
          <Text style={styles.employerName}>{offer.employer_business || offer.employer_name}</Text>
        </View>

        {/* Job Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={styles.detailText}>₹{offer.wage}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={18} color={PRIMARY_COLOR} />
            <Text style={styles.detailText}>{offer.duration}</Text>
          </View>
        </View>

        {/* Schedule */}
        {offer.scheduled_date && (
          <View style={styles.scheduleContainer}>
            <Ionicons name="calendar" size={16} color={COLORS.gray[600]} />
            <Text style={styles.scheduleText}>
              {formatDateTime(offer.scheduled_date, offer.scheduled_start_time)}
            </Text>
          </View>
        )}

        {/* Location */}
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={16} color={COLORS.gray[600]} />
          <Text style={styles.locationText} numberOfLines={1}>{offer.address}</Text>
        </View>

        {/* Conflict Warning */}
        {hasConflict && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning-outline" size={20} color={ERROR_COLOR} />
            <Text style={styles.warningText}>
              You have another job scheduled during this time. Accepting will reject the conflicting job.
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.disabledButton]}
            onPress={() => handleRejectOffer(offer.offer_id, offer.job_title)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.gray[600]} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={ERROR_COLOR} />
                <Text style={styles.rejectButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.disabledButton]}
            onPress={() => handleAcceptOffer(offer.offer_id, offer.job_title)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.acceptButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={TEXT_COLOR} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Job Offers</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Loading job offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TEXT_COLOR} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Offers</Text>
        <TouchableOpacity onPress={loadJobOffers} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={PRIMARY_COLOR} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PRIMARY_COLOR]} />
        }
      >
        {offers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No Job Offers</Text>
            <Text style={styles.emptyText}>
              When employers accept your applications, you'll see their job offers here.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.offersHeader}>
              <Text style={styles.offersCount}>{offers.length} Pending Offer{offers.length !== 1 ? 's' : ''}</Text>
              <Text style={styles.offersSubtext}>Review and choose the best opportunity</Text>
            </View>
            {offers.map(renderOfferCard)}
          </>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    ...SHADOWS.sm,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  refreshButton: {
    padding: SPACING.xs,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: MD_SIZE,
    color: COLORS.gray[600],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl * 2,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: '600',
    color: TEXT_COLOR,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: MD_SIZE,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  offersHeader: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  offersCount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: TEXT_COLOR,
  },
  offersSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginTop: SPACING.xs,
  },
  offerCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  offerHeader: {
    marginBottom: SPACING.md,
  },
  offerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  offerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: '700',
    color: TEXT_COLOR,
    flex: 1,
  },
  conflictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ERROR_COLOR,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    marginLeft: SPACING.sm,
  },
  conflictText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: 4,
  },
  offerExpiry: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: ERROR_COLOR,
    fontWeight: '500',
  },
  employerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  employerName: {
    fontSize: MD_SIZE,
    color: COLORS.gray[700],
    marginLeft: SPACING.sm,
    fontWeight: '500',
  },
  detailsContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PRIMARY_COLOR + '10',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  detailText: {
    fontSize: MD_SIZE,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    marginLeft: SPACING.xs,
  },
  scheduleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  scheduleText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[700],
    marginLeft: SPACING.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginLeft: SPACING.sm,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ERROR_COLOR + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  warningText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: ERROR_COLOR,
    marginLeft: SPACING.sm,
    lineHeight: 18,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: ERROR_COLOR,
  },
  rejectButtonText: {
    fontSize: MD_SIZE,
    fontWeight: '600',
    color: ERROR_COLOR,
    marginLeft: SPACING.xs,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: PRIMARY_COLOR,
  },
  acceptButtonText: {
    fontSize: MD_SIZE,
    fontWeight: '600',
    color: COLORS.white,
    marginLeft: SPACING.xs,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
