import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  TextInput,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

const { width } = Dimensions.get('window');

const jobCategories = [
  { id: '1', name: 'All', icon: 'briefcase', count: 45 },
  { id: '2', name: 'Painting', icon: 'brush', count: 12 },
  { id: '3', name: 'Cleaning', icon: 'sparkles', count: 18 },
  { id: '4', name: 'Helper', icon: 'people', count: 8 },
  { id: '5', name: 'Driver', icon: 'car', count: 7 },
];

const suggestedSearches = [
  'House painting',
  'Office cleaning',
  'Moving helper',
  'Part-time driver',
  'Kitchen helper',
  'Garden maintenance',
];

const recentSearches = [
  'Painter jobs near me',
  'Daily wage cleaning',
  'Helper work today',
];

const searchResults = [
  {
    id: '1',
    title: 'House Painter Required',
    company: 'Home Solutions',
    location: 'BTM Layout, 1.2 km',
    pay: '₹800/day',
    urgency: 'Today',
    type: 'Full Time',
    posted: '2 hours ago',
  },
  {
    id: '2',
    title: 'Office Cleaning Staff',
    company: 'Tech Park',
    location: 'Electronic City, 2.5 km',
    pay: '₹600/day',
    urgency: 'Tomorrow',
    type: 'Part Time',
    posted: '4 hours ago',
  },
  {
    id: '3',
    title: 'Moving Helper Needed',
    company: 'Relocate Easy',
    location: 'Koramangala, 0.8 km',
    pay: '₹700/day',
    urgency: 'This Week',
    type: 'Temporary',
    posted: '1 day ago',
  },
];

export default function JobSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleVoiceSearch = () => {
    setIsVoiceSearching(true);
    
    setTimeout(() => {
      const voiceQueries = [
        'Find painting jobs near me',
        'Show cleaning work today',
        'Helper jobs in Koramangala',
        'Part time driver work',
      ];
      
      const randomQuery = voiceQueries[Math.floor(Math.random() * voiceQueries.length)];
      setSearchQuery(randomQuery);
      setIsVoiceSearching(false);
      setShowResults(true);
    }, 2000);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setShowResults(true);
  };

  const renderCategoryItem = ({ item }: { item: typeof jobCategories[0] }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item.id && styles.selectedCategoryItem
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Icon 
        name={item.icon} 
        size={20} 
        color={selectedCategory === item.id ? '#2563eb' : '#6b7280'} 
      />
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
      <Text style={styles.categoryCount}>({item.count})</Text>
    </TouchableOpacity>
  );

  const renderJobResult = ({ item }: { item: typeof searchResults[0] }) => (
    <TouchableOpacity 
      style={styles.jobCard}
      onPress={() => router.push(`/(worker)/job/${item.id}`)}
    >
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobCompany}>{item.company}</Text>
      </View>
      
      <View style={styles.jobDetails}>
        <View style={styles.jobDetailItem}>
          <Icon name="location" size={16} color="#6b7280" />
          <Text style={styles.jobDetailText}>{item.location}</Text>
        </View>
        <View style={styles.jobDetailItem}>
          <Icon name="wallet" size={16} color="#16a34a" />
          <Text style={styles.jobDetailText}>{item.pay}</Text>
        </View>
      </View>
      
      <View style={styles.jobFooter}>
        <View style={styles.jobTags}>
          <View style={[styles.urgencyTag, getUrgencyStyle(item.urgency)]}>
            <Text style={[styles.urgencyText, getUrgencyTextStyle(item.urgency)]}>
              {item.urgency}
            </Text>
          </View>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>{item.type}</Text>
          </View>
        </View>
        <Text style={styles.postedTime}>{item.posted}</Text>
      </View>
    </TouchableOpacity>
  );

  const getUrgencyStyle = (urgency: string) => {
    switch (urgency) {
      case 'Today': return { backgroundColor: '#fee2e2' };
      case 'Tomorrow': return { backgroundColor: '#fef3c7' };
      default: return { backgroundColor: '#dcfce7' };
    }
  };

  const getUrgencyTextStyle = (urgency: string) => {
    switch (urgency) {
      case 'Today': return { color: '#dc2626' };
      case 'Tomorrow': return { color: '#d97706' };
      default: return { color: '#16a34a' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Jobs</Text>
        <TouchableOpacity>
          <Icon name="filter" size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.voiceButton, isVoiceSearching && styles.voiceButtonActive]}
          onPress={handleVoiceSearch}
        >
          <Icon 
            name={isVoiceSearching ? 'volume' : 'mic'} 
            size={20} 
            color={isVoiceSearching ? '#dc2626' : '#2563eb'} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!showResults ? (
          <>
            {/* Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <FlatList
                data={jobCategories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesList}
              />
            </View>

            {/* Quick Searches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Popular Searches</Text>
              <View style={styles.quickSearches}>
                {suggestedSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickSearchItem}
                    onPress={() => handleSearch(search)}
                  >
                    <Text style={styles.quickSearchText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.recentSearchItem}
                    onPress={() => handleSearch(search)}
                  >
                    <Icon name="time" size={16} color="#9ca3af" />
                    <Text style={styles.recentSearchText}>{search}</Text>
                    <TouchableOpacity>
                      <Icon name="close" size={16} color="#9ca3af" />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : (
          /* Search Results */
          <View style={styles.section}>
            <View style={styles.resultsHeader}>
              <Text style={styles.sectionTitle}>
                Found {searchResults.length} jobs for "{searchQuery}"
              </Text>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Text style={styles.clearResults}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={searchResults}
              renderItem={renderJobResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Search Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Search Tips</Text>
          <View style={styles.tip}>
            <Icon name="bulb" size={16} color="#f59e0b" />
            <Text style={styles.tipText}>Use voice search for faster results</Text>
          </View>
          <View style={styles.tip}>
            <Icon name="location" size={16} color="#f59e0b" />
            <Text style={styles.tipText}>Enable location for nearby jobs</Text>
          </View>
          <View style={styles.tip}>
            <Icon name="star" size={16} color="#f59e0b" />
            <Text style={styles.tipText}>Save searches for quick access</Text>
          </View>
        </View>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  voiceButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#fee2e2',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedCategoryItem: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 4,
  },
  selectedCategoryText: {
    color: '#2563eb',
  },
  categoryCount: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickSearchItem: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  quickSearchText: {
    fontSize: 14,
    color: '#374151',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearResults: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  jobHeader: {
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  jobCompany: {
    fontSize: 14,
    color: '#6b7280',
  },
  jobDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#6b7280',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTags: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typeTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  postedTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  tipsSection: {
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#92400e',
  },
});