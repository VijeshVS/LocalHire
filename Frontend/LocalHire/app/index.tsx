import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../components/Icon';

const { width, height } = Dimensions.get('window');

export default function LandingPage() {
  const insets = useSafeAreaInsets();
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');

  const handleVoiceHelp = () => {
    setIsListening(true);
    
    // Simulate voice recognition
    setTimeout(() => {
      const responses = [
        "I can help you find work near you. Choose 'Looking for Work' to browse jobs or 'Need Workers' to post a job.",
        "Welcome to ELL! Say 'find work' to look for jobs or 'hire workers' to post a job requirement.",
        "Hi! I'm here to help. For job seekers, tap 'Looking for Work'. For employers, tap 'Need Workers'."
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setVoiceText(randomResponse);
      setIsListening(false);
      
      // Clear voice text after 5 seconds
      setTimeout(() => setVoiceText(''), 5000);
    }, 2000);
  };

  const navigateToWorker = () => {
    router.push('/(worker)/home');
  };

  const navigateToEmployer = () => {
    router.push('/(employer)/dashboard');
  };

  const navigateToAuth = (type: 'login' | 'signup') => {
    router.push(`/(auth)/${type}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ELL</Text>
          <Text style={styles.tagline}>Hyperlocal Job Market</Text>
          
          {/* Auth Buttons */}
          <View style={styles.authButtons}>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => navigateToAuth('login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => navigateToAuth('signup')}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Voice Assistant */}
        <View style={styles.voiceSection}>
          <TouchableOpacity 
            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
            onPress={handleVoiceHelp}
            disabled={isListening}
          >
            <Icon 
              name={isListening ? 'volume' : 'mic'} 
              size={40} 
              color={isListening ? '#dc2626' : '#2563eb'} 
            />
            <Text style={[styles.voiceButtonText, isListening && styles.voiceButtonTextActive]}>
              {isListening ? 'Listening...' : 'Tap for Voice Help'}
            </Text>
          </TouchableOpacity>
          
          {voiceText ? (
            <View style={styles.voiceResponse}>
              <Text style={styles.voiceResponseText}>{voiceText}</Text>
            </View>
          ) : null}
        </View>

        {/* Demo Mode Notice */}
        <View style={styles.demoNotice}>
          <Icon name="info" size={20} color="#2563eb" />
          <Text style={styles.demoText}>
            Demo Mode - No registration required. Choose a role to explore!
          </Text>
        </View>

        {/* Role Selection */}
        <View style={styles.roleSelection}>
          <Text style={styles.selectionTitle}>Choose your role:</Text>
          
          {/* Worker Card */}
          <TouchableOpacity style={styles.roleCard} onPress={navigateToWorker}>
            <View style={styles.roleIcon}>
              <Icon name="person" size={48} color="#2563eb" />
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Looking for Work</Text>
              <Text style={styles.roleDescription}>
                Find jobs near you - painting, cleaning, driving, and more
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.feature}>
                  <Icon name="location" size={16} color="#16a34a" />
                  <Text style={styles.featureText}>Nearby jobs</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="wallet" size={16} color="#16a34a" />
                  <Text style={styles.featureText}>Instant payments</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="mic" size={16} color="#16a34a" />
                  <Text style={styles.featureText}>Voice search</Text>
                </View>
              </View>
            </View>
            <Icon name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>

          {/* Employer Card */}
          <TouchableOpacity style={styles.roleCard} onPress={navigateToEmployer}>
            <View style={styles.roleIcon}>
              <Icon name="briefcase" size={48} color="#7c3aed" />
            </View>
            <View style={styles.roleContent}>
              <Text style={styles.roleTitle}>Need Workers</Text>
              <Text style={styles.roleDescription}>
                Hire skilled workers for your tasks quickly and reliably
              </Text>
              <View style={styles.roleFeatures}>
                <View style={styles.feature}>
                  <Icon name="time" size={16} color="#16a34a" />
                  <Text style={styles.featureText}>Quick hiring</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="star" size={16} color="#16a34a" />
                  <Text style={styles.featureText}>Verified workers</Text>
                </View>
                <View style={styles.feature}>
                  <Icon name="shield" size={16} color="#16a34a" />
                  <Text style={styles.featureText}>Secure platform</Text>
                </View>
              </View>
            </View>
            <Icon name="chevron-forward" size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>1000+</Text>
            <Text style={styles.statLabel}>Active Workers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>500+</Text>
            <Text style={styles.statLabel}>Jobs Posted</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>4.8★</Text>
            <Text style={styles.statLabel}>Average Rating</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={styles.footerSeparator}>•</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Terms of Service</Text>
        </TouchableOpacity>
        <Text style={styles.footerSeparator}>•</Text>
        <TouchableOpacity>
          <Text style={styles.footerLink}>Support</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: '#1f2937',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 20,
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#dbeafe',
  },
  voiceButtonActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  voiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
    marginLeft: 12,
  },
  voiceButtonTextActive: {
    color: '#dc2626',
  },
  voiceResponse: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#bae6fd',
    maxWidth: width - 40,
  },
  voiceResponseText: {
    fontSize: 14,
    color: '#1e40af',
    textAlign: 'center',
    lineHeight: 20,
  },
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  demoText: {
    fontSize: 14,
    color: '#2563eb',
    flex: 1,
    lineHeight: 20,
  },
  roleSelection: {
    flex: 1,
    justifyContent: 'center',
  },
  selectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  roleIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  roleFeatures: {
    gap: 6,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 12,
    color: '#16a34a',
    marginLeft: 6,
    fontWeight: '500',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    gap: 8,
  },
  footerLink: {
    fontSize: 12,
    color: '#6b7280',
  },
  footerSeparator: {
    fontSize: 12,
    color: '#d1d5db',
  },
});