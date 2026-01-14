import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';

export default function LandingPage() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [authAction, setAuthAction] = useState<'login' | 'register'>('login');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleAuthPress = (action: 'login' | 'register') => {
    setAuthAction(action);
    setShowRoleModal(true);
  };

  const handleRoleSelect = (role: 'worker' | 'employer') => {
    setShowRoleModal(false);
    if (authAction === 'login') {
      router.push({
        pathname: '/(auth)/login',
        params: { role }
      });
    } else {
      router.push({
        pathname: '/(auth)/register',
        params: { role }
      });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <View style={styles.content}>
        {/* Logo Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="business-outline" size={48} color={COLORS.worker.primary} />
            </View>
          </View>

          <Text style={styles.brandName}>LocalHire</Text>
          <Text style={styles.tagline}>Find local jobs. Hire local talent.</Text>
        </Animated.View>

        {/* Welcome Message */}
        <Animated.View 
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <Text style={styles.welcomeTitle}>Welcome!</Text>
          <Text style={styles.welcomeSubtitle}>
            Connect with opportunities in your neighborhood
          </Text>
        </Animated.View>

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionSection,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => handleAuthPress('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => handleAuthPress('register')}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryButtonText}>Create Account</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>•</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Support</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Role Selection Modal */}
      <Modal
        visible={showRoleModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {authAction === 'login' ? 'Sign in as' : 'Create account as'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowRoleModal(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.gray[600]} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choose your role to continue</Text>

            {/* Worker Option */}
            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => handleRoleSelect('worker')}
              activeOpacity={0.7}
            >
              <View style={[styles.roleIconWrapper, { backgroundColor: COLORS.worker.bg }]}>
                <Ionicons name="person-outline" size={28} color={COLORS.worker.primary} />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Worker</Text>
                <Text style={styles.roleDesc}>Find jobs near you</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.gray[400]} />
            </TouchableOpacity>

            {/* Employer Option */}
            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => handleRoleSelect('employer')}
              activeOpacity={0.7}
            >
              <View style={[styles.roleIconWrapper, { backgroundColor: COLORS.employer.bg }]}>
                <Ionicons name="briefcase-outline" size={28} color={COLORS.employer.primary} />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Employer</Text>
                <Text style={styles.roleDesc}>Hire local workers</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  headerSection: {
    alignItems: 'center',
    paddingTop: SPACING.xxl * 2,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 36,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[500],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: SPACING.xxl * 2,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
  },
  welcomeSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  spacer: {
    flex: 1,
  },
  actionSection: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.worker.primary,
    paddingVertical: SPACING.lg + 2,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg + 2,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gray[300],
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  footerLink: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  footerDivider: {
    marginHorizontal: SPACING.md,
    color: COLORS.gray[400],
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl + SPACING.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[500],
    marginBottom: SPACING.xl,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  roleIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  roleDesc: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
});