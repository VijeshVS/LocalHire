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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMyJobs, deleteJob as deleteJobApi } from '../../services/jobService';
import { getJobApplications } from '../../services/employerApplicationService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

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
  const [selectedTab, setSelectedTab] = useState<TabType>('all');
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);

  useEffect(() => {
    fetchJobsWithApplications();
  }, []);

  const fetchJobsWithApplications = async () => {
    try {
      const apiJobs = await getMyJobs();
      
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
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return '1d ago';
    return `${diffDays}d ago`;
  };

  const formatScheduleDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const formattedDate = date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
    return timeStr ? `${formattedDate}, ${timeStr}` : formattedDate;
  };

  const getWorkStatusConfig = (workStatus: string) => {
    switch (workStatus) {
      case 'in_progress':
        return { 
          color: COLORS.worker.primary, 
          bg: COLORS.worker.bg, 
          text: 'In Progress',
          icon: 'flash' as const
        };
      case 'pending_review':
        return { 
          color: COLORS.status.warning, 
          bg: '#fef3c7', 
          text: 'Pending',
          icon: 'time' as const
        };
      case 'completed':
        return { 
          color: COLORS.system.primary, 
          bg: COLORS.system.bg, 
          text: 'Completed',
          icon: 'checkmark-circle' as const
        };
      case 'open':
      default:
        return { 
          color: COLORS.employer.primary, 
          bg: COLORS.employer.bg, 
          text: 'Open',
          icon: 'radio-button-on' as const
        };
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
          { text: 'Pause', onPress: () => updateJobStatus(job.id, 'paused') }
        ]);
        break;
      case 'activate':
        updateJobStatus(job.id, 'active');
        break;
      case 'complete':
        Alert.alert('Mark Complete', `Mark "${job.title}" as completed?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Complete', onPress: () => updateJobStatus(job.id, 'completed') }
        ]);
        break;
      case 'delete':
        Alert.alert('Delete Job', `Delete "${job.title}"? This cannot be undone.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => deleteJob(job.id) }
        ]);
        break;
      case 'viewCandidates':
        router.push(`/(employer)/candidates?jobId=${job.id}`);
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
      setJobs(prev => prev.filter(job => job.id !== jobId));
      console.log('Error deleting job:', error);
    }
  };

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

  const tabCounts = {
    pending: jobs.filter(job => job.work_status === 'pending_review' || (job.pendingApplications > 0 && job.work_status !== 'completed')).length,
    inprogress: jobs.filter(job => job.work_status === 'in_progress').length,
    completed: jobs.filter(job => job.work_status === 'completed').length,
    all: jobs.length,
  };

  const tabs = [
    { key: 'all' as TabType, label: 'All', count: tabCounts.all },
    { key: 'pending' as TabType, label: 'Pending', count: tabCounts.pending },
    { key: 'inprogress' as TabType, label: 'Active', count: tabCounts.inprogress },
    { key: 'completed' as TabType, label: 'Done', count: tabCounts.completed },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Ionicons name="briefcase" size={32} color={COLORS.employer.primary} />
          </View>
          <ActivityIndicator size="large" color={COLORS.employer.primary} style={{ marginTop: SPACING.lg }} />
          <Text style={styles.loadingText}>Loading your jobs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderJobCard = ({ item }: { item: EnhancedJob }) => {
    const statusConfig = getWorkStatusConfig(item.work_status);
    const scheduleText = formatScheduleDate(item.scheduled_date, item.scheduled_time);
    
    return (
      <TouchableOpacity 
        style={styles.jobCard}
        onPress={() => handleJobAction('viewCandidates', item)}
        activeOpacity={0.7}
      >
        {/* Status Indicator Bar */}
        <View style={[styles.statusBar, { backgroundColor: statusConfig.color }]} />
        
        <View style={styles.cardContent}>
          {/* Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.jobMeta}>{item.category}</Text>
            </View>
            <View style={styles.budgetBadge}>
              <Text style={styles.budgetText}>{item.budget}</Text>
            </View>
          </View>

          {/* Location */}
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray[400]} />
            <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
          </View>

          {/* Schedule (if set) */}
          {scheduleText && (
            <View style={styles.scheduleRow}>
              <Ionicons name="calendar" size={14} color={COLORS.employer.primary} />
              <Text style={styles.scheduleText}>{scheduleText}</Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people" size={14} color={COLORS.gray[500]} />
              <Text style={styles.statText}>{item.applicants}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-done" size={14} color={COLORS.worker.primary} />
              <Text style={[styles.statText, { color: COLORS.worker.primary }]}>{item.hired} hired</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>{statusConfig.text}</Text>
            </View>
            <Text style={styles.timeText}>{item.posted}</Text>
          </View>

          {/* Hired Workers Preview */}
          {item.hiredWorkers.length > 0 && (
            <View style={styles.hiredPreview}>
              <View style={styles.avatarRow}>
                {item.hiredWorkers.slice(0, 3).map((worker: any, idx: number) => (
                  <View key={idx} style={[styles.avatar, { marginLeft: idx > 0 ? -10 : 0, zIndex: 3 - idx }]}>
                    <Text style={styles.avatarText}>
                      {(worker.employees?.name || 'W').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                ))}
                {item.hiredWorkers.length > 3 && (
                  <View style={[styles.avatar, styles.avatarMore, { marginLeft: -10 }]}>
                    <Text style={styles.avatarMoreText}>+{item.hiredWorkers.length - 3}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.hiredLabel}>
                {item.hiredWorkers.length} worker{item.hiredWorkers.length > 1 ? 's' : ''} assigned
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {item.pendingApplications > 0 && (
              <TouchableOpacity 
                style={styles.reviewBtn}
                onPress={() => handleJobAction('viewCandidates', item)}
              >
                <Ionicons name="eye" size={14} color={COLORS.white} />
                <Text style={styles.reviewBtnText}>Review {item.pendingApplications}</Text>
              </TouchableOpacity>
            )}
            
            <View style={styles.iconBtns}>
              {item.status === 'active' && item.work_status !== 'completed' && (
                <TouchableOpacity 
                  style={[styles.iconBtn, styles.pauseBtn]}
                  onPress={() => handleJobAction('pause', item)}
                >
                  <Ionicons name="pause" size={14} color={COLORS.status.warning} />
                </TouchableOpacity>
              )}
              
              {item.status === 'paused' && (
                <TouchableOpacity 
                  style={[styles.iconBtn, styles.playBtn]}
                  onPress={() => handleJobAction('activate', item)}
                >
                  <Ionicons name="play" size={14} color={COLORS.worker.primary} />
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.iconBtn}
                onPress={() => {
                  setSelectedJob(item);
                  setShowActionModal(true);
                }}
              >
                <Ionicons name="ellipsis-horizontal" size={16} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Jobs</Text>
          <Text style={styles.headerSubtitle}>{jobs.length} total jobs</Text>
        </View>
        <TouchableOpacity 
          style={styles.postBtn} 
          onPress={() => router.push('/(employer)/post-job')}
        >
          <Ionicons name="add" size={18} color={COLORS.white} />
          <Text style={styles.postBtnText}>New Job</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tab.count > 0 && (
                <View style={[styles.tabBadge, selectedTab === tab.key && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, selectedTab === tab.key && styles.tabBadgeTextActive]}>
                    {tab.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Jobs List */}
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="briefcase-outline" size={48} color={COLORS.gray[300]} />
            </View>
            <Text style={styles.emptyTitle}>
              {selectedTab === 'pending' ? 'No pending reviews' :
               selectedTab === 'inprogress' ? 'No active jobs' :
               selectedTab === 'completed' ? 'No completed jobs' :
               'No jobs yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {selectedTab === 'all' 
                ? 'Post your first job to find workers' 
                : 'Jobs will appear here when available'}
            </Text>
            {selectedTab === 'all' && (
              <TouchableOpacity 
                style={styles.emptyBtn}
                onPress={() => router.push('/(employer)/post-job')}
              >
                <Ionicons name="add-circle" size={18} color={COLORS.white} />
                <Text style={styles.emptyBtnText}>Post Your First Job</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
      />

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowActionModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            
            {selectedJob && (
              <>
                <Text style={styles.modalTitle} numberOfLines={1}>{selectedJob.title}</Text>
                <Text style={styles.modalSubtitle}>{selectedJob.category} • {selectedJob.location}</Text>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.modalAction} 
                    onPress={() => handleJobAction('viewCandidates', selectedJob)}
                  >
                    <View style={[styles.modalActionIcon, { backgroundColor: COLORS.employer.bg }]}>
                      <Ionicons name="people" size={20} color={COLORS.employer.primary} />
                    </View>
                    <View style={styles.modalActionContent}>
                      <Text style={styles.modalActionText}>View Candidates</Text>
                      <Text style={styles.modalActionHint}>{selectedJob.applicants} applicants</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.modalAction} 
                    onPress={() => handleJobAction('edit', selectedJob)}
                  >
                    <View style={[styles.modalActionIcon, { backgroundColor: '#dbeafe' }]}>
                      <Ionicons name="create" size={20} color="#2563eb" />
                    </View>
                    <View style={styles.modalActionContent}>
                      <Text style={styles.modalActionText}>Edit Job</Text>
                      <Text style={styles.modalActionHint}>Update details</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
                  </TouchableOpacity>
                  
                  {selectedJob.status === 'active' && (
                    <TouchableOpacity 
                      style={styles.modalAction} 
                      onPress={() => handleJobAction('pause', selectedJob)}
                    >
                      <View style={[styles.modalActionIcon, { backgroundColor: '#fef3c7' }]}>
                        <Ionicons name="pause" size={20} color={COLORS.status.warning} />
                      </View>
                      <View style={styles.modalActionContent}>
                        <Text style={styles.modalActionText}>Pause Job</Text>
                        <Text style={styles.modalActionHint}>Stop receiving applications</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                  )}
                  
                  {selectedJob.status === 'paused' && (
                    <TouchableOpacity 
                      style={styles.modalAction} 
                      onPress={() => handleJobAction('activate', selectedJob)}
                    >
                      <View style={[styles.modalActionIcon, { backgroundColor: COLORS.worker.bg }]}>
                        <Ionicons name="play" size={20} color={COLORS.worker.primary} />
                      </View>
                      <View style={styles.modalActionContent}>
                        <Text style={styles.modalActionText}>Activate Job</Text>
                        <Text style={styles.modalActionHint}>Resume receiving applications</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.modalAction, styles.modalActionDanger]} 
                    onPress={() => handleJobAction('delete', selectedJob)}
                  >
                    <View style={[styles.modalActionIcon, { backgroundColor: '#fee2e2' }]}>
                      <Ionicons name="trash" size={20} color={COLORS.status.error} />
                    </View>
                    <View style={styles.modalActionContent}>
                      <Text style={[styles.modalActionText, { color: COLORS.status.error }]}>Delete Job</Text>
                      <Text style={styles.modalActionHint}>This cannot be undone</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.gray[400]} />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.employer.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerLeft: {
    flex: 1,
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
  postBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.employer.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  postBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },

  // Tabs
  tabsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  tabsContent: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    marginRight: SPACING.sm,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.employer.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[600],
  },
  tabTextActive: {
    color: COLORS.white,
  },
  tabBadge: {
    backgroundColor: COLORS.gray[300],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[700],
  },
  tabBadgeTextActive: {
    color: COLORS.white,
  },

  // List
  list: {
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },

  // Job Card
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  statusBar: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  titleSection: {
    flex: 1,
    marginRight: SPACING.md,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  jobMeta: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
  },
  budgetBadge: {
    backgroundColor: COLORS.employer.bg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  budgetText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.employer.primary,
  },
  
  // Location
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: SPACING.sm,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
    flex: 1,
  },

  // Schedule
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.employer.bg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
    alignSelf: 'flex-start',
    gap: 6,
  },
  scheduleText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.employer.primary,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
    gap: SPACING.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.gray[200],
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  timeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[400],
    marginLeft: 'auto',
  },

  // Hired Preview
  hiredPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  avatarRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.employer.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  avatarMore: {
    backgroundColor: COLORS.gray[400],
  },
  avatarMoreText: {
    fontSize: 9,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  hiredLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
  },

  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[100],
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.employer.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  reviewBtnText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  iconBtns: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginLeft: 'auto',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseBtn: {
    backgroundColor: '#fef3c7',
  },
  playBtn: {
    backgroundColor: COLORS.worker.bg,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.employer.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  emptyBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl + 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray[300],
    alignSelf: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.lg,
  },
  modalActions: {
    gap: SPACING.xs,
  },
  modalAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray[50],
  },
  modalActionDanger: {
    marginTop: SPACING.sm,
  },
  modalActionIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  modalActionContent: {
    flex: 1,
  },
  modalActionText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[900],
  },
  modalActionHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  cancelBtn: {
    backgroundColor: COLORS.gray[100],
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
  },
});