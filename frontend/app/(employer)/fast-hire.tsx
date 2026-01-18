import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FastHireWorker {
  id: string;
  name: string;
  email: string;
  phone: string;
  rating: number | null;
  status: string;
  address: string;
  language: string;
  user_type: string;
  distance_m?: number;
  years_of_experience?: number;
}

export default function FastHireScreen() {
  const [prompt, setPrompt] = useState('');
  const [workers, setWorkers] = useState<FastHireWorker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const samplePrompts = [
    'i need workers who speak kannada',
    'i need workers who are proficient in plumbing job',
    'i need workers who can speak kannada and is an electrician',
  ];

  const parseWorkers = (payload: unknown): FastHireWorker[] => {
    if (!payload) return [];

    if (typeof payload === 'string') {
      return JSON.parse(payload);
    }

    if (Array.isArray(payload)) {
      return payload as FastHireWorker[];
    }

    throw new Error('Unexpected response format');
  };

  const handleSearch = async () => {
    if (!prompt.trim()) {
      setError('Please enter what you need help with.');
      return;
    }

    setIsLoading(true);
    setError(null);
    const YOUR_MACHINE_IP = '172.20.10.14';
    const userId = await AsyncStorage.getItem('user_id');

    try {
      const response = await fetch(`http://${YOUR_MACHINE_IP}:8000/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: prompt.trim(), user_id: userId }),
      });

      const data = await response.json();
      const parsedWorkers = parseWorkers((data as any)?.result);
      setWorkers(parsedWorkers);
      setHasSearched(true);
      setPrompt('');
    } catch (err: any) {
      const message = err?.message || 'Unable to fetch FastHire matches.';
      setError(message);
      setWorkers([]);
      setHasSearched(false);
    } finally {
      setIsLoading(false);
    }
  };

  const renderWorkerCard = (worker: FastHireWorker) => (
    <View key={worker.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.workerName}>{worker.name}</Text>
          <Text style={styles.workerMeta}>{worker.language} • {worker.user_type}</Text>
        </View>
        <View style={styles.ratingPill}>
          <Ionicons name="star" size={14} color={COLORS.status.warning} />
          <Text style={styles.ratingText}>{worker.rating ?? 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="briefcase-outline" size={16} color={COLORS.gray[500]} />
        <Text style={styles.infoText}>{worker.years_of_experience ?? 0} yrs experience</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={16} color={COLORS.gray[500]} />
        <Text style={styles.infoText}>{worker.address || 'No address provided'}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={16} color={COLORS.gray[500]} />
        <Text style={styles.infoText}>{worker.phone}</Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons name="mail-outline" size={16} color={COLORS.gray[500]} />
        <Text style={styles.infoText}>{worker.email}</Text>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.worker.light }]}>
          <Text style={[styles.statusText, { color: COLORS.worker.primary }]}>{worker.status}</Text>
        </View>
        {typeof worker.distance_m === 'number' && (
          <Text style={styles.distanceText}>{(worker.distance_m / 1000).toFixed(1)} km away</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={COLORS.gray[800]} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>FastHire</Text>
          <Text style={styles.subtitle}>Describe your need, get ready-to-hire matches.</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputCard}>
          <Text style={styles.label}>What do you need?</Text>
          <View style={styles.promptChips}>
            {samplePrompts.map((text) => (
              <TouchableOpacity
                key={text}
                style={styles.chip}
                onPress={() => setPrompt(text)}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="E.g. Need a Kannada-speaking housekeeper for 3 days starting tomorrow"
            placeholderTextColor={COLORS.gray[400]}
            multiline
            style={styles.textInput}
          />
          <TouchableOpacity
            style={[styles.ctaButton, isLoading && { opacity: 0.8 }]}
            onPress={handleSearch}
            activeOpacity={0.85}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="flash" size={18} color={COLORS.white} />
                <Text style={styles.ctaText}>Get FastHire Matches</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={COLORS.status.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {isLoading && workers.length === 0 && !error && (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="large" color={COLORS.employer.primary} />
            <Text style={styles.loadingText}>Finding your matches...</Text>
          </View>
        )}

        {!isLoading && workers.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={42} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>{hasSearched ? 'No available workers' : 'No suggestions yet'}</Text>
            <Text style={styles.emptySubtitle}>
              {hasSearched
                ? 'We could not find workers for that prompt right now. Try tweaking your request.'
                : 'Enter a prompt above or use a sample to see workers tailored to your need.'}
            </Text>
          </View>
        )}

        <View style={styles.cardList}>
          {workers.map(renderWorkerCard)}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  promptChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.employer.bg,
    borderWidth: 1,
    borderColor: COLORS.employer.light,
  },
  chipText: {
    color: COLORS.employer.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.xl,
  },
  inputCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[600],
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  textInput: {
    minHeight: 120,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.gray[200],
    padding: SPACING.lg,
    fontSize: TYPOGRAPHY.sizes.base,
    color: COLORS.gray[900],
    backgroundColor: COLORS.gray[50],
    textAlignVertical: 'top',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.employer.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  ctaText: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.base,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.status.error + '10',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.status.error + '30',
  },
  errorText: {
    color: COLORS.status.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    flex: 1,
  },
  loadingBlock: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  loadingText: {
    marginTop: SPACING.sm,
    color: COLORS.gray[600],
  },
  emptyState: {
    backgroundColor: COLORS.white,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[800],
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
  },
  cardList: {
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: SPACING.sm,
    ...SHADOWS.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerName: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  workerMeta: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    marginTop: 4,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.employer.bg,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
  },
  ratingText: {
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.employer.primary,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  infoText: {
    color: COLORS.gray[700],
    fontSize: TYPOGRAPHY.sizes.base,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  statusBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.lg,
  },
  statusText: {
    fontWeight: TYPOGRAPHY.weights.semibold,
    fontSize: TYPOGRAPHY.sizes.sm,
  },
  distanceText: {
    color: COLORS.gray[500],
    fontSize: TYPOGRAPHY.sizes.sm,
  },
});
