import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  StyleSheet,
  Switch,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

const nearbyJobs = [
  { 
    id: '1', 
    title: 'Painter', 
    distance: '500m', 
    pay: '₹800/day', 
    urgency: 'Immediate',
    location: 'Koramangala',
    rating: 4.5,
    company: 'Home Decor Co.'
  },
  { 
    id: '2', 
    title: 'Helper', 
    distance: '1.2km', 
    pay: '₹600/day', 
    urgency: 'Today',
    location: 'BTM Layout',
    rating: 4.2,
    company: 'Quick Fix Services'
  },
  { 
    id: '3', 
    title: 'Cleaner', 
    distance: '800m', 
    pay: '₹500/day', 
    urgency: 'Tomorrow',
    location: 'Jayanagar',
    rating: 4.8,
    company: 'Clean Pro'
  },
  { 
    id: '4', 
    title: 'Driver', 
    distance: '2.1km', 
    pay: '₹1000/day', 
    urgency: 'This Week',
    location: 'Electronic City',
    rating: 4.3,
    company: 'Logistics Hub'
  },
];

export default function WorkerHome() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    if (!isListening) {
      startPulse();
    }
  }, [isListening]);

  const handleVoiceSearch = () => {
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      setIsListening(false);
      console.log('Voice search completed');
    }, 3000);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Immediate': return { bg: '#fee2e2', text: '#dc2626' };
      case 'Today': return { bg: '#fef3c7', text: '#d97706' };
      case 'Tomorrow': return { bg: '#dcfce7', text: '#16a34a' };
      default: return { bg: '#e0e7ff', text: '#4f46e5' };
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={12}
          color="#fbbf24"
        />
      );
    }
    return stars;
  };

  const renderJobCard = ({ item }: { item: typeof nearbyJobs[0] }) => {
    const urgencyColors = getUrgencyColor(item.urgency);
    
    return (
      <TouchableOpacity
        onPress={() => router.push(`/(worker)/job/${item.id}`)}
        style={styles.jobCard}
      >
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleContainer}>
            <Text style={styles.jobTitle}>{item.title}</Text>
            <Text style={styles.jobCompany}>{item.company}</Text>
          </View>
          <View style={[styles.urgencyBadge, { backgroundColor: urgencyColors.bg }]}>
            <Text style={[styles.urgencyText, { color: urgencyColors.text }]}>
              {item.urgency}
            </Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          <View style={styles.jobDetailItem}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.jobDetailText}>{item.location} • {item.distance}</Text>
          </View>
          
          <View style={styles.jobDetailItem}>
            <Ionicons name="wallet-outline" size={16} color="#16a34a" />
            <Text style={[styles.jobDetailText, { color: '#16a34a', fontWeight: '600' }]}>
              {item.pay}
            </Text>
          </View>
        </View>

        <View style={styles.jobFooter}>
          <View style={styles.ratingContainer}>
            {renderStars(item.rating)}
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <TouchableOpacity style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Quick Apply</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Header */}
      <View style={styles.statusHeader}>
        <View>
          <Text style={styles.greetingText}>Good Morning! 👋</Text>
          <Text style={styles.statusText}>
            {isAvailable ? 'You are available for work' : 'You are currently busy'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ false: '#f3f4f6', true: '#10b981' }}
          thumbColor={isAvailable ? '#ffffff' : '#9ca3af'}
          ios_backgroundColor="#f3f4f6"
        />
      </View>

      <View style={styles.content}>
        {/* Voice Search Section */}
        <View style={styles.voiceSection}>
          <Text style={styles.sectionTitle}>Find Work with Voice</Text>
          
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              onPress={handleVoiceSearch}
              style={[
                styles.micButton,
                isListening && styles.micButtonListening
              ]}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isListening ? "radio-outline" : "mic"} 
                size={60} 
                color="white" 
              />
            </TouchableOpacity>
          </Animated.View>

          <Text style={styles.micLabel}>
            {isListening ? 'Listening...' : 'Tap to speak'}
          </Text>
          <Text style={styles.micSubLabel}>
            Say "Find painter job" or "Work near me"
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="search-outline" size={24} color="#2563eb" />
              <Text style={styles.quickActionText}>Search Jobs</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="location-outline" size={24} color="#2563eb" />
              <Text style={styles.quickActionText}>Nearby</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="time-outline" size={24} color="#2563eb" />
              <Text style={styles.quickActionText}>Urgent</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Jobs List */}
        <View style={styles.jobsContainer}>
          <View style={styles.jobsHeader}>
            <Text style={styles.sectionTitle}>Jobs Near You</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={nearbyJobs}
            renderItem={renderJobCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.jobsList}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#6b7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
  },
  micButton: {
    backgroundColor: '#2563eb',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonListening: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  micLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  micSubLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  quickActionsContainer: {
    marginBottom: 30,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 60) / 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
  },
  jobsContainer: {
    flex: 1,
  },
  jobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
  jobsList: {
    paddingBottom: 20,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 2,
  },
  jobCompany: {
    fontSize: 14,
    color: '#6b7280',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  jobDetails: {
    marginBottom: 12,
  },
  jobDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  jobDetailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 6,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  applyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});