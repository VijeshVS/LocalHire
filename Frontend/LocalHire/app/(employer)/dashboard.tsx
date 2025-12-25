import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const activeJobs = [
  {
    id: 1,
    title: 'Experienced Painter',
    category: 'Painting',
    applicants: 8,
    budget: '₹800/day',
    posted: '2 hours ago',
    status: 'Active',
    urgency: 'Immediate',
    location: 'Koramangala'
  },
  {
    id: 2,
    title: 'House Cleaning',
    category: 'Cleaning',
    applicants: 15,
    budget: '₹500/day',
    posted: '1 day ago',
    status: 'Active',
    urgency: 'Today',
    location: 'BTM Layout'
  },
  {
    id: 3,
    title: 'Moving Helper',
    category: 'Helper',
    applicants: 3,
    budget: '₹600/day',
    posted: '3 hours ago',
    status: 'Paused',
    urgency: 'Tomorrow',
    location: 'Jayanagar'
  }
];

const recentActivity = [
  { id: 1, type: 'application', message: 'Ravi Kumar applied for Painter job', time: '5 min ago', icon: 'person-add' },
  { id: 2, type: 'completed', message: 'House Cleaning job completed successfully', time: '2 hours ago', icon: 'checkmark-circle' },
  { id: 3, type: 'message', message: 'New message from Priya about Helper job', time: '1 day ago', icon: 'chatbubble' },
  { id: 4, type: 'review', message: 'You received a 5-star review', time: '2 days ago', icon: 'star' },
];

const quickStats = [
  { label: 'Active Jobs', value: '3', icon: 'briefcase', color: '#2563eb' },
  { label: 'Total Applicants', value: '26', icon: 'people', color: '#16a34a' },
  { label: 'Jobs Completed', value: '15', icon: 'checkmark-done', color: '#8b5cf6' },
  { label: 'Average Rating', value: '4.8', icon: 'star', color: '#f59e0b' },
];

export default function EmployerDashboard() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#16a34a';
      case 'paused': return '#f59e0b';
      case 'completed': return '#6b7280';
      default: return '#2563eb';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Immediate': return { bg: '#fee2e2', text: '#dc2626' };
      case 'Today': return { bg: '#fef3c7', text: '#d97706' };
      default: return { bg: '#dcfce7', text: '#16a34a' };
    }
  };

  const renderJobCard = ({ item }: { item: typeof activeJobs[0] }) => {
    const urgencyColors = getUrgencyColor(item.urgency);
    
    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => router.push('/employer/candidates')}>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.jobCategory}>{item.category} • {item.location}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobMetric}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={styles.metricText}>{item.applicants} applicants</Text>
          </View>
          <View style={styles.jobMetric}>
            <Ionicons name="wallet-outline" size={16} color="#16a34a" />
            <Text style={styles.metricText}>{item.budget}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors.bg }]}>
            <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
              {item.urgency}
            </Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <Text style={styles.postedTime}>Posted {item.posted}</Text>
          <View style={styles.jobActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="eye-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="create-outline" size={16} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="pause-outline" size={16} color="#f59e0b" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderActivityItem = ({ item }: { item: typeof recentActivity[0] }) => {
    const getActivityColor = (type: string) => {
      switch (type) {
        case 'application': return '#2563eb';
        case 'completed': return '#16a34a';
        case 'message': return '#8b5cf6';
        case 'review': return '#f59e0b';
        default: return '#6b7280';
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: getActivityColor(item.type) }]}>
          <Ionicons name={item.icon as any} size={16} color="white" />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityMessage}>{item.message}</Text>
          <Text style={styles.activityTime}>{item.time}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning! 👋</Text>
          <Text style={styles.subGreeting}>Manage your job postings</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#1f2937" />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon as any} size={20} color="white" />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(employer)/post-job')}
            >
              <Ionicons name="add-circle" size={32} color="#2563eb" />
              <Text style={styles.quickActionText}>Post New Job</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickActionButton}
              onPress={() => router.push('/(employer)/candidates')}
            >
              <Ionicons name="people" size={32} color="#16a34a" />
              <Text style={styles.quickActionText}>View Candidates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="analytics" size={32} color="#8b5cf6" />
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Active Jobs</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={activeJobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <FlatList
            data={recentActivity}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </View>

        {/* Tips Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tips for Better Results</Text>
          <View style={styles.tipsContainer}>
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
              <Text style={styles.tipText}>Add clear job descriptions to get quality applicants</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="time-outline" size={20} color="#f59e0b" />
              <Text style={styles.tipText}>Respond quickly to applications for better engagement</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="star-outline" size={20} color="#f59e0b" />
              <Text style={styles.tipText}>Rate workers after job completion to build trust</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(employer)/post-job')}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  subGreeting: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    marginVertical: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 60) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: (width - 80) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  jobCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 16,
    marginBottom: 16,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  jobCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  jobDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  jobMetric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postedTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityMessage: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    marginLeft: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#2563eb',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});