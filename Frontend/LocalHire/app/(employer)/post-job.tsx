import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const jobCategories = [
  { id: '1', name: 'Painting', icon: 'brush' },
  { id: '2', name: 'Cleaning', icon: 'sparkles' },
  { id: '3', name: 'Helper', icon: 'people' },
  { id: '4', name: 'Driver', icon: 'car' },
  { id: '5', name: 'Carpenter', icon: 'hammer' },
  { id: '6', name: 'Electrician', icon: 'flash' },
  { id: '7', name: 'Plumber', icon: 'water' },
  { id: '8', name: 'Cook', icon: 'restaurant' },
];

const urgencyLevels = [
  { id: '1', label: 'Immediate', description: 'Needed right now', color: '#dc2626' },
  { id: '2', label: 'Today', description: 'Within today', color: '#d97706' },
  { id: '3', label: 'Tomorrow', description: 'By tomorrow', color: '#16a34a' },
  { id: '4', label: 'This Week', description: 'Within 7 days', color: '#2563eb' },
];

const workingHours = [
  { id: '1', label: 'Morning (6 AM - 12 PM)' },
  { id: '2', label: 'Afternoon (12 PM - 6 PM)' },
  { id: '3', label: 'Evening (6 PM - 10 PM)' },
  { id: '4', label: 'Full Day (8+ hours)' },
  { id: '5', label: 'Flexible' },
];

export default function PostJob() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    budget: '',
    location: '',
    urgency: '',
    workingHours: '',
    requirements: [''],
    benefits: [''],
  });

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUrgencyModal, setShowUrgencyModal] = useState(false);
  const [showHoursModal, setShowHoursModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const handleAddRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: [...prev.requirements, '']
    }));
  };

  const handleRemoveRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const handleRequirementChange = (text: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.map((req, i) => i === index ? text : req)
    }));
  };

  const handleAddBenefit = () => {
    setFormData(prev => ({
      ...prev,
      benefits: [...prev.benefits, '']
    }));
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleBenefitChange = (text: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.map((ben, i) => i === index ? text : ben)
    }));
  };

  const handleVoiceDescription = () => {
    setIsRecording(true);
    // Simulate voice recording
    setTimeout(() => {
      setIsRecording(false);
      setFormData(prev => ({
        ...prev,
        description: 'Need an experienced painter for interior wall painting. Should have experience with premium paints and color matching.'
      }));
      Alert.alert('Success', 'Voice description added!');
    }, 3000);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.category || !formData.budget) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Job Posted Successfully!',
      'Your job has been posted and is now visible to workers in your area.',
      [
        { text: 'Post Another Job', onPress: () => {
          setFormData({
            title: '',
            category: '',
            description: '',
            budget: '',
            location: '',
            urgency: '',
            workingHours: '',
            requirements: [''],
            benefits: [''],
          });
        }},
        { text: 'View Dashboard', onPress: () => router.back() }
      ]
    );
  };

  const renderCategoryItem = ({ item }: { item: typeof jobCategories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        formData.category === item.name && styles.selectedCategoryItem
      ]}
      onPress={() => {
        setFormData(prev => ({ ...prev, category: item.name }));
        setShowCategoryModal(false);
      }}
    >
      <Ionicons 
        name={item.icon as any} 
        size={24} 
        color={formData.category === item.name ? '#2563eb' : '#6b7280'} 
      />
      <Text style={[
        styles.categoryText,
        formData.category === item.name && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Job</Text>
        <TouchableOpacity onPress={handleSubmit}>
          <Text style={styles.publishButton}>Publish</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Job Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Job Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Experienced House Painter"
            value={formData.title}
            onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          />
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.label}>Category *</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowCategoryModal(true)}
          >
            <Text style={[styles.selectorText, formData.category ? styles.selectedText : styles.placeholderText]}>
              {formData.category || 'Select job category'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.label}>Location *</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Enter location or use current"
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            />
            <TouchableOpacity
              style={styles.locationButton}
              onPress={() => setFormData(prev => ({ ...prev, location: 'Koramangala, Bangalore' }))}
            >
              <Ionicons name="location" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Budget */}
        <View style={styles.section}>
          <Text style={styles.label}>Budget *</Text>
          <View style={styles.budgetContainer}>
            <Text style={styles.currencySymbol}>₹</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="500"
              value={formData.budget}
              onChangeText={(text) => setFormData(prev => ({ ...prev, budget: text }))}
              keyboardType="numeric"
            />
            <Text style={styles.budgetSuffix}>/day</Text>
          </View>
        </View>

        {/* Urgency */}
        <View style={styles.section}>
          <Text style={styles.label}>Urgency</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowUrgencyModal(true)}
          >
            <Text style={[styles.selectorText, formData.urgency ? styles.selectedText : styles.placeholderText]}>
              {formData.urgency || 'Select urgency level'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Working Hours */}
        <View style={styles.section}>
          <Text style={styles.label}>Working Hours</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={() => setShowHoursModal(true)}
          >
            <Text style={[styles.selectorText, formData.workingHours ? styles.selectedText : styles.placeholderText]}>
              {formData.workingHours || 'Select working hours'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Job Description</Text>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoiceDescription}
            >
              <Ionicons 
                name={isRecording ? "stop" : "mic"} 
                size={20} 
                color={isRecording ? "#dc2626" : "#2563eb"} 
              />
              <Text style={[styles.voiceButtonText, isRecording && { color: '#dc2626' }]}>
                {isRecording ? 'Recording...' : 'Voice Input'}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Describe the job requirements, skills needed, and any specific details..."
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Requirements */}
        <View style={styles.section}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Requirements</Text>
            <TouchableOpacity onPress={handleAddRequirement}>
              <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
          {formData.requirements.map((req, index) => (
            <View key={index} style={styles.listItemContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Requirement ${index + 1}`}
                value={req}
                onChangeText={(text) => handleRequirementChange(text, index)}
              />
              {formData.requirements.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveRequirement(index)}>
                  <Ionicons name="remove-circle-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.section}>
          <View style={styles.labelContainer}>
            <Text style={styles.label}>Benefits</Text>
            <TouchableOpacity onPress={handleAddBenefit}>
              <Ionicons name="add-circle-outline" size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
          {formData.benefits.map((benefit, index) => (
            <View key={index} style={styles.listItemContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={`Benefit ${index + 1}`}
                value={benefit}
                onChangeText={(text) => handleBenefitChange(text, index)}
              />
              {formData.benefits.length > 1 && (
                <TouchableOpacity onPress={() => handleRemoveBenefit(index)}>
                  <Ionicons name="remove-circle-outline" size={20} color="#dc2626" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Preview Section */}
        <View style={styles.previewSection}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <Text style={styles.previewJobTitle}>{formData.title || 'Job Title'}</Text>
            <Text style={styles.previewCategory}>{formData.category || 'Category'} • {formData.location || 'Location'}</Text>
            <Text style={styles.previewBudget}>₹{formData.budget || '000'}/day</Text>
            {formData.urgency && (
              <Text style={styles.previewUrgency}>Urgency: {formData.urgency}</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Category Modal */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={jobCategories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>

      {/* Urgency Modal */}
      <Modal
        visible={showUrgencyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowUrgencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Urgency</Text>
              <TouchableOpacity onPress={() => setShowUrgencyModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {urgencyLevels.map((level) => (
              <TouchableOpacity
                key={level.id}
                style={styles.urgencyItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, urgency: level.label }));
                  setShowUrgencyModal(false);
                }}
              >
                <View style={[styles.urgencyIndicator, { backgroundColor: level.color }]} />
                <View style={styles.urgencyContent}>
                  <Text style={styles.urgencyLabel}>{level.label}</Text>
                  <Text style={styles.urgencyDescription}>{level.description}</Text>
                </View>
                {formData.urgency === level.label && (
                  <Ionicons name="checkmark" size={20} color="#16a34a" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Working Hours Modal */}
      <Modal
        visible={showHoursModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHoursModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Working Hours</Text>
              <TouchableOpacity onPress={() => setShowHoursModal(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {workingHours.map((hours) => (
              <TouchableOpacity
                key={hours.id}
                style={styles.hoursItem}
                onPress={() => {
                  setFormData(prev => ({ ...prev, workingHours: hours.label }));
                  setShowHoursModal(false);
                }}
              >
                <Text style={styles.hoursLabel}>{hours.label}</Text>
                {formData.workingHours === hours.label && (
                  <Ionicons name="checkmark" size={20} color="#16a34a" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text style={styles.submitButtonText}>Post Job</Text>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  publishButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectorText: {
    fontSize: 16,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  selectedText: {
    color: '#374151',
  },
  locationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  locationButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginRight: 4,
  },
  budgetInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  budgetSuffix: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    height: 120,
    textAlignVertical: 'top',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  voiceButtonText: {
    fontSize: 14,
    color: '#2563eb',
    marginLeft: 4,
    fontWeight: '500',
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  previewSection: {
    marginTop: 16,
    marginBottom: 100,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  previewJobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  previewBudget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 4,
  },
  previewUrgency: {
    fontSize: 14,
    color: '#dc2626',
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
    maxHeight: '80%',
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
  categoryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedCategoryItem: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 8,
  },
  selectedCategoryText: {
    color: '#2563eb',
  },
  urgencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  urgencyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  urgencyContent: {
    flex: 1,
  },
  urgencyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
  },
  urgencyDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  hoursItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  hoursLabel: {
    fontSize: 16,
    color: '#374151',
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});