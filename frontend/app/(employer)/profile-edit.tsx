import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from '../../components/Icon';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { getEmployerProfile, updateEmployerProfile } from '../../services/profileService';
import { API_BASE_URL } from '../../services/api';

export default function EmployerProfileEdit() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    language: '',
    address: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await getEmployerProfile();
      setProfile({
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        business_name: data.business_name || '',
        business_type: data.business_type || '',
        language: data.language || '',
        address: data.address || '',
      });
    } catch (error) {
      console.log('Error fetching profile:', error);
      // Fallback to auth user data
      if (user) {
        setProfile(prev => ({
          ...prev,
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: any = {
        name: profile.name.trim(),
      };

      if (profile.phone.trim()) updateData.phone = profile.phone.trim();
      if (profile.business_name.trim()) updateData.business_name = profile.business_name.trim();
      if (profile.business_type.trim()) updateData.business_type = profile.business_type.trim();
      if (profile.language.trim()) updateData.language = profile.language.trim();
      if (profile.address.trim()) updateData.address = profile.address.trim();

      await updateEmployerProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLocation = async () => {
    setIsUpdatingLocation(true);
    let token: string | null = null;
    try {
      // Get token from AsyncStorage
      token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found. Please login again.');
        return;
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to update your location');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Send location to backend
      const response = await fetch(`${API_BASE_URL}/employer/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          location: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update location');
      }

      Alert.alert('Success', 'Location updated successfully!');
    } catch (error: any) {
      console.error('Update location error:', error);
      Alert.alert('Error', error.message || 'Failed to update location');
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={COLORS.employer.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.gray[800]} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveButton}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.employer.primary} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.business_name?.[0] || profile.name?.[0] || 'E'}
              </Text>
            </View>
            <Text style={styles.avatarHint}>Profile photo coming soon</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                placeholder="Enter your full name"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={profile.email}
                editable={false}
                placeholder="Email address"
                placeholderTextColor={COLORS.gray[400]}
              />
              <Text style={styles.inputHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={profile.phone}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                placeholder="Enter your phone number"
                placeholderTextColor={COLORS.gray[400]}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Business Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Business Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <TextInput
                style={styles.textInput}
                value={profile.business_name}
                onChangeText={(text) => setProfile({ ...profile, business_name: text })}
                placeholder="Enter your business/company name"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Type</Text>
              <TextInput
                style={styles.textInput}
                value={profile.business_type}
                onChangeText={(text) => setProfile({ ...profile, business_type: text })}
                placeholder="e.g., Construction, Restaurant, Retail"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Language</Text>
              <TextInput
                style={styles.textInput}
                value={profile.language}
                onChangeText={(text) => setProfile({ ...profile, language: text })}
                placeholder="e.g., Hindi, English, Kannada"
                placeholderTextColor={COLORS.gray[400]}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={profile.address}
                onChangeText={(text) => setProfile({ ...profile, address: text })}
                placeholder="Enter your business address"
                placeholderTextColor={COLORS.gray[400]}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Update Location Button */}
            <TouchableOpacity
              style={styles.updateLocationButton}
              onPress={handleUpdateLocation}
              disabled={isUpdatingLocation}
            >
              {isUpdatingLocation ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <Icon name="location-on" size={20} color={COLORS.white} />
                  <Text style={styles.updateLocationText}>Update Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
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
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  saveButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  saveButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.employer.primary,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.employer.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.employer.primary,
  },
  avatarHint: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  section: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  textInput: {
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
  },
  disabledInput: {
    backgroundColor: COLORS.gray[100],
    color: COLORS.gray[500],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
  },
  updateLocationButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.employer.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    ...SHADOWS.sm,
  },
  updateLocationText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
