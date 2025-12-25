import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

const jobsList = [
  {
    id: '1',
    title: 'Experienced Painter',
    category: 'Painting',
    status: 'active',
    applicants: 8,
    budget: '₹800/day',
    posted: '2 hours ago',
    urgency: 'Immediate',
    location: 'Koramangala',
    description: 'Need an experienced painter for interior wall painting...',
    views: 45,
    hired: 0,
  },
  {
    id: '2',
    title: 'House Cleaning Staff',
    category: 'Cleaning',
    status: 'active',
    applicants: 15,
    budget: '₹500/day',
    posted: '1 day ago',
    urgency: 'Today',
    location: 'BTM Layout',
    description: 'Looking for reliable cleaning staff for daily house cleaning...',
    views: 78,
    hired: 1,
  },
  {
    id: '3',
    title: 'Moving Helper',
    category: 'Helper',
    status: 'paused',
    applicants: 3,
    budget: '₹600/day',
    posted: '3 hours ago',
    urgency: 'Tomorrow',
    location: 'Jayanagar',
    description: 'Need help with household moving and packing...',
    views: 23,
    hired: 0,
  },
  {
    id: '4',
    title: 'Kitchen Helper',
    category: 'Helper',
    status: 'completed',
    applicants: 12,
    budget: '₹400/day',
    posted: '5 days ago',
    urgency: 'This Week',
    location: 'Indiranagar',
    description: 'Restaurant kitchen helper needed for food preparation...',
    views: 67,
    hired: 2,
  },
  {
    id: '5',
    title: 'Office Cleaning',
    category: 'Cleaning',
    status: 'expired',
    applicants: 6,
    budget: '₹700/day',
    posted: '7 days ago',
    urgency: 'This Week',
    location: 'Electronic City',
    description: 'Regular office cleaning and maintenance required...',
    views: 34,
    hired: 0,
  },
];

export default function JobManagement() {
  const [jobs, setJobs] = useState(jobsList);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<typeof jobsList[0] | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#16a34a';
      case 'paused': return '#f59e0b';
      case 'completed': return '#8b5cf6';
      case 'expired': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'paused': return 'Paused';
      case 'completed': return 'Completed';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'Immediate': return { backgroundColor: '#fee2e2', color: '#dc2626' };
      case 'Today': return { backgroundColor: '#fef3c7', color: '#d97706' };
      case 'Tomorrow': return { backgroundColor: '#dcfce7', color: '#16a34a' };
      default: return { backgroundColor: '#e0e7ff', color: '#2563eb' };
    }
  };

  const handleJobAction = (action: string, job: typeof jobsList[0]) => {
    setSelectedJob(job);
    
    switch (action) {
      case 'edit':
        router.push({
          pathname: '/(employer)/edit-job/[id]',
          params: { id: job.id }
        });
        break;
      case 'pause':
        Alert.alert('Pause Job', `Pause "${job.title}"?`, [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Pause', 
            onPress: () => updateJobStatus(job.id, 'paused')
          }
        ]);
        break;
      case 'activate':
        updateJobStatus(job.id, 'active');
        break;
      case 'complete':
        Alert.alert('Mark Complete', `Mark "${job.title}" as completed?`, [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Complete', 
            onPress: () => updateJobStatus(job.id, 'completed')
          }
        ]);
        break;
      case 'delete':
        Alert.alert('Delete Job', `Delete "${job.title}"? This action cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => deleteJob(job.id)
          }
        ]);
        break;
      case 'viewCandidates':
        router.push(`/(employer)/candidates?jobId=${job.id}`);
        break;
      case 'promote':
        Alert.alert('Promote Job', 'Promote this job to reach more candidates?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Promote', onPress: () => console.log('Promote job') }
        ]);
        break;
      default:
        break;
    }
    setShowActionModal(false);
  };

  const updateJobStatus = (jobId: string, newStatus: string) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
  };

  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const filteredJobs = jobs.filter(job => {
    switch (selectedFilter) {
      case 'active': return job.status === 'active';
      case 'paused': return job.status === 'paused';
      case 'completed': return job.status === 'completed';
      default: return true;
    }
  });

  const renderJobCard = ({ item }: { item: typeof jobsList[0] }) => (
    <View style={styles.jobCard}>
      {/* Job Header */}
      <View style={styles.jobHeader}>
        <View style={styles.jobTitleContainer}>
          <Text style={styles.jobTitle}>{item.title}</Text>
          <Text style={styles.jobCategory}>{item.category} • {item.location}</Text>
        </View>
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => {
            setSelectedJob(item);
            setShowActionModal(true);
          }}
        >
          <Icon name="options" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Job Status & Budget */}
      <View style={styles.jobMeta}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
        
        <Text style={styles.jobBudget}>{item.budget}</Text>
        
        <View style={[styles.urgencyBadge, getUrgencyStyle(item.urgency)]}>
          <Text style={[styles.urgencyText, { color: getUrgencyStyle(item.urgency).color }]}>
            {item.urgency}
          </Text>
        </View>
      </View>

      {/* Job Stats */}
      <View style={styles.jobStats}>
        <View style={styles.statItem}>
          <Icon name="people" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.applicants} applicants</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="eye" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.views} views</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="checkmark-circle" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.hired} hired</Text>
        </View>
        
        <Text style={styles.postedTime}>{item.posted}</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.jobActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleJobAction('viewCandidates', item)}
        >
          <Icon name="people" size={16} color="#2563eb" />
          <Text style={styles.actionButtonText}>View Candidates</Text>
        </TouchableOpacity>
        
        {item.status === 'active' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => handleJobAction('pause', item)}
          >
            <Icon name="pause" size={16} color="#f59e0b" />
            <Text style={[styles.actionButtonText, { color: '#f59e0b' }]}>Pause</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'paused' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.successAction]}
            onPress={() => handleJobAction('activate', item)}
          >
            <Icon name="play" size={16} color="#16a34a" />
            <Text style={[styles.actionButtonText, { color: '#16a34a' }]}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const filterOptions = [
    { key: 'all', label: 'All Jobs', count: jobs.length },
    { key: 'active', label: 'Active', count: jobs.filter(j => j.status === 'active').length },
    { key: 'paused', label: 'Paused', count: jobs.filter(j => j.status === 'paused').length },
    { key: 'completed', label: 'Completed', count: jobs.filter(j => j.status === 'completed').length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/(employer)/post-job')}>
          <Icon name="add" size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterTab,
              selectedFilter === option.key && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(option.key)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === option.key && styles.activeFilterTabText
            ]}>
              {option.label}
            </Text>
            <View style={[
              styles.filterCount,
              selectedFilter === option.key && styles.activeFilterCount
            ]}>
              <Text style={[
                styles.filterCountText,
                selectedFilter === option.key && styles.activeFilterCountText
              ]}>
                {option.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        style={styles.jobsList}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="briefcase" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No jobs found</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all' 
                ? 'Start by posting your first job to find workers in your area.'
                : `No ${selectedFilter} jobs at the moment.`
              }
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity 
                style={styles.postJobButton}
                onPress={() => router.push('/(employer)/post-job')}
              >
                <Text style={styles.postJobButtonText}>Post Your First Job</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Job Actions</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            {selectedJob && (
              <View style={styles.modalBody}>
                <Text style={styles.modalJobTitle}>{selectedJob.title}</Text>
                
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => handleJobAction('edit', selectedJob)}
                >
                  <Icon name="edit" size={20} color="#2563eb" />
                  <Text style={styles.modalActionText}>Edit Job</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalAction}
                  onPress={() => handleJobAction('promote', selectedJob)}
                >
                  <Icon name="trending-up" size={20} color="#8b5cf6" />
                  <Text style={styles.modalActionText}>Promote Job</Text>
                </TouchableOpacity>
                
                {selectedJob.status === 'active' && (
                  <TouchableOpacity
                    style={styles.modalAction}
                    onPress={() => handleJobAction('complete', selectedJob)}
                  >
                    <Icon name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.modalActionText}>Mark as Complete</Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.modalAction, styles.deleteAction]}
                  onPress={() => handleJobAction('delete', selectedJob)}
                >
                  <Icon name="trash" size={20} color="#ef4444" />
                  <Text style={[styles.modalActionText, { color: '#ef4444' }]}>Delete Job</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activeFilterTab: {
    backgroundColor: '#2563eb',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 8,
  },
  activeFilterTabText: {
    color: 'white',
  },
  filterCount: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  activeFilterCountText: {
    color: 'white',
  },
  jobsList: {
    flex: 1,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
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
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  jobCategory: {
    fontSize: 14,
    color: '#6b7280',
  },
  moreButton: {
    padding: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobBudget: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
  },
  postedTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 'auto',
  },
  jobActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  secondaryAction: {
    backgroundColor: '#fffbeb',
  },
  successAction: {
    backgroundColor: '#f0fdf4',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563eb',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  postJobButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  postJobButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalBody: {
    paddingHorizontal: 20,
  },
  modalJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginBottom: 8,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: 8,
  },
  modalActionText: {
    fontSize: 16,
    color: '#374151',
  },
});