import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

const notifications = [
  {
    id: '1',
    type: 'job_match',
    title: 'New Job Match',
    message: 'A new painting job matches your skills in Koramangala',
    time: '5 min ago',
    read: false,
    icon: 'briefcase',
    color: '#2563eb',
    action: 'view_job',
    jobId: '1',
  },
  {
    id: '2',
    type: 'application_accepted',
    title: 'Application Accepted',
    message: 'Rajesh Kumar accepted your application for House Painting job',
    time: '2 hours ago',
    read: false,
    icon: 'checkmark-circle',
    color: '#16a34a',
    action: 'open_chat',
    chatId: '1',
  },
  {
    id: '3',
    type: 'payment_received',
    title: 'Payment Received',
    message: 'You received ₹800 for Office Cleaning job',
    time: '1 day ago',
    read: true,
    icon: 'wallet',
    color: '#f59e0b',
    action: 'view_payment',
  },
  {
    id: '4',
    type: 'review',
    title: 'New Review',
    message: 'Priya Sharma left you a 5-star review',
    time: '2 days ago',
    read: true,
    icon: 'star',
    color: '#8b5cf6',
    action: 'view_profile',
  },
  {
    id: '5',
    type: 'message',
    title: 'New Message',
    message: 'You have a new message from Home Decor Co.',
    time: '3 days ago',
    read: true,
    icon: 'chatbubble',
    color: '#06b6d4',
    action: 'open_chat',
    chatId: '4',
  },
  {
    id: '6',
    type: 'reminder',
    title: 'Job Reminder',
    message: 'Your painting job starts tomorrow at 9 AM',
    time: '3 days ago',
    read: true,
    icon: 'time',
    color: '#f97316',
    action: 'view_schedule',
  },
];

export default function Notifications() {
  const [notificationList, setNotificationList] = useState(notifications);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const unreadCount = notificationList.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotificationList(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotificationList(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setNotificationList(prev => prev.filter(n => n.id !== id));
          }
        }
      ]
    );
  };

  const handleNotificationPress = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    switch (notification.action) {
      case 'view_job':
        router.push(`/(worker)/job/${notification.jobId}`);
        break;
      case 'open_chat':
        router.push(`/(worker)/chat/${notification.chatId}`);
        break;
      case 'view_profile':
        router.push('/(worker)/profile');
        break;
      case 'view_payment':
        Alert.alert('Payment Details', 'Payment history feature coming soon!');
        break;
      case 'view_schedule':
        Alert.alert('Schedule', 'Schedule feature coming soon!');
        break;
      default:
        break;
    }
  };

  const filteredNotifications = notificationList.filter(notification => {
    switch (selectedFilter) {
      case 'unread':
        return !notification.read;
      case 'jobs':
        return ['job_match', 'application_accepted'].includes(notification.type);
      case 'payments':
        return notification.type === 'payment_received';
      default:
        return true;
    }
  });

  const renderNotification = ({ item }: { item: typeof notifications[0] }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.notificationIcon, { backgroundColor: item.color + '20' }]}>
        <Icon name={item.icon} size={24} color={item.color} />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, !item.read && styles.unreadTitle]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        
        <Text style={styles.notificationMessage}>{item.message}</Text>
        
        {!item.read && <View style={styles.unreadIndicator} />}
      </View>
      
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteNotification(item.id)}
      >
        <Icon name="close" size={16} color="#9ca3af" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filterOptions = [
    { key: 'all', label: 'All', count: notificationList.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'jobs', label: 'Jobs', count: notificationList.filter(n => ['job_match', 'application_accepted'].includes(n.type)).length },
    { key: 'payments', label: 'Payments', count: notificationList.filter(n => n.type === 'payment_received').length },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterTab,
              selectedFilter === option.key && styles.activeFilterTab
            ]}
            onPress={() => setSelectedFilter(option.key)}
          >
            <Text style={[
              styles.filterTabText,
              selectedFilter === option.key && styles.activeFilterTabText
            ]}>
              {option.label}
            </Text>
            {option.count > 0 && (
              <View style={[
                styles.filterCount,
                selectedFilter === option.key && styles.activeFilterCount
              ]}>
                <Text style={[
                  styles.filterCountText,
                  selectedFilter === option.key && styles.activeFilterCountText
                ]}>
                  {option.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="notifications" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateTitle}>No notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        }
      />
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
  markAllRead: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  notificationsList: {
    flex: 1,
    backgroundColor: 'white',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: 'white',
  },
  unreadNotification: {
    backgroundColor: '#f8fafc',
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    position: 'relative',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#1f2937',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
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
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});