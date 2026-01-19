import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../../components/Icon';
import { getEmployerAnalytics } from '../../services/analyticsService';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../constants/theme';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  overview: {
    totalJobs: number;
    activeJobs: number;
    completedJobs: number;
    totalSpent: number;
    totalApplications: number;
    totalHires: number;
    completedHires: number;
    inProgressHires: number;
    avgJobCompletion: number;
  };
  applications: {
    total: number;
    accepted: number;
    shortlisted: number;
    rejected: number;
    pending: number;
    completed: number;
    inProgress: number;
  };
  monthlyStats: {
    month: string;
    year: number;
    jobs: number;
    spent: number;
    completed: number;
  }[];
}

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalSpent: 0,
      totalApplications: 0,
      totalHires: 0,
      completedHires: 0,
      inProgressHires: 0,
      avgJobCompletion: 0,
    },
    applications: {
      total: 0,
      accepted: 0,
      shortlisted: 0,
      rejected: 0,
      pending: 0,
      completed: 0,
      inProgress: 0,
    },
    monthlyStats: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEmployerAnalytics();
      if (data) {
        setAnalyticsData(data);
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      setError(error?.message || 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnalytics();
    setIsRefreshing(false);
  };

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'bar-chart' },
    { key: 'jobs', label: 'Jobs', icon: 'briefcase' },
    { key: 'spending', label: 'Spending', icon: 'cash' },
    { key: 'workers', label: 'Workers', icon: 'people' },
  ];

  const renderOverviewCard = (title: string, value: string, subtitle?: string, icon?: string, color = COLORS.employer.primary, bgColor = COLORS.employer.bg) => (
    <View style={[styles.overviewCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <View style={styles.overviewHeader}>
        <View style={[styles.overviewIconBg, { backgroundColor: bgColor }]}>
          {icon && <Icon name={icon} size={18} color={color} />}
        </View>
      </View>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewTitle}>{title}</Text>
      {subtitle && <Text style={styles.overviewSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderStatCard = (title: string, value: number, icon: string, color: string, bgColor: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: bgColor }]}>
        <Icon name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statCardValue, { color }]}>{value}</Text>
      <Text style={styles.statCardLabel}>{title}</Text>
    </View>
  );

  const renderChart = () => {
    const maxSpent = analyticsData.monthlyStats.length > 0 
      ? Math.max(...analyticsData.monthlyStats.map(s => s.spent), 1) 
      : 1;
    
    return (
      <View style={styles.chart}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
          <Text style={styles.chartSubtitle}>Last 6 months</Text>
        </View>
        <View style={styles.chartContainer}>
          {analyticsData.monthlyStats.map((stat, index) => {
            const heightPercent = maxSpent > 0 ? (stat.spent / maxSpent) * 100 : 0;
            return (
              <View key={`${stat.month}-${stat.year}`} style={styles.chartBar}>
                <Text style={styles.chartValue}>₹{stat.spent > 1000 ? `${(stat.spent / 1000).toFixed(1)}k` : stat.spent}</Text>
                <View style={styles.chartBarOuter}>
                  <View 
                    style={[
                      styles.chartBarFill,
                      { height: `${Math.max(heightPercent, 5)}%` }
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{stat.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderJobsChart = () => {
    const maxJobs = analyticsData.monthlyStats.length > 0 
      ? Math.max(...analyticsData.monthlyStats.map(s => s.jobs), 1) 
      : 1;
    
    return (
      <View style={styles.chart}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Jobs Posted</Text>
          <Text style={styles.chartSubtitle}>Last 6 months</Text>
        </View>
        <View style={styles.chartContainer}>
          {analyticsData.monthlyStats.map((stat, index) => {
            const heightPercent = maxJobs > 0 ? (stat.jobs / maxJobs) * 100 : 0;
            return (
              <View key={`${stat.month}-${stat.year}`} style={styles.chartBar}>
                <Text style={styles.chartValue}>{stat.jobs}</Text>
                <View style={styles.chartBarOuter}>
                  <View 
                    style={[
                      styles.chartBarFill,
                      { height: `${Math.max(heightPercent, 5)}%`, backgroundColor: COLORS.worker.primary }
                    ]}
                  />
                </View>
                <Text style={styles.chartLabel}>{stat.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <Icon name="bar-chart" size={32} color={COLORS.employer.primary} />
          </View>
          <ActivityIndicator size="large" color={COLORS.employer.primary} style={{ marginTop: SPACING.lg }} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIcon}>
            <Icon name="alert-circle" size={48} color={COLORS.status.error} />
          </View>
          <Text style={styles.errorTitle}>Failed to load analytics</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAnalytics}>
            <Icon name="refresh" size={18} color={COLORS.white} />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>Your hiring insights</Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchAnalytics}>
          <Icon name="refresh" size={20} color={COLORS.employer.primary} />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Icon 
                name={tab.icon} 
                size={18} 
                color={selectedTab === tab.key ? COLORS.white : COLORS.gray[500]} 
              />
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[COLORS.employer.primary]}
            tintColor={COLORS.employer.primary}
          />
        }
      >
        {selectedTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
            </View>
            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                'Total Jobs', 
                analyticsData.overview.totalJobs.toString(), 
                'All time posted',
                'briefcase',
                COLORS.employer.primary,
                COLORS.employer.bg
              )}
              {renderOverviewCard(
                'Active Jobs', 
                analyticsData.overview.activeJobs.toString(), 
                'Currently hiring',
                'flash',
                COLORS.worker.primary,
                COLORS.worker.bg
              )}
              {renderOverviewCard(
                'Completed', 
                analyticsData.overview.completedJobs.toString(), 
                `${analyticsData.overview.avgJobCompletion}% completion`,
                'checkmark',
                COLORS.system.primary,
                COLORS.system.bg
              )}
              {renderOverviewCard(
                'Total Spent', 
                `₹${analyticsData.overview.totalSpent.toLocaleString()}`, 
                'On all jobs',
                'cash',
                COLORS.status.warning,
                '#fef3c7'
              )}
            </View>

            {/* Application Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Application Breakdown</Text>
              <View style={styles.applicationGrid}>
                {renderStatCard('Total', analyticsData.applications.total, 'folder', COLORS.gray[600], COLORS.gray[100])}
                {renderStatCard('Pending', analyticsData.applications.pending, 'time', COLORS.status.warning, '#fef3c7')}
                {renderStatCard('Shortlisted', analyticsData.applications.shortlisted, 'star', COLORS.status.info, '#dbeafe')}
                {renderStatCard('Accepted', analyticsData.applications.accepted, 'checkmark', COLORS.worker.primary, COLORS.worker.bg)}
                {renderStatCard('In Progress', analyticsData.applications.inProgress, 'flash', COLORS.employer.primary, COLORS.employer.bg)}
                {renderStatCard('Completed', analyticsData.applications.completed, 'checkmark-done', COLORS.system.primary, COLORS.system.bg)}
              </View>
            </View>

            {/* Monthly Chart */}
            {analyticsData.monthlyStats.length > 0 && renderChart()}
          </>
        )}

        {selectedTab === 'jobs' && (
          <>
            {/* Jobs Summary */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jobs Summary</Text>
            </View>
            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                'Total Posted', 
                analyticsData.overview.totalJobs.toString(), 
                'All time',
                'document',
                COLORS.employer.primary,
                COLORS.employer.bg
              )}
              {renderOverviewCard(
                'Active Now', 
                analyticsData.overview.activeJobs.toString(), 
                'Accepting applications',
                'flash',
                COLORS.worker.primary,
                COLORS.worker.bg
              )}
              {renderOverviewCard(
                'Completed', 
                analyticsData.overview.completedJobs.toString(), 
                'Successfully done',
                'checkmark-done',
                COLORS.system.primary,
                COLORS.system.bg
              )}
              {renderOverviewCard(
                'Completion Rate', 
                `${analyticsData.overview.avgJobCompletion}%`, 
                'Of all jobs',
                'analytics',
                COLORS.status.info,
                '#dbeafe'
              )}
            </View>

            {/* Jobs per Month Chart */}
            {analyticsData.monthlyStats.length > 0 && renderJobsChart()}

            {/* Monthly Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Breakdown</Text>
              {analyticsData.monthlyStats.length > 0 ? (
                analyticsData.monthlyStats.map((stat, index) => (
                  <View key={`${stat.month}-${stat.year}`} style={styles.monthRow}>
                    <View style={styles.monthInfo}>
                      <Text style={styles.monthName}>{stat.month} {stat.year}</Text>
                    </View>
                    <View style={styles.monthStats}>
                      <View style={styles.monthStat}>
                        <Text style={styles.monthStatValue}>{stat.jobs}</Text>
                        <Text style={styles.monthStatLabel}>Posted</Text>
                      </View>
                      <View style={styles.monthStat}>
                        <Text style={[styles.monthStatValue, { color: COLORS.worker.primary }]}>{stat.completed}</Text>
                        <Text style={styles.monthStatLabel}>Done</Text>
                      </View>
                      <View style={styles.monthStat}>
                        <Text style={[styles.monthStatValue, { color: COLORS.employer.primary }]}>₹{stat.spent.toLocaleString()}</Text>
                        <Text style={styles.monthStatLabel}>Spent</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No monthly data available yet</Text>
              )}
            </View>
          </>
        )}

        {selectedTab === 'spending' && (
          <>
            {/* Spending Overview */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Spending Overview</Text>
            </View>
            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                'Total Spent',
                `₹${analyticsData.overview.totalSpent.toLocaleString()}`,
                'All time spending',
                'cash',
                COLORS.employer.primary,
                COLORS.employer.bg
              )}
              {renderOverviewCard(
                'Avg per Job',
                analyticsData.overview.completedJobs > 0 
                  ? `₹${Math.round(analyticsData.overview.totalSpent / analyticsData.overview.completedJobs).toLocaleString()}`
                  : '₹0',
                'Per completed job',
                'wallet',
                COLORS.status.info,
                '#dbeafe'
              )}
            </View>

            {/* Spending Chart */}
            {analyticsData.monthlyStats.length > 0 && renderChart()}

            {/* Monthly Spending */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Spending</Text>
              {analyticsData.monthlyStats.length > 0 ? (
                analyticsData.monthlyStats.map((stat, index) => (
                  <View key={`${stat.month}-${stat.year}`} style={styles.spendingRow}>
                    <View style={styles.spendingInfo}>
                      <Text style={styles.spendingMonth}>{stat.month} {stat.year}</Text>
                      <Text style={styles.spendingJobs}>{stat.jobs} jobs posted</Text>
                    </View>
                    <Text style={styles.spendingAmount}>₹{stat.spent.toLocaleString()}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No spending data available yet</Text>
              )}
            </View>
          </>
        )}

        {selectedTab === 'workers' && (
          <>
            {/* Workers Summary */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Worker Statistics</Text>
            </View>
            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                'Total Hired',
                analyticsData.applications.accepted.toString(),
                'Workers accepted',
                'people',
                COLORS.employer.primary,
                COLORS.employer.bg
              )}
              {renderOverviewCard(
                'In Progress',
                analyticsData.applications.inProgress.toString(),
                'Currently working',
                'time',
                COLORS.status.warning,
                '#fef3c7'
              )}
              {renderOverviewCard(
                'Completed',
                analyticsData.applications.completed.toString(),
                'Jobs finished',
                'checkmark-done',
                COLORS.worker.primary,
                COLORS.worker.bg
              )}
              {renderOverviewCard(
                'Completion Rate',
                analyticsData.applications.accepted > 0 
                  ? `${Math.round((analyticsData.applications.completed / analyticsData.applications.accepted) * 100)}%`
                  : '0%',
                'Of hired workers',
                'trending-up',
                COLORS.system.primary,
                COLORS.system.bg
              )}
            </View>

            {/* Hiring Funnel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hiring Funnel</Text>
              <View style={styles.funnelContainer}>
                <View style={styles.funnelItem}>
                  <View style={[styles.funnelBar, { backgroundColor: COLORS.gray[200], width: '100%' }]}>
                    <Text style={styles.funnelValue}>{analyticsData.applications.total}</Text>
                  </View>
                  <Text style={styles.funnelLabel}>Applications</Text>
                </View>
                <View style={styles.funnelItem}>
                  <View style={[styles.funnelBar, { backgroundColor: '#fef3c7', width: `${analyticsData.applications.total > 0 ? Math.max((analyticsData.applications.shortlisted / analyticsData.applications.total) * 100, 20) : 20}%` }]}>
                    <Text style={styles.funnelValue}>{analyticsData.applications.shortlisted}</Text>
                  </View>
                  <Text style={styles.funnelLabel}>Shortlisted</Text>
                </View>
                <View style={styles.funnelItem}>
                  <View style={[styles.funnelBar, { backgroundColor: COLORS.worker.bg, width: `${analyticsData.applications.total > 0 ? Math.max((analyticsData.applications.accepted / analyticsData.applications.total) * 100, 15) : 15}%` }]}>
                    <Text style={styles.funnelValue}>{analyticsData.applications.accepted}</Text>
                  </View>
                  <Text style={styles.funnelLabel}>Hired</Text>
                </View>
                <View style={styles.funnelItem}>
                  <View style={[styles.funnelBar, { backgroundColor: COLORS.system.bg, width: `${analyticsData.applications.total > 0 ? Math.max((analyticsData.applications.completed / analyticsData.applications.total) * 100, 10) : 10}%` }]}>
                    <Text style={styles.funnelValue}>{analyticsData.applications.completed}</Text>
                  </View>
                  <Text style={styles.funnelLabel}>Completed</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.employer.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorIcon: {
    marginBottom: SPACING.lg,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
    marginBottom: SPACING.sm,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.employer.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    gap: SPACING.sm,
  },
  retryBtnText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[500],
    marginTop: 2,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.employer.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Tabs
  tabContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  tabScroll: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray[100],
    marginRight: SPACING.sm,
    gap: 6,
  },
  activeTab: {
    backgroundColor: COLORS.employer.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[600],
  },
  activeTabText: {
    color: COLORS.white,
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  sectionHeader: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },

  // Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  overviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    ...SHADOWS.sm,
  },
  overviewHeader: {
    marginBottom: SPACING.sm,
  },
  overviewIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
    marginBottom: 2,
  },
  overviewTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.gray[700],
  },
  overviewSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },

  // Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },

  // Application Grid
  applicationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  statCard: {
    backgroundColor: COLORS.gray[50],
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    width: (width - SPACING.lg * 4 - SPACING.sm * 2) / 3,
    alignItems: 'center',
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  statCardValue: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  statCardLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    textAlign: 'center',
    marginTop: 2,
  },

  // Chart
  chart: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  chartHeader: {
    marginBottom: SPACING.lg,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  chartSubtitle: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    paddingTop: SPACING.lg,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarOuter: {
    width: 24,
    height: 100,
    backgroundColor: COLORS.gray[100],
    borderRadius: RADIUS.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: COLORS.employer.primary,
    borderRadius: RADIUS.sm,
  },
  chartLabel: {
    fontSize: 10,
    color: COLORS.gray[500],
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  chartValue: {
    fontSize: 9,
    color: COLORS.gray[600],
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: 4,
  },

  // Month Row
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  monthStats: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[900],
  },
  monthStatLabel: {
    fontSize: 10,
    color: COLORS.gray[400],
  },

  // Spending Row
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[100],
  },
  spendingInfo: {
    flex: 1,
  },
  spendingMonth: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.gray[900],
  },
  spendingJobs: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[400],
    marginTop: 2,
  },
  spendingAmount: {
    fontSize: TYPOGRAPHY.sizes.base,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.employer.primary,
  },

  // Funnel
  funnelContainer: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  funnelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  funnelBar: {
    height: 36,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
    minWidth: 50,
  },
  funnelValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.gray[800],
  },
  funnelLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.gray[500],
    width: 70,
  },

  // Empty
  emptyText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.gray[400],
    textAlign: 'center',
    paddingVertical: SPACING.xl,
  },
});