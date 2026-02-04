import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { findNearbyJobs } from '../../services/locationService';
import { searchJobs } from '../../services/jobService';
import * as Location from 'expo-location';

const jobCategories = [
  { id: 'all', name: 'All Jobs', icon: 'briefcase' as const, count: 0, color: COLORS.gray[700] },
  { id: 'painting', name: 'Painting', icon: 'brush' as const, count: 0, color: '#3b82f6' },
  { id: 'cleaning', name: 'Cleaning', icon: 'sparkles' as const, count: 0, color: '#8b5cf6' },
  { id: 'helper', name: 'Helper', icon: 'people' as const, count: 0, color: '#f59e0b' },
  { id: 'driver', name: 'Driver', icon: 'car' as const, count: 0, color: '#10b981' },
  { id: 'plumbing', name: 'Plumbing', icon: 'water' as const, count: 0, color: '#06b6d4' },
  { id: 'electrical', name: 'Electrical', icon: 'flash' as const, count: 0, color: '#eab308' },
  { id: 'carpentry', name: 'Carpentry', icon: 'construct' as const, count: 0, color: '#a16207' },
  { id: 'gardening', name: 'Gardening', icon: 'leaf' as const, count: 0, color: '#22c55e' },
  { id: 'moving', name: 'Moving', icon: 'cube' as const, count: 0, color: '#f97316' },
  { id: 'cooking', name: 'Cooking', icon: 'restaurant' as const, count: 0, color: '#ef4444' },
  { id: 'delivery', name: 'Delivery', icon: 'bicycle' as const, count: 0, color: '#6366f1' },
  { id: 'security', name: 'Security', icon: 'shield' as const, count: 0, color: '#64748b' },
  { id: 'tutoring', name: 'Tutoring', icon: 'book' as const, count: 0, color: '#a855f7' },
  { id: 'childcare', name: 'Childcare', icon: 'happy' as const, count: 0, color: '#ec4899' },
  { id: 'eldercare', name: 'Elder Care', icon: 'heart' as const, count: 0, color: '#f43f5e' },
  { id: 'petcare', name: 'Pet Care', icon: 'paw' as const, count: 0, color: '#14b8a6' },
  { id: 'laundry', name: 'Laundry', icon: 'shirt' as const, count: 0, color: '#0ea5e9' },
  { id: 'repair', name: 'Repair', icon: 'hammer' as const, count: 0, color: '#78716c' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' as const, count: 0, color: '#9ca3af' },
];

// Format time ago helper
const formatTimeAgo = (dateString: string) => {
  if (!dateString) return 'Recently';
  
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

// Format scheduled time for display
const formatScheduledTime = (startTime: string, endTime: string) => {
  if (!startTime || !endTime) return 'Flexible';
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

// Get urgency based on scheduled date
const getJobUrgency = (scheduledDate: string) => {
  if (!scheduledDate) return 'flexible';
  
  const scheduled = new Date(scheduledDate);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  scheduled.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  
  if (scheduled.getTime() === today.getTime()) return 'today';
  if (scheduled.getTime() === tomorrow.getTime()) return 'tomorrow';
  if (scheduled < today) return 'past';
  return 'upcoming';
};

// Format scheduled date for display
const formatScheduledDate = (dateString: string) => {
  if (!dateString) return 'Flexible';
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) return 'Today';
  if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
  
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function WorkerSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'distance' | 'pay' | 'rating' | 'date'>('distance');
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingJobs, setIsRefreshingJobs] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationName, setLocationName] = useState<string>('Getting location...');

  // Sort jobs based on selected criteria
  const getSortedJobs = (jobs: any[]) => {
    const sorted = [...jobs];
    switch (sortBy) {
      case 'distance':
        return sorted.sort((a, b) => {
          const distA = parseFloat(a.distance?.replace('km', '') || '999');
          const distB = parseFloat(b.distance?.replace('km', '') || '999');
          return distA - distB;
        });
      case 'pay':
        return sorted.sort((a, b) => (b.pay || 0) - (a.pay || 0)); // Highest pay first
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0)); // Highest rating first
      case 'date':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA; // Newest first
        });
      default:
        return sorted;
    }
  };

  // Get filtered jobs by category and then sorted
  const getFilteredAndSortedJobs = () => {
    let filtered = searchResults;
    if (selectedCategory !== 'all') {
      filtered = searchResults.filter(job => 
        job.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    return getSortedJobs(filtered);
  };

  const displayedJobs = getFilteredAndSortedJobs();

  useEffect(() => {
    getUserLocationAndFetchJobs();
  }, []);

  // Filter out jobs that have passed their scheduled end date and time
  const isJobExpired = (scheduledDate: string | null | undefined, scheduledEndTime: string | null | undefined): boolean => {
    // If no date or time, job is flexible/not expired
    if (!scheduledDate || !scheduledEndTime) return false;
    
    try {
      // Parse the scheduled date and end time
      const jobDate = new Date(scheduledDate);
      const [hours, minutes] = scheduledEndTime.split(':').map(Number);
      
      // Set the time on the job date
      jobDate.setHours(hours, minutes, 0, 0);
      
      // Compare with current time
      const now = new Date();
      return jobDate < now;
    } catch (error) {
      // If parsing fails, don't filter out the job
      return false;
    }
  };

  const getUserLocationAndFetchJobs = async () => {
    try {
      setIsLoading(true);
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationName('Location not available');
        setIsLoading(false);
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });

      // Get location name
      try {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address) {
          const name = address.district || address.city || address.region || 'Your Location';
          setLocationName(name);
        }
      } catch {
        setLocationName('Your Location');
      }

      // Fetch jobs near user's location
      await fetchJobsAtLocation(latitude, longitude);
    } catch (error) {
      console.error('Location error:', error);
      setLocationName('Location error');
      setIsLoading(false);
    }
  };

  // Fetch location-based jobs (default view)
  const fetchJobsAtLocation = async (latitude: number, longitude: number) => {
    try {
      setIsLoading(true);
      
      const jobs = await findNearbyJobs(latitude, longitude, 50);
      
      if (jobs && jobs.length > 0) {
        // Filter out expired jobs first
        const activeJobs = jobs.filter((job: any) => 
          !isJobExpired(job.scheduled_date, job.scheduled_end_time)
        );
        
        const formattedJobs = activeJobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: 'Employer',
          distance: job.distance_km ? `${job.distance_km.toFixed(1)}km` : (job.dist_km ? `${job.dist_km.toFixed(1)}km` : 'N/A'),
          pay: job.wage || 0,
          urgency: getJobUrgency(job.scheduled_date),
          scheduledDate: formatScheduledDate(job.scheduled_date),
          scheduledTime: formatScheduledTime(job.scheduled_start_time, job.scheduled_end_time),
          location: job.address || 'N/A',
          rating: 4.0,
          category: job.category || 'general',
          created_at: job.created_at,
          postedTime: formatTimeAgo(job.created_at)
        }));
        setSearchResults(formattedJobs);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error fetching nearby jobs:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh with current location
  const refreshNearbyJobs = () => {
    if (userLocation) {
      fetchJobsAtLocation(userLocation.latitude, userLocation.longitude);
    } else {
      getUserLocationAndFetchJobs();
    }
  };

  // Handle refresh button click - refresh based on current context
  const handleRefreshJobs = async () => {
    if (isRefreshingJobs) return;
    
    setIsRefreshingJobs(true);
    
    // If there's a search query, re-search; otherwise refresh nearby jobs
    if (searchQuery.trim()) {
      await handleSearch();
    } else {
      refreshNearbyJobs();
    }
    
    setIsRefreshingJobs(false);
  };

  // Search database when user enters a keyword
  const handleSearch = async () => {
    const query = searchQuery.trim();
    
    // If no search query, show location-based jobs
    if (!query) {
      refreshNearbyJobs();
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Search database with keyword
      const category = selectedCategory === 'all' ? undefined : selectedCategory;
      const jobs = await searchJobs(query, category);
      
      if (jobs && jobs.length > 0) {
        // Filter out expired jobs first
        const activeJobs = jobs.filter((job: any) => 
          !isJobExpired(job.scheduled_date, job.scheduled_end_time)
        );
        
        const formattedJobs = activeJobs.map((job: any) => ({
          id: job.id,
          title: job.title,
          company: 'Employer',
          distance: job.dist_km ? `${job.dist_km.toFixed(1)}km` : 'N/A',
          pay: job.wage || 0,
          urgency: getJobUrgency(job.scheduled_date),
          scheduledDate: formatScheduledDate(job.scheduled_date),
          scheduledTime: formatScheduledTime(job.scheduled_start_time, job.scheduled_end_time),
          location: job.address || 'N/A',
          rating: 4.0,
          category: job.category || 'general',
          created_at: job.created_at,
          postedTime: formatTimeAgo(job.created_at)
        }));
        setSearchResults(formattedJobs);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getUrgencyConfig = (urgency: string, scheduledDate?: string) => {
    switch (urgency) {
      case 'immediate':
        return { text: '🔥 URGENT', color: COLORS.status.error, bg: '#fef2f2' };
      case 'today':
        return { text: '📅 Today', color: COLORS.status.warning, bg: '#fef3c7' };
      case 'tomorrow':
        return { text: '📅 Tomorrow', color: COLORS.status.info, bg: '#dbeafe' };
      case 'upcoming':
        return { text: scheduledDate || 'Upcoming', color: COLORS.status.info, bg: '#dbeafe' };
      case 'flexible':
        return { text: 'Flexible', color: COLORS.gray[600], bg: COLORS.gray[100] };
      default:
        return { text: scheduledDate || 'Flexible', color: COLORS.gray[600], bg: COLORS.gray[100] };
    }
  };

  const renderCategoryChip = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Ionicons
        name={item.icon}
        size={20}
        color={selectedCategory === item.id ? COLORS.white : item.color}
      />
      <Text style={[
        styles.categoryChipText,
        selectedCategory === item.id && styles.categoryChipTextActive
      ]}>
        {item.name}
      </Text>
      <View style={[
        styles.categoryCount,
        selectedCategory === item.id && styles.categoryCountActive
      ]}>
        <Text style={[
          styles.categoryCountText,
          selectedCategory === item.id && styles.categoryCountTextActive
        ]}>
          {item.count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderJobCard = ({ item }: any) => {
    const urgency = getUrgencyConfig(item.urgency, item.scheduledDate);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push(`/(worker)/job/${item.id}`)}
        activeOpacity={0.7}
      >
        {/* Date Badge - Always show */}
        <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
          <Text style={[styles.urgencyText, { color: urgency.color }]}>
            {urgency.text}
          </Text>
        </View>

        {/* Company Logo */}
        <View style={styles.companyLogo}>
          <Text style={styles.companyInitial}>{item.company[0]}</Text>
        </View>

        {/* Job Info */}
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.company}>{item.company}</Text>

          {/* Job Meta */}
          <View style={styles.jobMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="location" size={14} color={COLORS.gray[500]} />
              <Text style={styles.metaText}>{item.distance}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.gray[500]} />
              <Text style={styles.metaText}>{item.scheduledTime || 'Flexible'}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="briefcase" size={14} color={COLORS.gray[500]} />
              <Text style={styles.metaText}>{item.category}</Text>
            </View>
          </View>

          {/* Pay */}
          <View style={styles.payContainer}>
            <Text style={styles.payAmount}>₹{item.pay}</Text>
            <Text style={styles.payPeriod}>/day</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading screen on initial load
  if (isLoading && searchResults.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Find Jobs</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              disabled
            >
              <Ionicons name="refresh-outline" size={24} color={COLORS.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterButton}
              disabled
            >
              <Ionicons name="options" size={24} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.worker.primary} />
          <Text style={styles.loadingText}>Finding jobs near you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Jobs</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefreshJobs}
            disabled={isRefreshingJobs}
          >
            <Ionicons 
              name="refresh-outline" 
              size={24} 
              color={isRefreshingJobs ? COLORS.gray[400] : COLORS.gray[700]} 
              style={isRefreshingJobs ? styles.refreshing : undefined}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={24} color={COLORS.gray[700]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Bar */}
      <View style={styles.locationBar}>
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={18} color={COLORS.worker.primary} />
          <Text style={styles.locationText}>{locationName}</Text>
        </View>
        <TouchableOpacity 
          style={styles.refreshLocationButton} 
          onPress={getUserLocationAndFetchJobs}
        >
          <Ionicons name="refresh" size={16} color={COLORS.worker.primary} />
          <Text style={styles.refreshLocationText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={COLORS.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for jobs..."
            placeholderTextColor={COLORS.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); handleSearch(); }}>
              <Ionicons name="close-circle" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 8 }}>
            <Ionicons name="arrow-forward-circle" size={28} color={COLORS.worker.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Filters */}
      {showFilters && (
        <View style={styles.filtersSection}>
          <Text style={styles.filtersTitle}>Sort By</Text>
          <View style={styles.sortButtons}>
            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'distance' && styles.sortButtonActive]}
              onPress={() => setSortBy('distance')}
            >
              <Ionicons
                name="location"
                size={16}
                color={sortBy === 'distance' ? COLORS.white : COLORS.gray[600]}
              />
              <Text style={[
                styles.sortButtonText,
                sortBy === 'distance' && styles.sortButtonTextActive
              ]}>
                Distance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'pay' && styles.sortButtonActive]}
              onPress={() => setSortBy('pay')}
            >
              <Ionicons
                name="cash"
                size={16}
                color={sortBy === 'pay' ? COLORS.white : COLORS.gray[600]}
              />
              <Text style={[
                styles.sortButtonText,
                sortBy === 'pay' && styles.sortButtonTextActive
              ]}>
                Pay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
              onPress={() => setSortBy('rating')}
            >
              <Ionicons
                name="star"
                size={16}
                color={sortBy === 'rating' ? COLORS.white : COLORS.gray[600]}
              />
              <Text style={[
                styles.sortButtonText,
                sortBy === 'rating' && styles.sortButtonTextActive
              ]}>
                Rating
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
              onPress={() => setSortBy('date')}
            >
              <Ionicons
                name="calendar"
                size={16}
                color={sortBy === 'date' ? COLORS.white : COLORS.gray[600]}
              />
              <Text style={[
                styles.sortButtonText,
                sortBy === 'date' && styles.sortButtonTextActive
              ]}>
                Newest
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Categories */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={jobCategories}
          renderItem={renderCategoryChip}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{displayedJobs.length} jobs found</Text>
        <Text style={styles.resultsSort}>Sorted by {sortBy}</Text>
      </View>

      {/* Job List */}
      <FlatList
        data={displayedJobs}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.jobsList}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color={COLORS.gray[400]} />
            <Text style={styles.emptyText}>No jobs found</Text>
            <Text style={styles.emptySubtext}>Try a different search or category</Text>
          </View>
        }
      />
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
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshing: {
    transform: [{ rotate: '180deg' }],
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  locationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[700],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  refreshLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.worker.primary,
  },
  refreshLocationText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.worker.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },  searchSection: {
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
  filtersSection: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  filtersTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.md,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    gap: SPACING.xs,
  },
  sortButtonActive: {
    backgroundColor: COLORS.worker.primary,
    borderColor: COLORS.worker.primary,
  },
  sortButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[600],
  },
  sortButtonTextActive: {
    color: COLORS.white,
  },
  categoriesSection: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  categoriesList: {
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    gap: SPACING.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.worker.primary,
    borderColor: COLORS.worker.primary,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[700],
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  categoryCount: {
    backgroundColor: COLORS.gray[100],
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryCountActive: {
    backgroundColor: COLORS.worker.dark,
  },
  categoryCountText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[600],
  },
  categoryCountTextActive: {
    color: COLORS.white,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  resultsCount: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  resultsSort: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  jobsList: {
    padding: SPACING.xl,
  },
  jobCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.md,
  },
  urgencyBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  urgencyText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.worker.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  companyInitial: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  company: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    marginBottom: SPACING.md,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: COLORS.gray[300],
    marginHorizontal: SPACING.sm,
  },
  payContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  payAmount: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.worker.primary,
  },
  payPeriod: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.worker.dark,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxxl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[600],
    marginTop: SPACING.md,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[400],
    marginTop: SPACING.xs,
  },
});