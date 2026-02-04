import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getEmployeeProfile, updateEmployeeProfile, addEmployeeSkill, removeEmployeeSkill } from '../../services/profileService';
import { getWorkerAnalytics } from '../../services/analyticsService';
import { getAllSkills, Skill } from '../../services/skillService';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function WorkerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>({
    name: '',
    phone: '',
    email: '',
    rating: 0,
    totalJobs: 0,
    completionRate: 0,
    earnings: { today: 0, week: 0, month: 0 },
    skills: [],
    years_of_experience: '0',
    languages: [],
    status: 'active',
    verified: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [availability, setAvailability] = useState<'Available' | 'Busy' | 'Offline'>('Available');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    language: '',
    years_of_experience: '',
    address: '',
  });
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [userSkillIds, setUserSkillIds] = useState<string[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchAnalytics();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getEmployeeProfile();
      const skillIds = data.skills?.map((s: any) => s.skill_id || s.id) || [];
      setUserSkillIds(skillIds);
      
      setProfile((prev: any) => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        rating: data.rating || 0,
        skills: data.skills?.map((s: any) => s.skill_name) || [],
        years_of_experience: data.years_of_experience ? `${data.years_of_experience} years` : '0 years',
        languages: data.language ? [data.language] : [],
        language: data.language || '',
        status: data.status || 'active',
        verified: data.status === 'active',
        address: data.address || '',
      }));
      setAvailability(data.status === 'active' ? 'Available' : 'Offline');
    } catch (error) {
      console.log('Error fetching profile:', error);
      if (user) {
        setProfile((prev: any) => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
      }
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getWorkerAnalytics();
      setProfile((prev: any) => ({
        ...prev,
        totalJobs: data.overview.completedJobs,
        completionRate: data.overview.completionRate,
        earnings: {
          today: 0,
          week: 0,
          month: data.overview.totalEarnings,
        },
      }));
    } catch (error) {
      console.log('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
        return;
      }

      // Create a shareable profile text
      const profileText = `
🧑‍💼 ${profile.name}
📱 ${profile.phone || 'No phone'}
⭐ Rating: ${profile.rating || 0}/5
💼 Experience: ${profile.years_of_experience || 'Not specified'}
🗣️ Languages: ${profile.languages?.join(', ') || 'Not specified'}
🛠️ Skills: ${profile.skills?.join(', ') || 'No skills listed'}

Find me on LocalHire!
      `.trim();

      // Save to a temp file and share
      const fileUri = FileSystem.documentDirectory + 'profile.txt';
      await FileSystem.writeAsStringAsync(fileUri, profileText);
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/plain',
        dialogTitle: 'Share Profile',
      });
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert('Error', 'Failed to share profile');
    }
  };

  const handleEditSkills = async () => {
    setIsLoadingSkills(true);
    try {
      const skills = await getAllSkills();
      setAllSkills(skills);
      setShowSkillsModal(true);
    } catch (error) {
      console.log('Error loading skills:', error);
      Alert.alert('Error', 'Failed to load skills');
    } finally {
      setIsLoadingSkills(false);
    }
  };

  const toggleSkill = async (skill: Skill) => {
    const isSelected = userSkillIds.includes(skill.id);
    
    try {
      if (isSelected) {
        await removeEmployeeSkill(skill.id);
        setUserSkillIds(prev => prev.filter(id => id !== skill.id));
        setProfile((prev: any) => ({
          ...prev,
          skills: prev.skills.filter((s: string) => s !== skill.skill_name),
        }));
      } else {
        await addEmployeeSkill(skill.id);
        setUserSkillIds(prev => [...prev, skill.id]);
        setProfile((prev: any) => ({
          ...prev,
          skills: [...(prev.skills || []), skill.skill_name],
        }));
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update skill');
    }
  };

  const handleEditProfile = () => {
    // Pre-fill the form with current profile data
    setEditForm({
      name: profile.name || '',
      phone: profile.phone || '',
      language: profile.languages?.[0] || '',
      years_of_experience: profile.years_of_experience?.replace(' years', '') || '',
      address: profile.address || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        name: editForm.name.trim(),
      };

      if (editForm.phone.trim()) updateData.phone = editForm.phone.trim();
      if (editForm.language.trim()) updateData.language = editForm.language.trim();
      if (editForm.years_of_experience.trim()) {
        updateData.years_of_experience = parseInt(editForm.years_of_experience) || 0;
      }
      if (editForm.address.trim()) updateData.address = editForm.address.trim();

      await updateEmployeeProfile(updateData);
      
      // Update local state
      setProfile((prev: any) => ({
        ...prev,
        name: updateData.name,
        phone: updateData.phone || prev.phone,
        languages: updateData.language ? [updateData.language] : prev.languages,
        years_of_experience: updateData.years_of_experience ? `${updateData.years_of_experience} years` : prev.years_of_experience,
        address: updateData.address || prev.address,
      }));

      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getAvailabilityConfig = (status: string) => {
    switch (status) {
      case 'Available':
        return { color: COLORS.status.success, bg: '#d1fae5', icon: 'checkmark-circle' };
      case 'Busy':
        return { color: COLORS.status.warning, bg: '#fef3c7', icon: 'time' };
      default:
        return { color: COLORS.gray[500], bg: COLORS.gray[100], icon: 'power' };
    }
  };

  const availabilityConfig = getAvailabilityConfig(availability);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.worker.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Hero */}
        <View style={styles.heroSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{profile.name?.[0] || 'W'}</Text>
            </View>
            {profile.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              </View>
            )}
          </View>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.phone}>{profile.phone || profile.email}</Text>

          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <Text style={styles.ratingText}>{profile.rating || 0}</Text>
            <Text style={styles.ratingSubtext}>({profile.totalJobs || 0} jobs)</Text>
          </View>

          {/* Availability Toggle */}
          <View style={[styles.availabilityBadge, { backgroundColor: availabilityConfig.bg }]}>
            <Ionicons name={availabilityConfig.icon as any} size={16} color={availabilityConfig.color} />
            <Text style={[styles.availabilityText, { color: availabilityConfig.color }]}>
              {availability}
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹{profile.earnings?.month || 0}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.completionRate || 0}%</Text>
            <Text style={styles.statLabel}>Completion</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{profile.totalJobs || 0}</Text>
            <Text style={styles.statLabel}>Total Jobs</Text>
          </View>
        </View>

        {/* Info Sections */}
        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <TouchableOpacity 
              style={styles.editSkillsButton}
              onPress={handleEditSkills}
              disabled={isLoadingSkills}
            >
              {isLoadingSkills ? (
                <ActivityIndicator size="small" color={COLORS.worker.primary} />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={18} color={COLORS.worker.primary} />
                  <Text style={styles.editSkillsText}>Edit</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <View style={styles.skillsContainer}>
            {(profile.skills || []).length > 0 ? (
              (profile.skills || []).map((skill: string, index: number) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noDataText}>No skills added. Tap Edit to add skills.</Text>
            )}
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <View style={styles.infoRow}>
            <Ionicons name="briefcase-outline" size={20} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>{profile.years_of_experience || 'Not specified'}</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.infoRow}>
            <Ionicons name="language-outline" size={20} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>{profile.language || profile.languages?.join(', ') || 'Not specified'}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
            <Ionicons name="create-outline" size={20} color={COLORS.white} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => router.push('/(worker)/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={COLORS.worker.primary} />
            <Text style={styles.settingsButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <ActivityIndicator size="small" color={COLORS.worker.primary} />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.gray[400]}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Language</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.language}
                onChangeText={(text) => setEditForm({ ...editForm, language: text })}
                placeholder="e.g., Hindi, English, Kannada"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Years of Experience</Text>
              <TextInput
                style={styles.textInput}
                value={editForm.years_of_experience}
                onChangeText={(text) => setEditForm({ ...editForm, years_of_experience: text })}
                placeholder="e.g., 5"
                placeholderTextColor={COLORS.gray[400]}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editForm.address}
                onChangeText={(text) => setEditForm({ ...editForm, address: text })}
                placeholder="Enter your address"
                placeholderTextColor={COLORS.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={{ height: 50 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Skills Modal */}
      <Modal
        visible={showSkillsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSkillsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSkillsModal(false)}>
              <Text style={styles.modalCancel}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Skills</Text>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.skillsModalSubtitle}>
              Tap skills to add or remove them from your profile
            </Text>
            <View style={styles.skillsGrid}>
              {allSkills.map((skill) => {
                const isSelected = userSkillIds.includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[
                      styles.skillSelectChip,
                      isSelected && styles.skillSelectChipActive
                    ]}
                    onPress={() => toggleSkill(skill)}
                  >
                    <Text style={[
                      styles.skillSelectText,
                      isSelected && styles.skillSelectTextActive
                    ]}>
                      {skill.skill_name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: 50 }} />
          </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSection: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    marginBottom: SPACING.md,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.worker.light,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
    ...SHADOWS.lg,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.status.success,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  phone: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
    marginBottom: SPACING.md,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  ratingText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  ratingSubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  availabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  availabilityText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  statsSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  statValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillChip: {
    backgroundColor: COLORS.worker.bg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
  },
  skillText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.worker.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[700],
  },
  actionSection: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xl,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.worker.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    ...SHADOWS.md,
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.worker.primary,
  },
  settingsButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.worker.primary,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  modalCancel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
  },
  modalSave: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.worker.primary,
  },
  modalContent: {
    flex: 1,
    padding: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  editSkillsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  editSkillsText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.worker.primary,
  },
  noDataText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    fontStyle: 'italic',
  },
  skillsModalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.gray[100],
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
  },
  skillSelectChipActive: {
    backgroundColor: COLORS.worker.primary,
    borderColor: COLORS.worker.primary,
  },
  skillSelectText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[700],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  skillSelectTextActive: {
    color: COLORS.white,
  },
});