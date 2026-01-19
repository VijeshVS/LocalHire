import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../../components/Icon';
import { getMyJobs, deleteJob as deleteJobApi } from '../../services/jobService';
import { getJobApplications } from '../../services/employerApplicationService';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

type TabType = 'pending' | 'inprogress' | 'completed' | 'all';

interface EnhancedJob {
  id: string;
  title: string;
  category: string;
  status: string;
  applicants: number;
  budget: string;
  posted: string;
  urgency: string;
  location: string;
  description: string;
  views: number;
  hired: number;
  applications: any[];
  hiredWorkers: any[];
  pendingApplications: number;
  acceptedApplications: number;
  work_status: string;
  scheduled_date?: string;
  scheduled_time?: string;
  scheduled_end_time?: string;
  is_active: boolean;
  wage: number;
}

export default function JobManagement() {
  const [jobs, setJobs] = useState<EnhancedJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('pending');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    fetchJobsWithApplications();
  }, []);

  const fetchJobsWithApplications = async () => {
    try {
      const apiJobs = await getMyJobs();
      
      // Fetch applications for each job in parallel
      const jobsWithApplications = await Promise.all(
        apiJobs.map(async (job: any) => {
          let applications: any[] = [];
          try {
            applications = await getJobApplications(job.id);
          } catch (err) {
            console.log(`Failed to fetch applications for job ${job.id}`);
          }
          
          const hiredWorkers = applications.filter((app: any) => 
            app.status === 'accepted' && (app.work_status === 'in_progress' || app.work_status === 'pending')
          );
          const pendingApplications = applications.filter((app: any) => 
            app.status === 'applied' || app.status === 'shortlisted'
          );
          const completedWorkers = applications.filter((app: any) => 
            app.work_status === 'completed'
          );
          
          // Determine job work status
          let workStatus = 'open';
          if (completedWorkers.length > 0) {
            workStatus = 'completed';
          } else if (hiredWorkers.length > 0) {
            workStatus = 'in_progress';
          } else if (pendingApplications.length > 0) {
            workStatus = 'pending_review';
          }
          
          return {
            id: job.id,
            title: job.title,
            category: job.category || 'General',
            status: job.is_active ? 'active' : 'paused',
            applicants: applications.length,
            budget: `₹${job.wage}/day`,
            posted: formatPostedTime(job.created_at),
            urgency: getUrgencyFromDate(job.scheduled_date),
            location: job.address || 'Not specified',
            description: job.description || '',
            views: 0,
            hired: hiredWorkers.length,
            applications,
            hiredWorkers,
            pendingApplications: pendingApplications.length,
            acceptedApplications: hiredWorkers.length,
            work_status: workStatus,
            scheduled_date: job.scheduled_date,
            scheduled_time: job.scheduled_time,
            scheduled_end_time: job.scheduled_end_time,
            is_active: job.is_active,
            wage: job.wage,
          };
        })
      );
      
      setJobs(jobsWithApplications);
      
      // Auto-select appropriate tab based on data
      const hasPending = jobsWithApplications.some(j => j.work_status === 'pending_review');
      const hasInProgress = jobsWithApplications.some(j => j.work_status === 'in_progress');
      
      if (hasPending) {
        setSelectedTab('pending');
      } else if (hasInProgress) {
        setSelectedTab('inprogress');
      }
    } catch (error) {
      console.log('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobsWithApplications();
    setIsRefreshing(false);
  };

  const getUrgencyFromDate = (scheduledDate?: string) => {
    if (!scheduledDate) return 'Flexible';
    
    const date = new Date(scheduledDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date <= today) return 'Immediate';
    if (date <= tomorrow) return 'Tomorrow';
    return date.toLocaleDateString();
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

  const formatScheduleDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
    return timeStr ? `${formattedDate} at ${timeStr}` : formattedDate;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.status.success;
      case 'paused': return COLORS.status.warning;
      case 'completed': return COLORS.system.primary;
      case 'expired': return COLORS.status.error;
      default: return COLORS.gray[500];
    }
  };

  const getWorkStatusColor = (workStatus: string) => {
    switch (workStatus) {
      case 'in_progress': return COLORS.status.success;
      case 'pending_review': return COLORS.status.warning;
      case 'completed': return COLORS.system.primary;
      case 'open': return COLORS.gray[500];
      default: return COLORS.gray[500];
    }
  };

  const getWorkStatusText = (workStatus: string) => {
    switch (workStatus) {
      case 'in_progress': return 'In Progress';
      case 'pending_review': return 'Pending Review';
      case 'completed': return 'Completed';
      case 'open': return 'Open';
      default: return 'Unknown';
    }
  };

  const handleJobAction = (action: string, job: EnhancedJob) => {
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

  const deleteJob = async (jobId: string) => {
    try {
      await deleteJobApi(jobId);
      setJobs(prev => prev.filter(job => job.id !== jobId));
      Alert.alert('Success', 'Job deleted successfully');
    } catch (error: any) {
      // Still delete locally if API fails (for demo purposes)
      setJobs(prev => prev.filter(job => job.id !== jobId));
      console.log('Error deleting job:', error);
    }
  };

  // Get filtered jobs based on selected tab
  const getFilteredJobs = () => {
    switch (selectedTab) {
      case 'pending':
        return jobs.filter(job => job.work_status === 'pending_review' || (job.pendingApplications > 0 && job.work_status !== 'completed'));
      case 'inprogress':
        return jobs.filter(job => job.work_status === 'in_progress');
      case 'completed':
        return jobs.filter(job => job.work_status === 'completed');
      case 'all':
      default:
        return jobs;
    }
  };

  const filteredJobs = getFilteredJobs();

  // Tab counts
  const tabCounts = {
    pending: jobs.filter(job => job.work_status === 'pending_review' || (job.pendingApplications > 0 && job.work_status !== 'completed')).length,
    inprogress: jobs.filter(job => job.work_status === 'in_progress').length,
    completed: jobs.filter(job => job.work_status === 'completed').length,
    all: jobs.length,
  };

  const tabs = [
    { key: 'pending' as TabType, label: 'Pending Review', icon: 'time', count: tabCounts.pending },
    { key: 'inprogress' as TabType, label: 'In Progress', icon: 'play-circle', count: tabCounts.inprogress },
    { key: 'completed' as TabType, label: 'Completed', icon: 'checkmark-circle', count: tabCounts.completed },
    { key: 'all' as TabType, label: 'All Jobs', icon: 'briefcase', count: tabCounts.all },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.employer.primary} />
        <Text style={styles.loadingText}>Loading your jobs...</Text>
      </SafeAreaView>
    );
  }

  const renderJobCard = ({ item }: { item: EnhancedJob }) => (
    <View style={[
      styles.jobCard,
      item.work_status === 'in_progress' && styles.inProgressCard,
      item.work_status === 'completed' && styles.completedCard,
    ]}>
      {/* Work Status Banner */}
      {item.work_status === 'in_progress' && (
        <View style={styles.workStatusBanner}>
          <Icon name="play-circle" size={14} color={COLORS.status.success} />
          <Text style={styles.workStatusBannerText}>
            Worker currently hired • {item.hired} active
          </Text>
        </View>
      )}
      
      {item.work_status === 'pending_review' && item.pendingApplications > 0 && (
        <View style={[styles.workStatusBanner, styles.pendingBanner]}>
          <Icon name="notifications" size={14} color={COLORS.status.warning} />
          <Text style={[styles.workStatusBannerText, { color: COLORS.status.warning }]}>
            {item.pendingApplications} applicant{item.pendingApplications > 1 ? 's' : ''} waiting for review
          </Text>
        </View>
      )}

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
          <Icon name="ellipsis-vertical" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Schedule Info */}
      {item.scheduled_date && (
        <View style={styles.scheduleInfo}>
          <Icon name="calendar" size={14} color={COLORS.employer.primary} />
          <Text style={styles.scheduleText}>
            {formatScheduleDate(item.scheduled_date, item.scheduled_time)}
            {item.scheduled_end_time && ` - ${item.scheduled_end_time}`}
          </Text>
        </View>
      )}

      {/* Job Status & Budget */}
      <View style={styles.jobMeta}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status === 'active' ? 'Active' : item.status === 'paused' ? 'Paused' : item.status}
          </Text>
        </View>
        
        <View style={[styles.workStatusBadge, { backgroundColor: getWorkStatusColor(item.work_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getWorkStatusColor(item.work_status) }]}>
            {getWorkStatusText(item.work_status)}
          </Text>
        </View>
        
        <Text style={styles.jobBudget}>{item.budget}</Text>
      </View>

      {/* Job Stats */}
      <View style={styles.jobStats}>
        <View style={styles.statItem}>
          <Icon name="people" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.applicants} applicants</Text>
        </View>
        
        <View style={styles.statItem}>
          <Icon name="checkmark-circle" size={16} color={COLORS.status.success} />
          <Text style={styles.statText}>{item.hired} hired</Text>
        </View>
        
        <Text style={styles.postedTime}>{item.posted}</Text>
      </View>

      {/* Hired Workers Preview */}
      {item.hiredWorkers.length > 0 && (
        <View style={styles.hiredWorkersSection}>
          <Text style={styles.hiredWorkersTitle}>Hired Workers:</Text>
          {item.hiredWorkers.slice(0, 2).map((worker: any, index: number) => (
            <View key={index} style={styles.hiredWorkerRow}>
              <View style={styles.workerAvatar}>
                <Text style={styles.workerAvatarText}>
                  {(worker.employees?.name || 'W').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.hiredWorkerName}>{worker.employees?.name || 'Worker'}</Text>
              <View style={[styles.workerStatusBadge, { 
                backgroundColor: worker.work_status === 'completed' ? COLORS.system.primary + '20' : COLORS.status.success + '20' 
              }]}>
                <Text style={[styles.workerStatusText, { 
                  color: worker.work_status === 'completed' ? COLORS.system.primary : COLORS.status.success 
                }]}>
                  {worker.work_status === 'completed' ? 'Completed' : 'Working'}
                </Text>
              </View>
            </View>
          ))}
          {item.hiredWorkers.length > 2 && (
            <Text style={styles.moreWorkersText}>+{item.hiredWorkers.length - 2} more</Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.jobActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleJobAction('viewCandidates', item)}
        >
          <Icon name="people" size={16} color={COLORS.employer.primary} />
          <Text style={styles.actionButtonText}>
            {item.pendingApplications > 0 ? `Review (${item.pendingApplications})` : 'Candidates'}
          </Text>
        </TouchableOpacity>
        
        {item.status === 'active' && item.work_status !== 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => handleJobAction('pause', item)}
          >
            <Icon name="pause" size={16} color={COLORS.status.warning} />
            <Text style={[styles.actionButtonText, { color: COLORS.status.warning }]}>Pause</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'paused' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.successAction]}
            onPress={() => handleJobAction('activate', item)}
          >
            <Icon name="play" size={16} color={COLORS.status.success} />
            <Text style={[styles.actionButtonText, { color: COLORS.status.success }]}>Activate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Jobs</Text>
        <TouchableOpacity onPress={() => router.push('/(employer)/post-job')}>
          <Icon name="add" size={24} color={COLORS.employer.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Icon 
              name={tab.icon as any} 
              size={18} 
              color={selectedTab === tab.key ? COLORS.white : COLORS.gray[500]} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[
                styles.tabBadge,
                selectedTab === tab.key && styles.activeTabBadge
              ]}>
                <Text style={[
                  styles.tabBadgeText,
                  selectedTab === tab.key && styles.activeTabBadgeText
                ]}>
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tab Description */}
      <View style={styles.tabDescription}>
        {selectedTab === 'pending' && (
          <Text style={styles.tabDescriptionText}>
            Jobs with applicants waiting for your review
          </Text>
        )}
        {selectedTab === 'inprogress' && (
          <Text style={styles.tabDescriptionText}>
            Jobs where workers are currently hired and working
          </Text>
        )}
        {selectedTab === 'completed' && (
          <Text style={styles.tabDescriptionText}>
            Jobs that have been completed
          </Text>
        )}
        {selectedTab === 'all' && (
          <Text style={styles.tabDescriptionText}>
            All your job postings
          </Text>
        )}
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        style={styles.jobsList}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.employer.primary]}
            tintColor={COLORS.employer.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name={tabs.find(t => t.key === selectedTab)?.icon as any || 'briefcase'} size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>
              {selectedTab === 'pending' && 'No pending applications'}
              {selectedTab === 'inprogress' && 'No jobs in progress'}
              {selectedTab === 'completed' && 'No completed jobs'}
              {selectedTab === 'all' && 'No jobs found'}
            </Text>
            <Text style={styles.emptyStateText}>
              {selectedTab === 'pending' && 'When candidates apply to your jobs, they will appear here for review.'}
              {selectedTab === 'inprogress' && 'Once you hire a worker, their job will appear here.'}
              {selectedTab === 'completed' && 'Completed jobs will be shown here.'}
              {selectedTab === 'all' && 'Start by posting your first job to find workers in your area.'}
            </Text>
            {selectedTab === 'all' && (
              <TouchableOpacity 
                style={styles.postJobButton}
                onPress={() => router.push('/(employer)/post-job')}
              >
                <Text style={styles.postJobButtonText}>Post a Job</Text>
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
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.gray[500],
  },
  // Tab Navigation
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.employer.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.gray[500],
  },
  activeTabText: {
    color: COLORS.white,
  },
  tabBadge: {
    backgroundColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  activeTabBadgeText: {
    color: 'white',
  },
  tabDescription: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabDescriptionText: {
    fontSize: 13,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  // Jobs List
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
  inProgressCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.status.success,
  },
  completedCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.system.primary,
    opacity: 0.85,
  },
  // Work Status Banner
  workStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.status.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 12,
    gap: 6,
  },
  pendingBanner: {
    backgroundColor: COLORS.status.warning + '15',
  },
  workStatusBannerText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.status.success,
  },
  // Job Header
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
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
    fontSize: 13,
    color: '#6b7280',
  },
  moreButton: {
    padding: 4,
  },
  // Schedule Info
  scheduleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.employer.bg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 10,
    gap: 6,
  },
  scheduleText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.employer.primary,
  },
  // Job Meta
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobBudget: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.status.success,
    marginLeft: 'auto',
  },
  // Job Stats
  jobStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  // Hired Workers Section
  hiredWorkersSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  hiredWorkersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  hiredWorkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  workerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.employer.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerAvatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  hiredWorkerName: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  workerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  workerStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  moreWorkersText: {
    fontSize: 12,
    color: COLORS.gray[500],
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Job Actions
  jobActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.employer.bg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  secondaryAction: {
    backgroundColor: COLORS.status.warning + '20',
  },
  successAction: {
    backgroundColor: COLORS.status.success + '20',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.employer.primary,
  },
  // Empty State
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
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  postJobButton: {
    backgroundColor: COLORS.employer.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  postJobButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal
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