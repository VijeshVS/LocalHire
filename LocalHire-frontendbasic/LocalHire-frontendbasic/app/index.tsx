import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function LandingPage() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
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

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Content Container */}
      <View style={styles.content}>
        {/* Header Section */}
        <Animated.View 
          style={[
            styles.headerSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Minimal Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Ionicons name="business-outline" size={40} color={COLORS.worker.primary} />
            </View>
          </View>

          {/* Brand */}
          <Text style={styles.brandName}>LocalHire</Text>
          <Text style={styles.brandSubtitle}>Professional Workforce Solutions</Text>

          {/* Subtle Stats */}
          <View style={styles.statsRow}>
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNumber}>1000+</Text>
              <Text style={styles.miniStatLabel}>Workers</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNumber}>500+</Text>
              <Text style={styles.miniStatLabel}>Jobs Daily</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.miniStat}>
              <Text style={styles.miniStatNumber}>4.8★</Text>
              <Text style={styles.miniStatLabel}>Rating</Text>
            </View>
          </View>
        </Animated.View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.mainSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Value Proposition */}
          <View style={styles.valueSection}>
            <Text style={styles.valueTitle}>Connect with Local Opportunities</Text>
            <Text style={styles.valueDescription}>
              Streamlined platform for professional workforce management and local job discovery
            </Text>
          </View>

          {/* Role Selection */}
          <View style={styles.roleSection}>
            <Text style={styles.roleSectionLabel}>Select Your Role</Text>
            
            {/* Worker Option */}
            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => router.push('/(worker)/home')}
              activeOpacity={0.7}
            >
              <View style={styles.roleIconWrapper}>
                <Ionicons name="person-outline" size={22} color={COLORS.worker.primary} />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Worker</Text>
                <Text style={styles.roleDesc}>Access job opportunities</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>

            {/* Employer Option */}
            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => router.push('/(employer)/dashboard')}
              activeOpacity={0.7}
            >
              <View style={[styles.roleIconWrapper, { backgroundColor: COLORS.employer.bg }]}>
                <Ionicons name="briefcase-outline" size={22} color={COLORS.employer.primary} />
              </View>
              <View style={styles.roleContent}>
                <Text style={styles.roleTitle}>Employer</Text>
                <Text style={styles.roleDesc}>Hire qualified workers</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.gray[400]} />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          {/* Features */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color={COLORS.gray[600]} />
              <Text style={styles.featureText}>Verified Profiles</Text>
            </View>
            <View style={styles.featureDot} />
            <View style={styles.featureItem}>
              <Ionicons name="flash-outline" size={16} color={COLORS.gray[600]} />
              <Text style={styles.featureText}>Instant Matching</Text>
            </View>
            <View style={styles.featureDot} />
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed-outline" size={16} color={COLORS.gray[600]} />
              <Text style={styles.featureText}>Secure Payments</Text>
            </View>
          </View>
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
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    fontWeight: TYPOGRAPHY.weights.medium,
    marginBottom: SPACING.xl,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  miniStat: {
    alignItems: 'center',
  },
  miniStatNumber: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  miniStatLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    marginTop: 2,
  },
  statSeparator: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.gray[300],
    marginHorizontal: SPACING.lg,
  },
  mainSection: {
    flex: 1,
  },
  valueSection: {
    marginBottom: SPACING.xxl,
  },
  valueTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
    lineHeight: 28,
  },
  valueDescription: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
    lineHeight: 22,
  },
  roleSection: {
    marginBottom: SPACING.xxl,
  },
  roleSectionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  roleIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.worker.bg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
  },
  actionSection: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  primaryButton: {
    backgroundColor: COLORS.worker.primary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  primaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  secondaryButton: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.gray[300],
  },
  secondaryButtonText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  featuresList: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featureText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[600],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  featureDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.gray[400],
    marginHorizontal: SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  footerLink: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  footerDivider: {
    marginHorizontal: SPACING.md,
    color: COLORS.gray[400],
    fontSize: TYPOGRAPHY.sizes.xs,
  },
});