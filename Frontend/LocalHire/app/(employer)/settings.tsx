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
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

export default function EmployerSettings() {
  const [notifications, setNotifications] = useState({
    newApplications: true,
    jobReminders: true,
    paymentUpdates: true,
    promotions: false,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    showContactInfo: false,
    allowDirectContact: true,
  });

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => router.replace('/') 
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Account', 
          style: 'destructive',
          onPress: () => console.log('Delete account') 
        }
      ]
    );
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    // Simulate password change
    Alert.alert('Success', 'Password changed successfully', [
      { text: 'OK', onPress: () => setShowChangePassword(false) }
    ]);
    
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const renderSettingItem = (
    title: string,
    subtitle: string,
    icon: string,
    onPress: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Icon name={icon} size={24} color="#6b7280" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      {rightComponent || <Icon name="chevron-forward" size={20} color="#9ca3af" />}
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#e5e7eb', true: '#2563eb' }}
        thumbColor={value ? 'white' : '#f3f4f6'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {renderSettingItem(
            'Edit Profile',
            'Update your company information and contact details',
            'person',
            () => router.push('/(employer)/profile-edit')
          )}
          
          {renderSettingItem(
            'Change Password',
            'Update your account password',
            'lock',
            () => setShowChangePassword(true)
          )}
          
          {renderSettingItem(
            'Payment Methods',
            'Manage your payment and billing information',
            'card',
            () => Alert.alert('Coming Soon', 'Payment methods management will be available soon')
          )}
          
          {renderSettingItem(
            'Subscription',
            'View and manage your subscription plan',
            'star',
            () => Alert.alert('Coming Soon', 'Subscription management will be available soon')
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {renderSwitchItem(
            'New Applications',
            'Get notified when workers apply to your jobs',
            notifications.newApplications,
            (value) => setNotifications(prev => ({ ...prev, newApplications: value }))
          )}
          
          {renderSwitchItem(
            'Job Reminders',
            'Reminders about job deadlines and updates',
            notifications.jobReminders,
            (value) => setNotifications(prev => ({ ...prev, jobReminders: value }))
          )}
          
          {renderSwitchItem(
            'Payment Updates',
            'Updates about payments and transactions',
            notifications.paymentUpdates,
            (value) => setNotifications(prev => ({ ...prev, paymentUpdates: value }))
          )}
          
          {renderSwitchItem(
            'Promotions',
            'Special offers and promotional content',
            notifications.promotions,
            (value) => setNotifications(prev => ({ ...prev, promotions: value }))
          )}
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          {renderSwitchItem(
            'Profile Visible',
            'Allow workers to see your company profile',
            privacy.profileVisible,
            (value) => setPrivacy(prev => ({ ...prev, profileVisible: value }))
          )}
          
          {renderSwitchItem(
            'Show Contact Info',
            'Display your contact information on job posts',
            privacy.showContactInfo,
            (value) => setPrivacy(prev => ({ ...prev, showContactInfo: value }))
          )}
          
          {renderSwitchItem(
            'Allow Direct Contact',
            'Let workers contact you directly through the app',
            privacy.allowDirectContact,
            (value) => setPrivacy(prev => ({ ...prev, allowDirectContact: value }))
          )}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          {renderSettingItem(
            'Help Center',
            'Find answers to frequently asked questions',
            'help',
            () => Alert.alert('Coming Soon', 'Help center will be available soon')
          )}
          
          {renderSettingItem(
            'Contact Support',
            'Get help from our customer support team',
            'chatbubble',
            () => Alert.alert('Contact Support', 'Email: support@ell.com\nPhone: +91 98765 43210')
          )}
          
          {renderSettingItem(
            'Report a Problem',
            'Report technical issues or bugs',
            'warning',
            () => Alert.alert('Coming Soon', 'Problem reporting will be available soon')
          )}
          
          {renderSettingItem(
            'Feature Request',
            'Suggest new features for the app',
            'bulb',
            () => Alert.alert('Coming Soon', 'Feature request form will be available soon')
          )}
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          
          {renderSettingItem(
            'Terms of Service',
            'Read our terms and conditions',
            'document',
            () => Alert.alert('Terms of Service', 'Terms of service content will be displayed here')
          )}
          
          {renderSettingItem(
            'Privacy Policy',
            'Learn about how we handle your data',
            'shield',
            () => Alert.alert('Privacy Policy', 'Privacy policy content will be displayed here')
          )}
          
          {renderSettingItem(
            'App Version',
            'Version 1.0.0',
            'info',
            () => {},
            <Text style={styles.versionText}>1.0.0</Text>
          )}
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#ef4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Icon name="trash" size={24} color="#ef4444" />
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePassword}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangePassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowChangePassword(false)}>
                <Icon name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                  secureTextEntry
                  placeholder="Enter current password"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                  secureTextEntry
                  placeholder="Enter new password"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.textInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry
                  placeholder="Confirm new password"
                />
              </View>
              
              <TouchableOpacity style={styles.changePasswordButton} onPress={handleChangePassword}>
                <Text style={styles.changePasswordButtonText}>Change Password</Text>
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
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
    marginLeft: 12,
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
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
  },
  changePasswordButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  changePasswordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});