import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

const jobDetails = {
  '1': {
    title: 'Experienced Painter',
    company: 'Home Decor Co.',
    location: 'Koramangala, Bangalore',
    distance: '500m',
    pay: '₹800/day',
    urgency: 'Immediate',
    rating: 4.5,
    description: 'We need an experienced painter for interior wall painting. The job involves painting 3 rooms in a residential apartment. Must have experience with premium paints and color matching.',
    requirements: ['2+ years experience', 'Own painting tools', 'Color matching skills', 'Professional attitude'],
    benefits: ['Daily payment', 'Transportation allowance', 'Future work opportunities'],
    workingHours: '9:00 AM - 6:00 PM',
    employerName: 'Rajesh Kumar',
    employerRating: 4.8,
    jobType: 'Full Day',
    coordinates: { latitude: 12.9352, longitude: 77.6245 }
  },
  '2': {
    title: 'Helper Required',
    company: 'Quick Fix Services',
    location: 'BTM Layout, Bangalore',
    distance: '1.2km',
    pay: '₹600/day',
    urgency: 'Today',
    rating: 4.2,
    description: 'Need a reliable helper for home shifting and organizing. Physical work involved including lifting furniture and organizing household items.',
    requirements: ['Physical fitness', 'Honest and reliable', 'Team player'],
    benefits: ['Flexible timing', 'Lunch provided', 'Bonus for good work'],
    workingHours: '10:00 AM - 5:00 PM',
    employerName: 'Priya Sharma',
    employerRating: 4.6,
    jobType: 'Half Day',
    coordinates: { latitude: 12.9165, longitude: 77.6101 }
  }
};

export default function JobDetails() {
  const { id } = useLocalSearchParams();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  
  const job = jobDetails[id as keyof typeof jobDetails];

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Job not found</Text>
      </SafeAreaView>
    );
  }

  const handlePlayAudio = () => {
    setIsAudioPlaying(true);
    // Simulate audio playback
    setTimeout(() => {
      setIsAudioPlaying(false);
    }, 3000);
  };

  const handleApply = () => {
    Alert.alert(
      'Apply for Job',
      'Do you want to apply for this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Apply', 
          onPress: () => {
            Alert.alert('Success!', 'Your application has been sent to the employer.');
            router.back();
          }
        }
      ]
    );
  };

  const handleCall = () => {
    Alert.alert('Call Employer', `Calling ${job.employerName}...`);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Immediate': return { bg: '#fee2e2', text: '#dc2626' };
      case 'Today': return { bg: '#fef3c7', text: '#d97706' };
      default: return { bg: '#dcfce7', text: '#16a34a' };
    }
  };

  const urgencyColors = getUrgencyColor(job.urgency);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Overview */}
        <View style={styles.jobOverview}>
          <View style={styles.jobHeader}>
            <View style={styles.jobTitleSection}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobCompany}>{job.company}</Text>
            </View>
            <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors.bg }]}>
              <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
                {job.urgency}
              </Text>
            </View>
          </View>

          <View style={styles.jobMetrics}>
            <View style={styles.metricItem}>
              <Ionicons name="location-outline" size={20} color="#6b7280" />
              <Text style={styles.metricText}>{job.location}</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.metricText}>{job.workingHours}</Text>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="wallet-outline" size={20} color="#16a34a" />
              <Text style={[styles.metricText, { color: '#16a34a', fontWeight: '600' }]}>
                {job.pay}
              </Text>
            </View>
          </View>
        </View>

        {/* Audio Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Listen to Job Description</Text>
          <TouchableOpacity 
            style={[styles.audioButton, isAudioPlaying && styles.audioButtonPlaying]}
            onPress={handlePlayAudio}
          >
            <Ionicons 
              name={isAudioPlaying ? "stop" : "play"} 
              size={24} 
              color="white" 
            />
            <Text style={styles.audioButtonText}>
              {isAudioPlaying ? 'Playing...' : 'Listen to Job Details'}
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
          {job.requirements.map((requirement, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#16a34a" />
              <Text style={styles.listText}>{requirement}</Text>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Benefits</Text>
          {job.benefits.map((benefit, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons name="gift-outline" size={16} color="#2563eb" />
              <Text style={styles.listText}>{benefit}</Text>
            </View>
          ))}
        </View>

        {/* Employer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employer Information</Text>
          <View style={styles.employerInfo}>
            <View style={styles.employerAvatar}>
              <Text style={styles.employerInitial}>{job.employerName[0]}</Text>
            </View>
            <View style={styles.employerDetails}>
              <Text style={styles.employerName}>{job.employerName}</Text>
              <View style={styles.employerRating}>
                <Ionicons name="star" size={16} color="#fbbf24" />
                <Text style={styles.ratingText}>{job.employerRating} rating</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.safetyCard}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#16a34a" />
            <View style={styles.safetyContent}>
              <Text style={styles.safetyTitle}>Stay Safe</Text>
              <Text style={styles.safetyText}>
                • Meet in public places first{'\n'}
                • Verify employer identity{'\n'}
                • Share location with family
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Ionicons name="call" size={24} color="#2563eb" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Ionicons name="checkmark" size={24} color="white" />
          <Text style={styles.applyButtonText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  shareButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobOverview: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobTitleSection: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 16,
    color: '#6b7280',
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobMetrics: {
    gap: 12,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
  },
  audioButtonPlaying: {
    backgroundColor: '#dc2626',
  },
  audioButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
    flex: 1,
  },
  employerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  employerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employerInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  employerDetails: {
    flex: 1,
  },
  employerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  employerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  safetyCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  safetyContent: {
    flex: 1,
    marginLeft: 12,
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  safetyText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
  },
  callButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 12,
    flex: 2,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});