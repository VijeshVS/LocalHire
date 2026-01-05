import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyJobs } from '../../services/jobService';
import { getJobApplications, updateApplicationStatus } from '../../services/employerApplicationService';

const filterOptions = [
  { id: 'all', label: 'All Applications', count: 0 },
  { id: 'applied', label: 'Applied', count: 0 },
  { id: 'shortlisted', label: 'Shortlisted', count: 0 },
  { id: 'accepted', label: 'Accepted', count: 0 },
  { id: 'rejected', label: 'Rejected', count: 0 },
];

export default function Candidates() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      // Get all employer's jobs first
      const jobs = await getMyJobs();
      
      // Fetch applications for each job
      const allApplications: any[] = [];
      for (const job of jobs) {
        try {
          const applications = await getJobApplications(job.id);
          applications.forEach((app: any) => {
            // Backend returns 'employees' not 'employee', and uses 'name' not 'first_name/last_name'
            const employeeData = app.employees || app.employee;
            const employeeName = employeeData?.name || 'Unknown';
            
            allApplications.push({
              id: app.id,
              name: employeeName,
              email: employeeData?.email || '',
              phone: employeeData?.phone || '',
              rating: employeeData?.rating || 4.5,
              experience: employeeData?.years_of_experience ? `${employeeData.years_of_experience} years` : 'N/A',
              location: 'N/A',
              skills: employeeData?.skills || [],
              appliedFor: job.title,
              appliedAt: new Date(app.applied_at).toLocaleDateString(),
              profileImage: employeeName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
              verified: false,
              completedJobs: 0,
              responseTime: 'N/A',
              hourlyRate: 'N/A',
              availability: 'N/A',
              lastSeen: 'N/A',
              status: app.status || 'applied',
              applicationId: app.id,
              reviews: [],
              language: employeeData?.language || 'N/A',
            });
          });
        } catch (err) {
          // Continue even if fetching applications for one job fails
          console.log(`Failed to fetch applications for job ${job.id}`);
        }
      }
      
      if (allApplications.length > 0) {
        setCandidates(allApplications);
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setCandidates([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredCandidates = () => {
    if (selectedFilter === 'all') return candidates;
    return candidates.filter(c => c.status === selectedFilter);
  };

  const handleCandidateAction = async (action: string, candidate: any) => {
    switch (action) {
      case 'shortlist':
        Alert.alert('Success', `${candidate.name} has been shortlisted!`);
        break;
      case 'interview':
        Alert.alert('Interview', `Schedule interview with ${candidate.name}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Schedule', onPress: () => console.log('Interview scheduled') }
        ]);
        break;
      case 'hire':
        Alert.alert('Hire', `Hire ${candidate.name} for this job?`, [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Hire', 
            onPress: async () => {
              try {
                if (candidate.applicationId) {
                  await updateApplicationStatus(candidate.applicationId, 'accepted');
                  fetchCandidates(); // Refresh the list
                  Alert.alert('Success', `${candidate.name} has been hired!`);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to update status');
              }
            }
          }
        ]);
        break;
      case 'reject':
        Alert.alert('Reject', `Reject ${candidate.name}'s application?`, [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Reject', 
            style: 'destructive',
            onPress: async () => {
              try {
                if (candidate.applicationId) {
                  await updateApplicationStatus(candidate.applicationId, 'rejected');
                  fetchCandidates(); // Refresh the list
                  Alert.alert('Done', `Application rejected`);
                }
              } catch (error) {
                Alert.alert('Error', 'Failed to update status');
              }
            }
          }
        ]);
        break;
      case 'message':
        Alert.alert('Message', `Send message to ${candidate.name}?`);
        break;
      case 'call':
        Alert.alert('Call', `Calling ${candidate.name}...`);
        break;
      default:
        break;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Ionicons key={i} name="star" size={14} color="#fbbf24" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<Ionicons key={i} name="star-half" size={14} color="#fbbf24" />);
      } else {
        stars.push(<Ionicons key={i} name="star-outline" size={14} color="#d1d5db" />);
      }
    }
    return stars;
  };

  const getStatusColor = (lastSeen: string) => {
    if (lastSeen === 'Online') return '#16a34a';
    if (lastSeen.includes('min')) return '#f59e0b';
    return '#6b7280';
  };

  const renderCandidateCard = ({ item }: { item: typeof candidates[0] }) => (
    <View style={styles.candidateCard}>
      {/* Header */}
      <View style={styles.candidateHeader}>
        <TouchableOpacity
          style={styles.candidateInfo}
          onPress={() => {
            setSelectedCandidate(item);
            setShowCandidateModal(true);
          }}
        >
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.profileImage}</Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.lastSeen) }]} />
            {item.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={12} color="white" />
              </View>
            )}
          </View>
          <View style={styles.candidateDetails}>
            <Text style={styles.candidateName}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStars(item.rating)}
              </View>
              <Text style={styles.ratingText}>{item.rating} ({item.completedJobs} jobs)</Text>
            </View>
            <Text style={styles.experience}>{item.experience} • {item.location}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Applied Job */}
      <View style={styles.appliedJobContainer}>
        <Text style={styles.appliedJobLabel}>Applied for:</Text>
        <Text style={styles.appliedJobTitle}>{item.appliedFor}</Text>
        <Text style={styles.appliedTime}>{item.appliedAt}</Text>
      </View>

      {/* Skills */}
      <View style={styles.skillsContainer}>
        {item.skills.slice(0, 3).map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
        {item.skills.length > 3 && (
          <Text style={styles.moreSkills}>+{item.skills.length - 3} more</Text>
        )}
      </View>

      {/* Quick Info */}
      <View style={styles.quickInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <Text style={styles.infoText}>{item.responseTime}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="wallet-outline" size={16} color="#6b7280" />
          <Text style={styles.infoText}>{item.hourlyRate}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.infoText}>{item.availability}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.candidateActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => Alert.alert('Rejected', `${item.name} application rejected`)}
        >
          <Ionicons name="close" size={18} color="#dc2626" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.messageButton]}
          onPress={() => handleCandidateAction('message', item)}
        >
          <Ionicons name="chatbubble-outline" size={18} color="#2563eb" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.callButton]}
          onPress={() => handleCandidateAction('call', item)}
        >
          <Ionicons name="call-outline" size={18} color="#16a34a" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.hireButton}
          onPress={() => handleCandidateAction('hire', item)}
        >
          <Text style={styles.hireButtonText}>Hire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Candidates</Text>
        <TouchableOpacity>
          <Ionicons name="filter-outline" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterTabs}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterTab,
                  selectedFilter === option.id && styles.activeFilterTab
                ]}
                onPress={() => setSelectedFilter(option.id)}
              >
                <Text style={[
                  styles.filterTabText,
                  selectedFilter === option.id && styles.activeFilterTabText
                ]}>
                  {option.label}
                </Text>
                <View style={[
                  styles.filterCount,
                  selectedFilter === option.id && styles.activeFilterCount
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    selectedFilter === option.id && styles.activeFilterCountText
                  ]}>
                    {option.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading candidates...</Text>
        </View>
      ) : (
        /* Candidates List */
        <FlatList
          data={getFilteredCandidates()}
          renderItem={renderCandidateCard}
          keyExtractor={(item) => item.id}
          style={styles.candidatesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyText}>No candidates found</Text>
            </View>
          }
        />
      )}

      {/* Candidate Detail Modal */}
      <Modal
        visible={showCandidateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCandidateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCandidate && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{selectedCandidate.name}</Text>
                  <TouchableOpacity onPress={() => setShowCandidateModal(false)}>
                    <Ionicons name="close" size={24} color="#374151" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  {/* Profile Summary */}
                  <View style={styles.profileSummary}>
                    <View style={styles.modalAvatar}>
                      <Text style={styles.modalAvatarText}>{selectedCandidate.profileImage}</Text>
                    </View>
                    <View style={styles.summaryInfo}>
                      <Text style={styles.summaryName}>{selectedCandidate.name}</Text>
                      <View style={styles.summaryRating}>
                        {renderStars(selectedCandidate.rating)}
                        <Text style={styles.summaryRatingText}>{selectedCandidate.rating}</Text>
                      </View>
                      <Text style={styles.summaryLocation}>{selectedCandidate.location}</Text>
                    </View>
                  </View>

                  {/* Skills */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Skills</Text>
                    <View style={styles.modalSkills}>
                      {selectedCandidate.skills.map((skill, index) => (
                        <View key={index} style={styles.modalSkillTag}>
                          <Text style={styles.modalSkillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Reviews */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Recent Reviews</Text>
                    {selectedCandidate.reviews.map((review, index) => (
                      <View key={index} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewStars}>
                            {renderStars(review.rating)}
                          </View>
                          <Text style={styles.reviewEmployer}>- {review.employer}</Text>
                        </View>
                        <Text style={styles.reviewComment}>"{review.comment}"</Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>

                {/* Modal Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => handleCandidateAction('message', selectedCandidate)}
                  >
                    <Ionicons name="chatbubble" size={20} color="#2563eb" />
                    <Text style={styles.modalActionText}>Message</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalActionButton}
                    onPress={() => handleCandidateAction('call', selectedCandidate)}
                  >
                    <Ionicons name="call" size={20} color="#16a34a" />
                    <Text style={styles.modalActionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalActionButton, styles.hireModalButton]}
                    onPress={() => {
                      handleCandidateAction('hire', selectedCandidate);
                      setShowCandidateModal(false);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="white" />
                    <Text style={[styles.modalActionText, { color: 'white' }]}>Hire</Text>
                  </TouchableOpacity>
                </View>
              </>
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
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9ca3af',
  },
  candidatesList: {
    flex: 1,
  },
  candidateCard: {
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
  candidateHeader: {
    marginBottom: 12,
  },
  candidateInfo: {
    flexDirection: 'row',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  candidateDetails: {
    flex: 1,
  },
  candidateName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  experience: {
    fontSize: 12,
    color: '#6b7280',
  },
  appliedJobContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  appliedJobLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  appliedJobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  appliedTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  skillTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '500',
  },
  moreSkills: {
    fontSize: 12,
    color: '#6b7280',
    alignSelf: 'center',
  },
  quickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  candidateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  rejectButton: {
    borderColor: '#fee2e2',
    backgroundColor: '#fee2e2',
  },
  messageButton: {
    borderColor: '#dbeafe',
    backgroundColor: '#dbeafe',
  },
  callButton: {
    borderColor: '#dcfce7',
    backgroundColor: '#dcfce7',
  },
  hireButton: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  hireButtonText: {
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
    maxHeight: '90%',
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
    fontWeight: '700',
    color: '#1f2937',
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileSummary: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalAvatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  summaryInfo: {
    flex: 1,
  },
  summaryName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  summaryRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryRatingText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  summaryLocation: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  modalSkills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalSkillTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalSkillText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  reviewItem: {
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewStars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  reviewEmployer: {
    fontSize: 12,
    color: '#6b7280',
  },
  reviewComment: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  hireModalButton: {
    backgroundColor: '#2563eb',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
});