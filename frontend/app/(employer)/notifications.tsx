import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications 
} from '../../services/notificationService';

// Map notification types to icons
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'new_application':
      return { icon: 'person-add', color: COLORS.employer.primary };
    case 'application_withdrawn':
      return { icon: 'person-remove', color: COLORS.status.warning };
    case 'job_completed':
      return { icon: 'checkmark-circle', color: COLORS.status.success };
    case 'message':
      return { icon: 'chatbubble', color: COLORS.employer.primary };
    case 'worker_confirmed':
      return { icon: 'thumbs-up', color: COLORS.status.success };
    default:
      return { icon: 'notifications', color: COLORS.gray[600] };
  }
};

// Format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

export default function EmployerNotifications() {
  const [notificationList, setNotificationList] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      const formatted = data.map((n: any) => {
        const iconConfig = getNotificationIcon(n.type);
        return {
          id: n.id,
          type: n.type,
          title: n.title,
          message: n.message,
          read: n.is_read,
          time: formatTimeAgo(n.created_at),
          icon: iconConfig.icon,
          iconBg: iconConfig.color,
          metadata: n.metadata || {},
          jobId: n.metadata?.job_id,
          chatId: n.metadata?.conversation_id,
        };
      });
      setNotificationList(formatted);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const unreadCount = notificationList.filter(n => !n.read).length;

  const filteredNotifications = notificationList.filter(n => 
    filter === 'all' || (filter === 'unread' && !n.read)
  );

  const handleNotificationPress = async (notification: any) => {
    // Mark as read in backend
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
        setNotificationList(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }

    // Navigate based on type
    switch (notification.type) {
      case 'new_application':
      case 'job_completed':
        if (notification.jobId) {
          router.push(`/(employer)/candidates?jobId=${notification.jobId}`);
        }
        break;
      case 'message':
        if (notification.chatId) {
          router.push(`/(employer)/chat/${notification.chatId}`);
        }
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotificationList(prev => prev.map(n => ({ ...n, read: true })));
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllNotifications();
              setNotificationList([]);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear notifications');
            }
          }
        }
      ]
    );
  };

  const renderNotification = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.notificationCardUnread
      ]}
      onPress={() => handleNotificationPress(item)}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${item.iconBg}20` }]}>
        <Ionicons name={item.icon as any} size={24} color={item.iconBg} />
      </View>

      {/* Content */}
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>

      {/* Unread Indicator */}
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.employer.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleMarkAllRead}
            >
              <Ionicons name="checkmark-done" size={20} color={COLORS.employer.primary} />
            </TouchableOpacity>
          )}
          {notificationList.length > 0 && (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClearAll}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.gray[600]} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'all' && styles.filterTabActive
          ]}
          onPress={() => setFilter('all')}
        >
          <Text style={[
            styles.filterText,
            filter === 'all' && styles.filterTextActive
          ]}>
            All
          </Text>
          <View style={[
            styles.filterCount,
            filter === 'all' && styles.filterCountActive
          ]}>
            <Text style={[
              styles.filterCountText,
              filter === 'all' && styles.filterCountTextActive
            ]}>
              {notificationList.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterTab,
            filter === 'unread' && styles.filterTabActive
          ]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[
            styles.filterText,
            filter === 'unread' && styles.filterTextActive
          ]}>
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={[
              styles.filterCount,
              filter === 'unread' && styles.filterCountActive
            ]}>
              <Text style={[
                styles.filterCountText,
                filter === 'unread' && styles.filterCountTextActive
              ]}>
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.notificationsList}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.employer.primary]}
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons 
            name={filter === 'unread' ? 'checkmark-done-circle' : 'notifications-outline'} 
            size={64} 
            color={COLORS.gray[300]} 
          />
          <Text style={styles.emptyTitle}>
            {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'unread' 
              ? 'You have no unread notifications'
              : 'We\'ll notify you when something important happens'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  headerBadge: {
    backgroundColor: COLORS.employer.primary,
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  headerBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    gap: SPACING.md,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    gap: SPACING.xs,
  },
  filterTabActive: {
    backgroundColor: COLORS.employer.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[600],
  },
  filterTextActive: {
    color: COLORS.white,
  },
  filterCount: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: COLORS.employer.dark,
  },
  filterCountText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[700],
  },
  filterCountTextActive: {
    color: COLORS.white,
  },
  notificationsList: {
    padding: SPACING.lg,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  notificationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.employer.primary,
    backgroundColor: COLORS.employer.bg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  notificationTime: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.employer.primary,
    marginLeft: SPACING.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxl,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
});
