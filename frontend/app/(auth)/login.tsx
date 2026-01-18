import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState<'worker' | 'employer'>('worker');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      await login(formData.email, formData.password, userType);
      Alert.alert(
        'Login Successful',
        `Welcome back!`,
        [
          {
            text: 'Continue',
            onPress: () => {
              if (userType === 'worker') {
                router.replace('/(worker)/home');
              } else {
                router.replace('/(employer)/dashboard');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your credentials and try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.gray[900]} />
            </TouchableOpacity>
          </View>

          {/* Logo & Welcome */}
          <View style={styles.welcomeSection}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>👋</Text>
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          {/* User Type Selection */}
          <View style={styles.userTypeSection}>
            <Text style={styles.sectionLabel}>I am a:</Text>
            <View style={styles.userTypeToggle}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'worker' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('worker')}
              >
                <Ionicons
                  name="person"
                  size={20}
                  color={userType === 'worker' ? COLORS.white : COLORS.gray[600]}
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'worker' && styles.userTypeTextActive
                ]}>
                  Worker
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'employer' && styles.userTypeButtonActive
                ]}
                onPress={() => setUserType('employer')}
              >
                <Ionicons
                  name="briefcase"
                  size={20}
                  color={userType === 'employer' ? COLORS.white : COLORS.gray[600]}
                />
                <Text style={[
                  styles.userTypeText,
                  userType === 'employer' && styles.userTypeTextActive
                ]}>
                  Employer
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.gray[400]}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={COLORS.gray[400]}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: userType === 'worker' ? COLORS.worker.primary : COLORS.employer.primary }
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Signing In...</Text>
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Login */}
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#dc2626" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#1877f2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color={COLORS.gray[900]} />
            </TouchableOpacity>
          </View>

          {/* Register Link */}
          <View style={styles.registerSection}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
              <Text style={[
                styles.registerLink,
                { color: userType === 'worker' ? COLORS.worker.primary : COLORS.employer.primary }
              ]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
  },
  header: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    fontSize: 48,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[500],
  },
  userTypeSection: {
    marginBottom: SPACING.xl,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.md,
  },
  userTypeToggle: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  userTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.gray[200],
    backgroundColor: COLORS.white,
    gap: SPACING.sm,
  },
  userTypeButtonActive: {
    borderColor: COLORS.worker.primary,
    backgroundColor: COLORS.worker.primary,
  },
  userTypeText: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[600],
  },
  userTypeTextActive: {
    color: COLORS.white,
  },
  form: {
    marginBottom: SPACING.xl,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[700],
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
    marginLeft: SPACING.md,
    minHeight: 20,
  },
  eyeIcon: {
    padding: SPACING.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.worker.primary,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  loginButtonText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xxl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[200],
  },
  dividerText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    marginHorizontal: SPACING.lg,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[50],
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  registerText: {
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[600],
  },
  registerLink: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
});