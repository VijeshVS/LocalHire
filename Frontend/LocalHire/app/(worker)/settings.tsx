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
} from 'react-native';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

export default function WorkerSettings() {
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [jobAlerts, setJobAlerts] = useState(true);

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

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: 'person',
          title: 'Personal Information',
          subtitle: 'Update your profile details',
          onPress: () => Alert.alert('Info', 'Personal info settings coming soon!'),
        },
        {
          icon: 'lock',
          title: 'Change Password',
          subtitle: 'Update your password',
          onPress: () => Alert.alert('Security', 'Password change coming soon!'),
        },
        {
          icon: 'shield',
          title: 'Verification',
          subtitle: 'Complete your profile verification',
          onPress: () => Alert.alert('Verification', 'Verification process coming soon!'),
        },
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Get notified about new jobs',
          isSwitch: true,
          value: notifications,
          onValueChange: setNotifications,
        },
        {
          icon: 'location',
          title: 'Location Sharing',
          subtitle: 'Share location for nearby jobs',
          isSwitch: true,
          value: locationSharing,
          onValueChange: setLocationSharing,
        },
        {
          icon: 'briefcase',
          title: 'Job Alerts',
          subtitle: 'Get alerts for matching jobs',
          isSwitch: true,
          value: jobAlerts,
          onValueChange: setJobAlerts,
        },
        {
          icon: 'moon',
          title: 'Dark Mode',
          subtitle: 'Switch to dark theme',
          isSwitch: true,
          value: darkMode,
          onValueChange: setDarkMode,
        },
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: 'help-circle',
          title: 'Help Center',
          subtitle: 'Get help and support',
          onPress: () => Alert.alert('Help', 'Help center coming soon!'),
        },
        {
          icon: 'chatbubble',
          title: 'Contact Support',
          subtitle: 'Chat with our support team',
          onPress: () => Alert.alert('Support', 'Support chat coming soon!'),
        },
        {
          icon: 'star',
          title: 'Rate App',
          subtitle: 'Rate us on app store',
          onPress: () => Alert.alert('Rating', 'App rating coming soon!'),
        },
        {
          icon: 'document',
          title: 'Terms & Privacy',
          subtitle: 'Read our policies',
          onPress: () => Alert.alert('Legal', 'Terms and privacy coming soon!'),
        },
      ]
    }
  ];

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
        {/* Profile Summary */}
        <View style={styles.profileSummary}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Ravi Kumar</Text>
            <Text style={styles.profileEmail}>ravi.kumar@email.com</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton}>
            <Icon name="create" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {/* Settings Sections */}
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.settingItemLast
                  ]}
                  onPress={item.onPress}
                  disabled={item.isSwitch}
                >
                  <View style={styles.settingItemLeft}>
                    <View style={styles.settingIcon}>
                      <Icon name={item.icon} size={20} color="#6b7280" />
                    </View>
                    <View style={styles.settingText}>
                      <Text style={styles.settingTitle}>{item.title}</Text>
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    </View>
                  </View>
                  
                  {item.isSwitch ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onValueChange}
                      trackColor={{ false: '#f3f4f6', true: '#10b981' }}
                      thumbColor={item.value ? '#ffffff' : '#9ca3af'}
                    />
                  ) : (
                    <Icon name="chevron-forward" size={16} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>ELL Version 1.0.0</Text>
          <Text style={styles.buildText}>Build 2024.11.27</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out" size={20} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6b7280',
  },
  editProfileButton: {
    padding: 8,
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 4,
  },
  buildText: {
    fontSize: 12,
    color: '#d1d5db',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    marginHorizontal: 20,
    marginBottom: 40,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
});