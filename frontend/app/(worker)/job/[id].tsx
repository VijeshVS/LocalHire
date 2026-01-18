import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../constants/theme';
import { getJobById } from '../../../services/jobService';
import { applyForJob, getMyApplications } from '../../../services/applicationService';

export default function JobDetails() {
  const { id } = useLocalSearchParams();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [job, setJob] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchJobDetails();
    checkApplicationStatus();
  }, [id]);

  const checkApplicationStatus = async () => {
    try {
      const applications = await getMyApplications();
      const existingApp = applications.find((app: any) => app.job_postings?.id === id);
      if (existingApp) {
        setHasApplied(true);
        setApplicationStatus(existingApp.status);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const fetchJobDetails = async () => {
    try {
      const apiJob = await getJobById(id as string);
      setJob({
        ...apiJob,
        company: 'Employer',
        pay: apiJob.wage,
        location: apiJob.address,
        urgency: 'today',
        rating: 4.5,
        requirements: [],
        benefits: [],
        workingHours: '9:00 AM - 6:00 PM',
        employerName: 'Employer',
        employerRating: 4.5,
        employerJobs: 0,
        jobType: 'One-time',
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      setJob(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.worker.primary} />
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.gray[400]} />
          <Text style={styles.errorText}>Job not found</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getUrgencyConfig = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return { text: '🔥 URGENT', color: COLORS.status.error, bg: '#fef2f2' };
      case 'today':
        return { text: 'Today', color: COLORS.status.warning, bg: '#fef3c7' };
      default:
        return { text: 'Tomorrow', color: COLORS.status.info, bg: '#dbeafe' };
    }
  };

  const urgencyConfig = getUrgencyConfig(job.urgency || 'today');

  const handlePlayAudio = () => {
    setIsAudioPlaying(true);
    setTimeout(() => {
      setIsAudioPlaying(false);
    }, 3000);
  };

  const handleApply = async () => {
    if (hasApplied) {
      Alert.alert(
        'Already Applied',
        `You have already applied for this job. Status: ${applicationStatus}`,
        [
          {
            text: 'View My Applications',
            onPress: () => router.push('/(worker)/my-jobs')
          },
          { text: 'OK' }
        ]
      );
      return;
    }

    Alert.alert(
      'Apply for Job',
      `Apply for ${job.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply Now', 
          onPress: async () => {
            setIsApplying(true);
            try {
              await applyForJob(job.id || id as string);
              setHasApplied(true);
              setApplicationStatus('applied');
              Alert.alert(
                'Application Sent! 🎉',
                'The employer will contact you shortly. You can view all your applications in "My Jobs".',
                [
                  {
                    text: 'View My Applications',
                    onPress: () => router.push('/(worker)/my-jobs')
                  },
                  { text: 'OK' }
                ]
              );
            } catch (error: any) {
              if (error.message?.includes('already applied')) {
                setHasApplied(true);
                Alert.alert('Already Applied', 'You have already applied for this job.');
              } else {
                Alert.alert('Error', error.message || 'Failed to apply. Please try again.');
              }
            } finally {
              setIsApplying(false);
            }
          }
        }
      ]
    );
  };

  const handleCall = () => {
    Alert.alert('Call Employer', `Call ${job.employerName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Call', onPress: () => Alert.alert('Calling...') }
    ]);
  };

  const handleMessage = () => {
    router.push(`/(worker)/chat/${id}`);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    Alert.alert(isSaved ? 'Removed from saved' : 'Saved!', isSaved ? '' : 'You can find this in your saved jobs');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleSave}
        >
          <Ionicons 
            name={isSaved ? "bookmark" : "bookmark-outline"} 
            size={24} 
            color={isSaved ? COLORS.worker.primary : COLORS.gray[900]} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card */}
        <View style={styles.heroCard}>
          {/* Urgency Badge */}
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyConfig.bg }]}>
            <Text style={[styles.urgencyText, { color: urgencyConfig.color }]}>
              {urgencyConfig.text}
            </Text>
          </View>

          {/* Company Logo */}
          <View style={styles.companyLogo}>
            <Text style={styles.companyInitial}>{job.company[0]}</Text>
          </View>

          {/* Job Title */}
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.company}>{job.company}</Text>

          {/* Pay */}
          <View style={styles.payContainer}>
            <Text style={styles.payAmount}>₹{job.pay}</Text>
            <Text style={styles.payPeriod}>/day</Text>
          </View>

          {/* Quick Info */}
          <View style={styles.quickInfo}>
            <View style={styles.infoItem}>
              <Ionicons name="location" size={16} color={COLORS.gray[500]} />
              <Text style={styles.infoText}>{job.distance} away</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="time" size={16} color={COLORS.gray[500]} />
              <Text style={styles.infoText}>{job.duration}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.infoText}>{job.rating}</Text>
            </View>
          </View>
        </View>

        {/* Employer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Employer</Text>
          <View style={styles.employerCard}>
            <View style={styles.employerAvatar}>
              <Text style={styles.employerInitial}>{job.employerName[0]}</Text>
            </View>
            <View style={styles.employerInfo}>
              <Text style={styles.employerName}>{job.employerName}</Text>
              <View style={styles.employerMeta}>
                <Ionicons name="star" size={14} color="#f59e0b" />
                <Text style={styles.employerRating}>{job.employerRating}</Text>
                <Text style={styles.employerJobs}>• {job.employerJobs} jobs posted</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleCall}
            >
              <Ionicons name="call" size={20} color={COLORS.worker.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Audio Description (for non-smartphone workers simulation) */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.audioButton}
            onPress={handlePlayAudio}
          >
            <Ionicons 
              name={isAudioPlaying ? "stop-circle" : "play-circle"} 
              size={24} 
              color={COLORS.white} 
            />
            <Text style={styles.audioButtonText}>
              {isAudioPlaying ? 'Playing Job Details...' : 'Listen to Job Details'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          <View style={styles.listContainer}>
            {job.requirements.map((requirement, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listBullet}>
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                </View>
                <Text style={styles.listText}>{requirement}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What You'll Get</Text>
          <View style={styles.benefitsGrid}>
            {job.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitCard}>
                <Ionicons name="gift" size={20} color={COLORS.worker.primary} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={24} color={COLORS.gray[400]} />
              <Text style={styles.detailLabel}>Working Hours</Text>
              <Text style={styles.detailValue}>{job.workingHours}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={24} color={COLORS.gray[400]} />
              <Text style={styles.detailLabel}>Job Type</Text>
              <Text style={styles.detailValue}>{job.jobType}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={24} color={COLORS.gray[400]} />
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{job.location}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={24} color={COLORS.gray[400]} />
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{job.category}</Text>
            </View>
          </View>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={handleMessage}
        >
          <Ionicons name="chatbubble-outline" size={24} color={COLORS.worker.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.applyButton}
          onPress={handleApply}
        >
          <Text style={styles.applyButtonText}>Apply Now</Text>
          <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  content: {
    flex: 1,
  },
  heroCard: {
    backgroundColor: COLORS.white,
    padding: SPACING.xxl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  urgencyBadge: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  urgencyText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  companyLogo: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.worker.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  companyInitial: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  company: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[500],
    marginBottom: SPACING.lg,
  },
  payContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: COLORS.worker.bg,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  payAmount: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  payPeriod: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.worker.dark,
    marginLeft: SPACING.xs,
  },
  quickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  infoDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.gray[300],
    marginHorizontal: SPACING.md,
  },
  section: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.lg,
  },
  employerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  employerAvatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.employer.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  employerInitial: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  employerInfo: {
    flex: 1,
  },
  employerName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  employerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  employerRating: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[700],
  },
  employerJobs: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  contactButton: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.system.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
    gap: SPACING.md,
  },
  audioButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.base,
    lineHeight: 24,
    color: COLORS.gray[700],
  },
  listContainer: {
    gap: SPACING.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  listBullet: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.worker.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  listText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[700],
    lineHeight: 24,
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.worker.bg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  benefitText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.worker.dark,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  detailItem: {
    width: '48%',
    backgroundColor: COLORS.gray[50],
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
    marginTop: SPACING.sm,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    gap: SPACING.md,
    ...SHADOWS.lg,
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.gray[50],
    borderWidth: 2,
    borderColor: COLORS.worker.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.worker.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  applyButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    color: COLORS.gray[600],
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  backButton: {
    backgroundColor: COLORS.worker.primary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  backButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});