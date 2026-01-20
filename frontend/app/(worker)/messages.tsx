import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  StatusBar,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { getConversations } from '../../services/messageService';

// Format time ago
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
};

export default function WorkerMessages() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      const formatted = data.map((conv: any) => {
        const otherUser = conv.other_user;
        // For employers, prefer company_name, fall back to name
        // For workers, use name directly
        let name = 'Unknown';
        if (otherUser) {
          if (conv.other_user_role === 'EMPLOYER') {
            name = otherUser.company_name || otherUser.name || 'Employer';
          } else {
            name = otherUser.name || 'Worker';
          }
        }
        return {
          id: conv.id,
          name: name,
          avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          role: conv.other_user_role === 'EMPLOYER' ? 'Employer' : 'Worker',
          jobTitle: conv.job?.title || 'General',
          lastMessage: conv.last_message || 'No messages yet',
          time: formatTimeAgo(conv.last_message_at || conv.created_at),
          unread: conv.unread_count || 0,
          online: false,
        };
      });
      setConversations(formatted);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'unread' && conv.unread > 0);
    return matchesSearch && matchesFilter;
  });

  const unreadCount = conversations.filter(c => c.unread > 0).length;

  const renderConversation = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.conversationCard,
        item.unread > 0 && styles.conversationCardUnread
      ]}
      onPress={() => router.push(`/(worker)/chat/${item.id}`)}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[
          styles.avatar,
          item.unread > 0 && styles.avatarUnread
        ]}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        {item.online && <View style={styles.onlineIndicator} />}
      </View>

      {/* Content */}
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.role}</Text>
            </View>
          </View>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <Text style={styles.jobTitle} numberOfLines={1}>{item.jobTitle}</Text>

        <View style={styles.messageRow}>
          <Text 
            style={[
              styles.lastMessage,
              item.unread > 0 && styles.lastMessageUnread
            ]} 
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
          {item.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.worker.primary} />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
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
              {conversations.length}
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

      {/* Conversations List */}
      {filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.conversationsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.gray[300]} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No conversations found' : 'No messages yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? 'Try searching for something else'
              : 'Start applying for jobs to chat with employers'}
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
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  headerBadge: {
    backgroundColor: COLORS.worker.primary,
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
  searchSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
    marginLeft: SPACING.md,
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
    backgroundColor: COLORS.worker.primary,
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
    backgroundColor: COLORS.worker.dark,
  },
  filterCountText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[700],
  },
  filterCountTextActive: {
    color: COLORS.white,
  },
  conversationsList: {
    padding: SPACING.lg,
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  conversationCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.worker.primary,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUnread: {
    backgroundColor: COLORS.worker.light,
  },
  avatarText: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[600],
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.status.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  name: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  roleBadge: {
    backgroundColor: COLORS.employer.bg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  roleText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.employer.primary,
  },
  time: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
  },
  messageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  lastMessageUnread: {
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
  },
  unreadBadge: {
    backgroundColor: COLORS.worker.primary,
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  unreadCount: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
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