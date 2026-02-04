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
import { getMyApplicationsWithConflicts } from '../../services/applicationService';
import { getJobOffers, acceptJobOffer, rejectJobOffer } from '../../services/jobOfferService';
import { markJobCompleted } from '../../services/jobCompletionService';

type TabType = 'offers' | 'active' | 'applied' | 'completed';

export default function MyJobsScreen() {
  const [applications, setApplications] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('offers');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [employerRating, setEmployerRating] = useState(0);
  const [employerReview, setEmployerReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingOfferId, setProcessingOfferId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Load both applications and offers in parallel
      const [appsData, offersData] = await Promise.all([
        getMyApplicationsWithConflicts().catch(() => []),
        getJobOffers().catch(() => ({ offers: [] }))
      ]);
      
      setApplications(appsData || []);
      setOffers(offersData?.offers || []);
      
      // Auto-switch to offers tab if there are pending offers
      if (offersData?.offers?.length > 0 && selectedTab === 'offers') {
        // Stay on offers tab
      } else if (appsData?.some((app: any) => app.status === 'accepted' && app.work_status !== 'completed')) {
        // If no offers but has active jobs, show active
        if (offersData?.offers?.length === 0) {
          setSelectedTab('active');
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load jobs. Please try again.');
      setApplications([]);
      setOffers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  // Helper function to convert time string (HH:MM or HH:MM:SS) to minutes for comparison
  const timeToMinutes = (timeStr: string | null | undefined): number => {
    if (!timeStr || typeof timeStr !== 'string') return -1;
    const parts = timeStr.split(':');
    if (parts.length < 2) return -1;
    const hours = parseInt(parts[0], 10);
    const mins = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(mins)) return -1;
    return hours * 60 + mins;
  };

  // Check if two time ranges overlap - returns false if any data is missing
  const doTimesOverlap = (
    start1: string | null | undefined, 
    end1: string | null | undefined, 
    start2: string | null | undefined, 
    end2: string | null | undefined
  ): boolean => {
    const s1 = timeToMinutes(start1);
    const e1 = timeToMinutes(end1);
    const s2 = timeToMinutes(start2);
    const e2 = timeToMinutes(end2);
    
    // If any time is invalid/missing, NO CONFLICT
    if (s1 < 0 || e1 < 0 || s2 < 0 || e2 < 0) {
      return false;
    }
    
    // Two ranges overlap if start1 < end2 AND end1 > start2
    return s1 < e2 && e1 > s2;
  };

  // Get offers with conflict information
  const getOffersWithConflicts = () => {
    const offersList = offers || [];
    
    // Get accepted jobs that worker is currently working on
    const acceptedJobs = applications
      .filter(app => app.status === 'accepted' && app.work_status === 'in_progress')
      .map(app => ({
        id: app.id,
        job_id: app.job_posting_id || app.job_postings?.id,
        title: app.job_postings?.title || 'Unknown Job',
        date: app.job_postings?.scheduled_date || null,
        start: app.job_postings?.scheduled_start_time || null,
        end: app.job_postings?.scheduled_end_time || null,
      }));
    
    return offersList.map((offer: any) => {
      const offerDate = offer.scheduled_date;
      const offerStart = offer.scheduled_start_time;
      const offerEnd = offer.scheduled_end_time;
      const offerJobId = offer.job_id; // The underlying job posting ID
      
      // If offer has no schedule info, no conflict possible
      if (!offerDate || !offerStart || !offerEnd) {
        return {
          ...offer,
          hasConflict: false,
          conflictingOffers: [],
          hasExistingJobConflict: false
        };
      }
      
      let conflictingOffers: string[] = [];
      let hasExistingJobConflict = false;
      
      // Only check against accepted/in-progress jobs on the SAME DATE
      // BUT SKIP if it's the SAME job posting (offer for same job they already accepted)
      acceptedJobs.forEach(job => {
        // Skip if this is the same underlying job posting
        if (offerJobId && job.job_id && offerJobId === job.job_id) {
          return;
        }
        
        // Must be same date
        if (job.date === offerDate && job.start && job.end) {
          // Check if times overlap
          if (doTimesOverlap(offerStart, offerEnd, job.start, job.end)) {
            hasExistingJobConflict = true;
            conflictingOffers.push(job.title);
          }
        }
      });
      
      // Also check against other PENDING offers on same date
      offersList.forEach((otherOffer: any) => {
        // Skip self (same offer)
        if (otherOffer.offer_id === offer.offer_id) return;
        
        // Skip if same underlying job posting
        if (offerJobId && otherOffer.job_id && offerJobId === otherOffer.job_id) return;
        
        // Must be same date
        if (otherOffer.scheduled_date === offerDate && 
            otherOffer.scheduled_start_time && 
            otherOffer.scheduled_end_time) {
          // Check if times overlap
          if (doTimesOverlap(offerStart, offerEnd, otherOffer.scheduled_start_time, otherOffer.scheduled_end_time)) {
            conflictingOffers.push(otherOffer.job_title);
          }
        }
      });
      
      const result = {
        ...offer,
        hasConflict: conflictingOffers.length > 0,
        conflictingOffers,
        hasExistingJobConflict
      };
      
      return result;
    });
  };

  const handleAcceptOffer = async (offer: any) => {
    const warningMessage = offer.hasExistingJobConflict 
      ? 'You have an existing job scheduled during this time. Accepting this offer will cancel the other job.'
      : offer.hasConflict
      ? `This offer conflicts with "${offer.conflictingOffers.join(', ')}". You can only accept one.`
      : '';

    Alert.alert(
      'Accept Job Offer',
      `Do you want to accept the offer for "${offer.job_title}"?\n\n${warningMessage}`.trim(),
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setProcessingOfferId(offer.offer_id);
              const result = await acceptJobOffer(offer.offer_id);
              
              if (result.success) {
                Alert.alert('Success', 'Job offer accepted! The job has been added to your schedule.');
                await loadData();
              } else {
                Alert.alert('Error', result.error || 'Failed to accept offer');
              }
            } catch (error: any) {
              const errorMsg = error.message || 'Failed to accept offer';
              if (errorMsg.includes('conflict') || errorMsg.includes('time')) {
                Alert.alert(
                  'Schedule Conflict',
                  'You already have a job accepted at this time. Please complete or cancel it first.'
                );
              } else {
                Alert.alert('Error', errorMsg);
              }
            } finally {
              setProcessingOfferId(null);
            }
          }
        }
      ]
    );
  };

  const handleRejectOffer = async (offer: any) => {
    Alert.alert(
      'Reject Job Offer',
      `Are you sure you want to reject "${offer.job_title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingOfferId(offer.offer_id);
              const result = await rejectJobOffer(offer.offer_id);
              
              if (result.success) {
                await loadData();
              } else {
                Alert.alert('Error', result.error || 'Failed to reject offer');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject offer');
            } finally {
              setProcessingOfferId(null);
            }
          }
        }
      ]
    );
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
      await loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to mark job as completed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredApplications = () => {
    return applications.filter(app => {
      if (selectedTab === 'applied') {
        // Applied/pending applications that are waiting for employer response
        // EXCLUDE: jobs where employer accepted (status='accepted') - these go to Active
        // Only show: applied, pending, shortlisted
        return app.status === 'applied' || app.status === 'pending' || app.status === 'shortlisted';
      } else if (selectedTab === 'active') {
        // Active jobs include:
        // 1. Jobs where employer accepted (status='accepted') AND worker is working (work_status='in_progress')
        // 2. Jobs where employer accepted (status='accepted') BUT worker hasn't started yet (work_status is pending/null)
        // Basically all 'accepted' jobs that are NOT completed
        return app.status === 'accepted' && app.work_status !== 'completed';
      } else if (selectedTab === 'completed') {
        return app.work_status === 'completed' || app.status === 'rejected';
      }
      return false;
    });
  };

  const formatDateTime = (date: string, startTime: string, endTime: string) => {
    if (!date) return 'Not scheduled';
    const dateStr = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    if (startTime && endTime) {
      return `${dateStr} • ${startTime} - ${endTime}`;
    }
    return dateStr;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
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

  // Render offer card with conflict highlighting
  const renderOfferCard = (offer: any) => {
    const isProcessing = processingOfferId === offer.offer_id;
    const cardStyle = offer.hasConflict 
      ? [styles.offerCard, styles.conflictCard] 
      : styles.offerCard;

    return (
      <View key={offer.offer_id} style={cardStyle}>
        {/* Conflict Banner */}
        {offer.hasConflict && (
          <View style={styles.conflictBanner}>
            <Ionicons name="warning" size={16} color="#92400e" />
            <Text style={styles.conflictBannerText}>
              {offer.hasExistingJobConflict 
                ? 'Conflicts with your accepted job'
                : `Conflicts with: ${offer.conflictingOffers.join(', ')}`}
            </Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.offerHeader}>
          <View style={styles.offerTitleContainer}>
            <Text style={styles.offerTitle}>{offer.job_title}</Text>
            <Text style={styles.offerExpiry}>{getTimeRemaining(offer.expires_at)}</Text>
          </View>
          <Text style={styles.offerWage}>₹{offer.wage}</Text>
        </View>

        {/* Employer */}
        <View style={styles.detailRow}>
          <Ionicons name="business-outline" size={16} color={COLORS.gray[500]} />
          <Text style={styles.detailText}>{offer.employer_business || offer.employer_name}</Text>
        </View>

        {/* Schedule */}
        {offer.scheduled_date && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={COLORS.gray[500]} />
            <Text style={styles.detailText}>
              {formatDateTime(offer.scheduled_date, offer.scheduled_start_time, offer.scheduled_end_time)}
            </Text>
          </View>
        )}

        {/* Location */}
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
          <Text style={styles.detailText} numberOfLines={1}>{offer.address}</Text>
        </View>

        {/* Duration */}
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={COLORS.gray[500]} />
          <Text style={styles.detailText}>{offer.duration}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.offerActions}>
          <TouchableOpacity
            style={[styles.rejectButton, isProcessing && styles.disabledButton]}
            onPress={() => handleRejectOffer(offer)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color={COLORS.gray[600]} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color="#dc2626" />
                <Text style={styles.rejectButtonText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptButton, isProcessing && styles.disabledButton]}
            onPress={() => handleAcceptOffer(offer)}
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

  const renderJobCard = ({ item }: any) => {
    const job = item.job_postings || {};
    const status = item.status;
    const workStatus = item.work_status || 'pending';
    const hasConflicts = item.has_conflicts || false;
    const jobDeleted = item.job_deleted || !job.id;

    // Determine badge
    let badgeStyle = styles.appliedBadge;
    let badgeText = 'Applied';
    
    if (jobDeleted) {
      badgeStyle = styles.deletedBadge;
      badgeText = 'Job Deleted';
    } else if (status === 'rejected') {
      badgeStyle = styles.rejectedBadge;
      badgeText = 'Rejected';
    } else if (status === 'shortlisted') {
      badgeStyle = styles.shortlistedBadge;
      badgeText = 'Shortlisted';
    } else if (status === 'accepted' && workStatus === 'completed') {
      badgeStyle = styles.completedBadge;
      badgeText = 'Completed';
    } else if (status === 'accepted') {
      badgeStyle = styles.acceptedBadge;
      badgeText = 'Active';
    }

    // Check if job can be marked complete (schedule time has passed)
    const canMarkComplete = () => {
      if (workStatus === 'completed') return false;
      if (status !== 'accepted') return false;
      if (jobDeleted) return false;
      
      // Check if scheduled end time has passed
      if (job.scheduled_date && job.scheduled_end_time) {
        const endDateTime = new Date(`${job.scheduled_date}T${job.scheduled_end_time}`);
        const now = new Date();
        return now >= endDateTime;
      }
      // If no schedule, allow completion
      return true;
    };

    const getTimeUntilComplete = () => {
      if (!job.scheduled_date || !job.scheduled_end_time) return null;
      const endDateTime = new Date(`${job.scheduled_date}T${job.scheduled_end_time}`);
      const now = new Date();
      const diff = endDateTime.getTime() - now.getTime();
      
      if (diff <= 0) return null;
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) return `${hours}h ${minutes}m until job ends`;
      return `${minutes}m until job ends`;
    };

    const cardStyle = jobDeleted 
      ? [styles.jobCard, styles.deletedCard]
      : hasConflicts 
      ? [styles.jobCard, styles.conflictCard] 
      : styles.jobCard;

    const scheduleText = job.scheduled_date && job.scheduled_start_time && job.scheduled_end_time
      ? formatDateTime(job.scheduled_date, job.scheduled_start_time, job.scheduled_end_time)
      : null;

    const timeRemaining = getTimeUntilComplete();

    return (
      <View style={cardStyle}>
        {jobDeleted && (
          <View style={styles.deletedBanner}>
            <Ionicons name="trash-outline" size={16} color="#6b7280" />
            <Text style={styles.deletedBannerText}>This job has been removed by the employer</Text>
          </View>
        )}

        {hasConflicts && !jobDeleted && (
          <View style={styles.conflictBanner}>
            <Ionicons name="warning" size={16} color="#92400e" />
            <Text style={styles.conflictBannerText}>Schedule conflict detected</Text>
          </View>
        )}

        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={[styles.jobTitle, jobDeleted && styles.deletedText]}>{job.title || 'Job'}</Text>
            <View style={badgeStyle}>
              <Text style={[styles.statusText, (status === 'rejected' || jobDeleted) && { color: '#6b7280' }]}>
                {badgeText}
              </Text>
            </View>
          </View>
          {!jobDeleted && <Text style={styles.wage}>₹{job.wage || 0}</Text>}
        </View>

        {!jobDeleted && (
          <View style={styles.jobDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
              <Text style={styles.detailText}>{job.address || 'Location'}</Text>
            </View>
            {scheduleText && (
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={16} color={COLORS.gray[500]} />
                <Text style={styles.detailText}>{scheduleText}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray[500]} />
              <Text style={styles.detailText}>{job.duration || 'Duration'}</Text>
            </View>
          </View>
        )}

        {status === 'accepted' && workStatus !== 'completed' && !jobDeleted && (
          canMarkComplete() ? (
            <TouchableOpacity
              style={styles.completeButton}
              onPress={() => handleMarkComplete(item)}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.completeButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingInfo}>
              <Ionicons name="time-outline" size={20} color="#f59e0b" />
              <Text style={styles.waitingInfoText}>{timeRemaining || 'Job in progress'}</Text>
            </View>
          )
        )}

        {workStatus === 'completed' && (
          <View style={styles.completedInfo}>
            <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
            <Text style={styles.completedInfoText}>Awaiting employer confirmation</Text>
          </View>
        )}

        {status === 'rejected' && !jobDeleted && (
          <View style={styles.rejectedInfo}>
            <Ionicons name="close-circle" size={20} color="#dc2626" />
            <Text style={styles.rejectedInfoText}>Not selected for this job</Text>
          </View>
        )}

        {status === 'shortlisted' && !jobDeleted && (
          <View style={styles.shortlistedInfo}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={styles.shortlistedInfoText}>Employer is reviewing your profile</Text>
          </View>
        )}
      </View>
    );
  };

  const offersWithConflicts = getOffersWithConflicts();
  const pendingOffersCount = offersWithConflicts.length;

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
        <TouchableOpacity 
          onPress={handleRefresh}
          disabled={isRefreshing}
          style={styles.refreshButton}
        >
          <Ionicons 
            name="refresh-outline" 
            size={24} 
            color={isRefreshing ? COLORS.gray[400] : COLORS.gray[900]} 
            style={isRefreshing ? styles.refreshing : undefined}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'offers' && styles.activeTab]}
            onPress={() => setSelectedTab('offers')}
          >
            <Text style={[styles.tabText, selectedTab === 'offers' && styles.activeTabText]}>
              Offers
            </Text>
            {pendingOffersCount > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{pendingOffersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'active' && styles.activeTab]}
            onPress={() => setSelectedTab('active')}
          >
            <Text style={[styles.tabText, selectedTab === 'active' && styles.activeTabText]}>
              Active
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'applied' && styles.activeTab]}
            onPress={() => setSelectedTab('applied')}
          >
            <Text style={[styles.tabText, selectedTab === 'applied' && styles.activeTabText]}>
              Applied
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
            onPress={() => setSelectedTab('completed')}
          >
            <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Content */}
      {selectedTab === 'offers' ? (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[COLORS.worker.primary]} />
          }
        >
          {offersWithConflicts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-open-outline" size={64} color={COLORS.gray[300]} />
              <Text style={styles.emptyTitle}>No pending offers</Text>
              <Text style={styles.emptySubtitle}>
                When employers accept your applications, offers will appear here for you to review
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={COLORS.worker.primary} />
                <Text style={styles.infoText}>
                  Review offers below. Jobs at the same time are highlighted in orange - you can only accept one.
                </Text>
              </View>
              {offersWithConflicts.map(renderOfferCard)}
            </>
          )}
        </ScrollView>
      ) : (
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
              <Ionicons 
                name={selectedTab === 'active' ? 'briefcase-outline' : selectedTab === 'applied' ? 'send-outline' : 'archive-outline'} 
                size={64} 
                color={COLORS.gray[300]} 
              />
              <Text style={styles.emptyTitle}>
                {selectedTab === 'active' 
                  ? 'No active jobs' 
                  : selectedTab === 'applied' 
                  ? 'No pending applications'
                  : 'No history yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedTab === 'active'
                  ? 'Accept offers to start working on jobs'
                  : selectedTab === 'applied'
                  ? 'Jobs you apply for will appear here'
                  : 'Completed and rejected jobs will appear here'}
              </Text>
            </View>
          }
        />
      )}

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
  refreshButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshing: {
    transform: [{ rotate: '180deg' }],
  },
  tabScroll: {
    backgroundColor: COLORS.white,
    maxHeight: 50,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginRight: SPACING.xs,
  },
  activeTab: {
    borderBottomColor: COLORS.worker.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[600],
  },
  activeTabText: {
    color: COLORS.worker.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  tabBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.worker.bg,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.worker.primary,
    lineHeight: 20,
  },
  // Offer Card Styles
  offerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  offerTitleContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  offerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  offerExpiry: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: '#f59e0b',
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  offerWage: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  offerActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#dc2626',
    gap: SPACING.xs,
  },
  rejectButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: '#dc2626',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.worker.primary,
    gap: SPACING.xs,
  },
  acceptButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Job Card Styles
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
  jobDetails: {
    marginBottom: SPACING.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  detailText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  wage: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  // Status Badges
  appliedBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  shortlistedBadge: {
    backgroundColor: '#fef3c7',
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
  deletedBadge: {
    backgroundColor: '#e5e7eb',
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
  // Conflict Styling
  conflictCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  deletedCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#9ca3af',
    backgroundColor: '#f3f4f6',
    opacity: 0.8,
  },
  deletedText: {
    color: COLORS.gray[500],
    textDecorationLine: 'line-through',
  },
  deletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  deletedBannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#6b7280',
  },
  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  conflictBannerText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#92400e',
  },
  // Info boxes
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.worker.primary,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
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
    paddingVertical: SPACING.sm,
    backgroundColor: '#d1fae5',
    borderRadius: RADIUS.sm,
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
    paddingVertical: SPACING.sm,
    backgroundColor: '#fee2e2',
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  rejectedInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#dc2626',
  },
  shortlistedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: '#fef3c7',
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  shortlistedInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#92400e',
  },
  waitingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: '#fef3c7',
    borderRadius: RADIUS.sm,
    gap: SPACING.xs,
  },
  waitingInfoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: '#b45309',
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl * 3,
    paddingHorizontal: SPACING.lg,
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
    lineHeight: 20,
  },
  // Modal styles
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
