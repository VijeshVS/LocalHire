import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const skills = [
  { id: 1, name: 'Painting', verified: true, experience: '3 years' },
  { id: 2, name: 'Cleaning', verified: true, experience: '2 years' },
  { id: 3, name: 'Helper', verified: false, experience: '1 year' },
  { id: 4, name: 'Driver', verified: false, experience: 'Learning' },
];

const workHistory = [
  {
    id: 1,
    job: 'House Painting',
    employer: 'Rajesh Kumar',
    date: '15 Nov 2024',
    rating: 5,
    payment: '₹800',
    status: 'Completed'
  },
  {
    id: 2,
    job: 'Office Cleaning',
    employer: 'Tech Solutions',
    date: '10 Nov 2024',
    rating: 4,
    payment: '₹600',
    status: 'Completed'
  },
  {
    id: 3,
    job: 'Moving Helper',
    employer: 'Priya Sharma',
    date: '5 Nov 2024',
    rating: 5,
    payment: '₹700',
    status: 'Completed'
  }
];

export default function WorkerProfile() {
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing functionality coming soon!');
  };

  const handleVerification = () => {
    Alert.alert(
      'Get Verified',
      'Upload documents to get verified and increase your job opportunities.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Upload Documents', onPress: () => console.log('Verification started') }
      ]
    );
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      Alert.alert('Success', `${newSkill} added to your skills!`);
      setNewSkill('');
      setShowSkillModal(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={14}
          color="#fbbf24"
        />
      );
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Profile Overview */}
        <View style={styles.profileSection}>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>RK</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Ravi Kumar</Text>
                <Text style={styles.profileLocation}>📍 Koramangala, Bangalore</Text>
                <View style={styles.profileRating}>
                  <View style={styles.stars}>
                    {renderStars(4)}
                  </View>
                  <Text style={styles.ratingText}>4.5 (23 reviews)</Text>
                </View>
              </View>
            </View>

            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>47</Text>
                <Text style={styles.statLabel}>Jobs Done</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>₹23,500</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>96%</Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.verificationCard} onPress={handleVerification}>
              <View style={styles.verificationHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
                <Text style={styles.verificationTitle}>Verification Status</Text>
              </View>
              <Text style={styles.verificationStatus}>✅ Phone Verified</Text>
              <Text style={styles.verificationPending}>⏳ ID Verification Pending</Text>
              <Text style={styles.verificationAction}>Tap to complete verification</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Skills Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Skills</Text>
            <TouchableOpacity onPress={() => setShowSkillModal(true)}>
              <Ionicons name="add-circle-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>

          <View style={styles.skillsContainer}>
            {skills.map((skill) => (
              <View key={skill.id} style={styles.skillItem}>
                <View style={styles.skillHeader}>
                  <Text style={styles.skillName}>{skill.name}</Text>
                  {skill.verified && (
                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                  )}
                </View>
                <Text style={styles.skillExperience}>{skill.experience}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Work History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Work History</Text>
          {workHistory.map((work) => (
            <View key={work.id} style={styles.workItem}>
              <View style={styles.workHeader}>
                <View style={styles.workInfo}>
                  <Text style={styles.workJob}>{work.job}</Text>
                  <Text style={styles.workEmployer}>{work.employer}</Text>
                </View>
                <View style={styles.workDetails}>
                  <Text style={styles.workPayment}>{work.payment}</Text>
                  <Text style={styles.workDate}>{work.date}</Text>
                </View>
              </View>
              <View style={styles.workFooter}>
                <View style={styles.workRating}>
                  {renderStars(work.rating)}
                </View>
                <Text style={styles.workStatus}>{work.status}</Text>
              </View>
            </View>
          ))}
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>View All Work History</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#f3f4f6', true: '#10b981' }}
              thumbColor={notifications ? '#ffffff' : '#9ca3af'}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Share Location</Text>
            </View>
            <Switch
              value={locationSharing}
              onValueChange={setLocationSharing}
              trackColor={{ false: '#f3f4f6', true: '#10b981' }}
              thumbColor={locationSharing ? '#ffffff' : '#9ca3af'}
            />
          </View>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="language-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Language</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.settingValueText}>English</Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-outline" size={20} color="#6b7280" />
              <Text style={styles.settingText}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Contact</Text>
          <View style={styles.emergencyCard}>
            <Ionicons name="call" size={20} color="#dc2626" />
            <Text style={styles.emergencyText}>
              In case of emergency, call: <Text style={styles.emergencyNumber}>+91 98765 43210</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Skill Modal */}
      <Modal
        visible={showSkillModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSkillModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Skill</Text>
              <TouchableOpacity onPress={() => setShowSkillModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.skillInput}
              placeholder="Enter skill name (e.g., Carpenter, Cook)"
              value={newSkill}
              onChangeText={setNewSkill}
              autoFocus
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSkillModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddSkill}
              >
                <Text style={styles.addButtonText}>Add Skill</Text>
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
  profileSection: {
    padding: 20,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  profileRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  verificationCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 8,
  },
  verificationStatus: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 4,
  },
  verificationPending: {
    fontSize: 14,
    color: '#ca8a04',
    marginBottom: 8,
  },
  verificationAction: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
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
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillItem: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minWidth: 100,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  skillExperience: {
    fontSize: 12,
    color: '#6b7280',
  },
  workItem: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    marginBottom: 12,
  },
  workHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  workInfo: {
    flex: 1,
  },
  workJob: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  workEmployer: {
    fontSize: 14,
    color: '#6b7280',
  },
  workDetails: {
    alignItems: 'flex-end',
  },
  workPayment: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 2,
  },
  workDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  workFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workRating: {
    flexDirection: 'row',
  },
  workStatus: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  emergencyText: {
    fontSize: 14,
    color: '#991b1b',
    marginLeft: 12,
    flex: 1,
  },
  emergencyNumber: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  skillInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  addButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});