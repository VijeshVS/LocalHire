import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { createJob } from '../../services/jobService';
import * as Location from 'expo-location';

const jobCategories = [
  { id: 'painting', name: 'Painting', icon: 'brush' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles' },
  { id: 'plumbing', name: 'Plumbing', icon: 'water' },
  { id: 'electrical', name: 'Electrical', icon: 'flash' },
  { id: 'carpentry', name: 'Carpentry', icon: 'hammer' },
  { id: 'gardening', name: 'Gardening', icon: 'leaf' },
];

const urgencyOptions = [
  { id: 'immediate', label: 'Immediate', sublabel: 'Within 1 hour', color: '#ef4444' },
  { id: 'today', label: 'Today', sublabel: 'Within today', color: '#f59e0b' },
  { id: 'tomorrow', label: 'Tomorrow', sublabel: 'Next day', color: '#3b82f6' },
  { id: 'flexible', label: 'Flexible', sublabel: 'This week', color: '#10b981' },
];

export default function PostJobScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    latitude: null as number | null,
    longitude: null as number | null,
    pay: '',
    urgency: '',
    duration: '',
    workersNeeded: '1',
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Get current location
  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // Try to get address from coordinates
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) {
          const addressText = [
            address.name,
            address.street,
            address.district,
            address.city,
            address.region
          ].filter(Boolean).join(', ');
          
          updateFormData('location', addressText || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      } catch (geocodeError) {
        // If geocoding fails, just use coordinates
        updateFormData('location', `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }

      updateFormData('latitude', latitude);
      updateFormData('longitude', longitude);
      
      Alert.alert('Location Set', 'Your current location has been captured successfully!');
    } catch (error: any) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get location. Please enter address manually.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.title && formData.category;
      case 2:
        return formData.description && formData.location;
      case 3:
        return formData.pay && formData.urgency;
      case 4:
        return formData.duration && formData.workersNeeded;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!isStepValid()) {
      Alert.alert('Missing Information', 'Please fill in all required fields');
      return;
    }

    // Warn if no location coordinates
    if (!formData.latitude || !formData.longitude) {
      Alert.alert(
        'Location Not Set',
        'You haven\'t set your location. Workers search by location, so your job may not appear in their searches. Do you want to continue?',
        [
          { text: 'Set Location', style: 'cancel' },
          { text: 'Continue Anyway', onPress: () => submitJob() }
        ]
      );
      return;
    }

    submitJob();
  };

  const submitJob = async () => {
    setIsSubmitting(true);

    try {
      const jobData: any = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        address: formData.location,
        wage: parseInt(formData.pay) || 0,
        duration: formData.duration,
      };

      // Include location coordinates if available
      if (formData.latitude && formData.longitude) {
        jobData.location = {
          latitude: formData.latitude,
          longitude: formData.longitude,
        };
      }

      await createJob(jobData);

      Alert.alert(
        'Job Posted Successfully! 🎉',
        'Your job has been posted and workers nearby will be notified.',
        [
          {
            text: 'View Jobs',
            onPress: () => router.push('/(employer)/jobs'),
          },
          {
            text: 'Post Another',
            onPress: () => {
              setCurrentStep(1);
              setFormData({
                title: '',
                category: '',
                description: '',
                location: '',
                latitude: null,
                longitude: null,
                pay: '',
                urgency: '',
                duration: '',
                workersNeeded: '1',
              });
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View
          key={step}
          style={[
            styles.progressStep,
            step <= currentStep && styles.progressStepActive,
          ]}
        >
          {step < currentStep ? (
            <Ionicons name="checkmark" size={16} color={COLORS.white} />
          ) : (
            <Text style={[
              styles.progressStepText,
              step <= currentStep && styles.progressStepTextActive
            ]}>
              {step}
            </Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>What job do you need help with?</Text>
      <Text style={styles.stepSubtitle}>Select a category and add a title</Text>

      {/* Categories */}
      <View style={styles.categoriesGrid}>
        {jobCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              formData.category === category.id && styles.categoryCardSelected
            ]}
            onPress={() => updateFormData('category', category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={28}
              color={formData.category === category.id ? COLORS.employer.primary : COLORS.gray[600]}
            />
            <Text style={[
              styles.categoryName,
              formData.category === category.id && styles.categoryNameSelected
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Job Title */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Job Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 3 Rooms House Painting"
          placeholderTextColor={COLORS.gray[400]}
          value={formData.title}
          onChangeText={(text) => updateFormData('title', text)}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Describe the job</Text>
      <Text style={styles.stepSubtitle}>Provide details and location</Text>

      {/* Description */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Job Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe what needs to be done..."
          placeholderTextColor={COLORS.gray[400]}
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>

      {/* Location */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Location *</Text>
        <View style={styles.locationInput}>
          <Ionicons name="location" size={20} color={COLORS.gray[500]} />
          <TextInput
            style={styles.locationTextInput}
            placeholder="Enter address or use current location"
            placeholderTextColor={COLORS.gray[400]}
            value={formData.location}
            onChangeText={(text) => updateFormData('location', text)}
          />
        </View>
        
        {/* Use Current Location Button */}
        <TouchableOpacity 
          style={styles.useLocationButton}
          onPress={getCurrentLocation}
          disabled={isGettingLocation}
        >
          {isGettingLocation ? (
            <ActivityIndicator size="small" color={COLORS.employer.primary} />
          ) : (
            <>
              <Ionicons name="navigate" size={18} color={COLORS.employer.primary} />
              <Text style={styles.useLocationText}>Use Current Location</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Location Status */}
        {formData.latitude && formData.longitude && (
          <View style={styles.locationStatus}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.status.success} />
            <Text style={styles.locationStatusText}>
              Location captured ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Payment & Urgency</Text>
      <Text style={styles.stepSubtitle}>Set the pay rate and timeline</Text>

      {/* Pay */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Payment (₹) *</Text>
        <View style={styles.payInput}>
          <Text style={styles.currencySymbol}>₹</Text>
          <TextInput
            style={styles.payTextInput}
            placeholder="800"
            placeholderTextColor={COLORS.gray[400]}
            value={formData.pay}
            onChangeText={(text) => updateFormData('pay', text)}
            keyboardType="numeric"
          />
          <Text style={styles.payUnit}>per day</Text>
        </View>
      </View>

      {/* Urgency */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>When do you need this? *</Text>
        <View style={styles.urgencyGrid}>
          {urgencyOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.urgencyCard,
                formData.urgency === option.id && styles.urgencyCardSelected,
                { borderLeftColor: option.color }
              ]}
              onPress={() => updateFormData('urgency', option.id)}
            >
              <Text style={[
                styles.urgencyLabel,
                formData.urgency === option.id && styles.urgencyLabelSelected
              ]}>
                {option.label}
              </Text>
              <Text style={styles.urgencySublabel}>{option.sublabel}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Final Details</Text>
      <Text style={styles.stepSubtitle}>Duration and number of workers</Text>

      {/* Duration */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Job Duration *</Text>
        <View style={styles.durationButtons}>
          {['1 day', '2-3 days', '1 week', 'Custom'].map((duration) => (
            <TouchableOpacity
              key={duration}
              style={[
                styles.durationButton,
                formData.duration === duration && styles.durationButtonSelected
              ]}
              onPress={() => updateFormData('duration', duration)}
            >
              <Text style={[
                styles.durationButtonText,
                formData.duration === duration && styles.durationButtonTextSelected
              ]}>
                {duration}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Workers Needed */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Workers Needed *</Text>
        <View style={styles.counterContainer}>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => updateFormData('workersNeeded', String(Math.max(1, parseInt(formData.workersNeeded) - 1)))}
          >
            <Ionicons name="remove" size={20} color={COLORS.employer.primary} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{formData.workersNeeded}</Text>
          <TouchableOpacity
            style={styles.counterButton}
            onPress={() => updateFormData('workersNeeded', String(parseInt(formData.workersNeeded) + 1))}
          >
            <Ionicons name="add" size={20} color={COLORS.employer.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Job Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Category:</Text>
          <Text style={styles.summaryValue}>{formData.category}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Payment:</Text>
          <Text style={styles.summaryValue}>₹{formData.pay}/day</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Duration:</Text>
          <Text style={styles.summaryValue}>{formData.duration}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Workers:</Text>
          <Text style={styles.summaryValue}>{formData.workersNeeded}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Location:</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {formData.latitude && formData.longitude ? (
              <>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.status.success} />
                <Text style={[styles.summaryValue, { color: COLORS.status.success }]}>Set</Text>
              </>
            ) : (
              <>
                <Ionicons name="warning" size={14} color={COLORS.status.warning} />
                <Text style={[styles.summaryValue, { color: COLORS.status.warning }]}>Not Set</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post a Job</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={COLORS.gray[600]} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Step Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Footer Buttons - Now inside SafeArea */}
      <View style={styles.footer}>
        {currentStep < totalSteps ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isStepValid() && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!isStepValid()}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isStepValid() && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!isStepValid()}
          >
            <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
            <Text style={styles.submitButtonText}>Post Job</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.md,
  },
  progressStep: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: COLORS.employer.primary,
  },
  progressStepText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[500],
  },
  progressStepTextActive: {
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl, // Add padding to prevent content from hiding behind footer
  },
  stepContent: {
    padding: SPACING.xl,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
  },
  stepSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
    marginBottom: SPACING.xl,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  categoryCardSelected: {
    backgroundColor: COLORS.employer.bg,
    borderColor: COLORS.employer.primary,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[700],
  },
  categoryNameSelected: {
    color: COLORS.employer.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  inputGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  input: {
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
  },
  textArea: {
    height: 120,
    paddingTop: SPACING.md,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.md,
  },
  locationTextInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    backgroundColor: COLORS.employer.bg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.employer.primary,
    gap: SPACING.sm,
  },
  useLocationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.employer.primary,
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  locationStatusText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.status.success,
  },
  payInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  currencySymbol: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginRight: SPACING.sm,
  },
  payTextInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
  },
  payUnit: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    marginLeft: SPACING.sm,
  },
  urgencyGrid: {
    gap: SPACING.md,
  },
  urgencyCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    borderLeftWidth: 4,
    padding: SPACING.lg,
  },
  urgencyCardSelected: {
    backgroundColor: COLORS.employer.bg,
    borderColor: COLORS.employer.primary,
  },
  urgencyLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  urgencyLabelSelected: {
    color: COLORS.employer.primary,
  },
  urgencySublabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  durationButton: {
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  durationButtonSelected: {
    backgroundColor: COLORS.employer.bg,
    borderColor: COLORS.employer.primary,
  },
  durationButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[700],
  },
  durationButtonTextSelected: {
    color: COLORS.employer.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xl,
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignSelf: 'flex-start',
  },
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  counterValue: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    minWidth: 40,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: COLORS.employer.bg,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    marginTop: SPACING.lg,
  },
  summaryTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  summaryLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
  },
  summaryValue: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
  },
  nextButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.employer.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  nextButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  nextButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.status.success,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray[300],
  },
  submitButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
});