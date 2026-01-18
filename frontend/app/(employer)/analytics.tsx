import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Icon from '../../components/Icon';
import { getEmployerAnalytics } from '../../services/analyticsService';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    overview: {
      totalJobs: 0,
      activeJobs: 0,
      completedJobs: 0,
      totalSpent: 0,
      totalApplications: 0,
      totalHires: 0,
      avgJobCompletion: 0,
    },
    applications: {
      total: 0,
      accepted: 0,
      shortlisted: 0,
      rejected: 0,
      pending: 0,
    },
    monthlyStats: [] as any[],
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await getEmployerAnalytics();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'bar-chart-outline' },
    { key: 'jobs', label: 'Jobs', icon: 'document-text-outline' },
    { key: 'spending', label: 'Spending', icon: 'cash-outline' },
    { key: 'workers', label: 'Workers', icon: 'people-outline' },
  ];

  const renderOverviewCard = (title: string, value: string, subtitle?: string, icon?: string, color = '#2563eb') => (
    <View style={styles.overviewCard}>
      <View style={styles.overviewHeader}>
        <Text style={styles.overviewTitle}>{title}</Text>
        {icon && <Icon name={icon} size={20} color={color} />}
      </View>
      <Text style={[styles.overviewValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.overviewSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderActivityItem = (item: any) => (
    <View key={item.id} style={styles.activityItem}>
      <View style={styles.activityContent}>
        <Text style={styles.activityAction}>{item.action}</Text>
        <Text style={styles.activityDetail}>{item.detail}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
      {item.amount && (
        <Text style={[
          styles.activityAmount,
          { color: item.amount.startsWith('+') ? '#16a34a' : '#ef4444' }
        ]}>
          {item.amount}
        </Text>
      )}
    </View>
  );

  const renderCategoryItem = (item: any) => (
    <View key={item.name} style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categorySpent}>₹{item.spent?.toLocaleString() || 0}</Text>
      </View>
      <View style={styles.categoryMeta}>
        <Text style={styles.categoryJobs}>{item.jobs} jobs</Text>
        <Text style={styles.categoryPercentage}>{item.percentage}%</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${item.percentage}%` }]} />
      </View>
    </View>
  );

  const renderChart = () => {
    const maxSpent = analyticsData.monthlyStats.length > 0 
      ? Math.max(...analyticsData.monthlyStats.map(s => s.spent)) 
      : 0;
    
    return (
      <View style={styles.chart}>
        <Text style={styles.chartTitle}>Monthly Spending Trend</Text>
        <View style={styles.chartContainer}>
          {analyticsData.monthlyStats.map((stat, index) => (
            <View key={stat.month} style={styles.chartBar}>
              <View 
                style={[
                  styles.chartBarFill,
                  { height: (stat.spent / maxSpent) * 100 }
                ]}
              />
              <Text style={styles.chartLabel}>{stat.month}</Text>
              <Text style={styles.chartValue}>₹{(stat.spent / 1000).toFixed(1)}k</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity>
          <Icon name="document-outline" size={24} color={COLORS.employer.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.activePeriodButton
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.activePeriodButtonText
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              selectedTab === tab.key && styles.activeTab
            ]}
            onPress={() => setSelectedTab(tab.key)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={selectedTab === tab.key ? COLORS.employer.primary : '#6b7280'} 
            />
            <Text style={[
              styles.tabText,
              selectedTab === tab.key && styles.activeTabText
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'overview' && (
          <>
            {/* Overview Cards */}
            <View style={styles.overviewGrid}>
              {renderOverviewCard('Total Jobs', analyticsData.overview.totalJobs.toString(), 'All time', 'document-text-outline')}
              {renderOverviewCard('Active Jobs', analyticsData.overview.activeJobs.toString(), 'Currently hiring', 'pulse-outline', COLORS.status.success)}
              {renderOverviewCard('Completed', analyticsData.overview.completedJobs.toString(), 'Successfully done', 'checkmark-done-outline', COLORS.employer.primary)}
              {renderOverviewCard('Total Spent', `₹${analyticsData.overview.totalSpent.toLocaleString()}`, 'All time', 'cash-outline', COLORS.status.warning)}
            </View>

            {/* Applications Stats */}
            <View style={styles.quickStats}>
              <Text style={styles.sectionTitle}>Applications</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{analyticsData.applications.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: COLORS.status.success }]}>{analyticsData.applications.accepted}</Text>
                  <Text style={styles.statLabel}>Accepted</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: COLORS.status.warning }]}>{analyticsData.applications.shortlisted}</Text>
                  <Text style={styles.statLabel}>Shortlisted</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#6b7280' }]}>{analyticsData.applications.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            </View>

            {/* Monthly Chart */}
            {analyticsData.monthlyStats.length > 0 && renderChart()}
          </>
        )}

        {selectedTab === 'jobs' && (
          <>
            {/* Jobs Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Jobs Overview</Text>
              <Text style={styles.emptyText}>Job breakdown by category will appear here when you have active jobs.</Text>
            </View>

            {/* Monthly Chart */}
            {analyticsData.monthlyStats.length > 0 && renderChart()}
          </>
        )}

        {selectedTab === 'spending' && (
          <>
            {/* Spending Overview - Only show if there's real data */}
            {analyticsData.overview.totalSpent > 0 ? (
              <View style={styles.overviewGrid}>
                {renderOverviewCard(
                  'Total Spent',
                  `₹${analyticsData.overview.totalSpent.toLocaleString()}`,
                  'All completed jobs',
                  'cash-outline',
                  COLORS.employer.primary
                )}
                {analyticsData.overview.completedJobs > 0 && renderOverviewCard(
                  'Average per Job',
                  `₹${Math.round(analyticsData.overview.totalSpent / analyticsData.overview.completedJobs).toLocaleString()}`,
                  'Based on completed jobs',
                  'calculator-outline',
                  COLORS.employer.primary
                )}
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.emptyText}>Spending data will appear after jobs are completed and workers are paid.</Text>
              </View>
            )}

            {/* Chart */}
            {analyticsData.monthlyStats.length > 0 && renderChart()}
          </>
        )}

        {selectedTab === 'workers' && (
          <>
            <View style={styles.overviewGrid}>
              {renderOverviewCard(
                'Total Hired',
                analyticsData.applications.accepted.toString(),
                'Workers hired',
                'people-outline',
                COLORS.employer.primary
              )}
              {renderOverviewCard(
                'Jobs Completed',
                analyticsData.applications.completed.toString(),
                'Successfully finished',
                'checkmark-done-circle-outline',
                COLORS.status.success
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Worker Statistics</Text>
              <Text style={styles.emptyText}>Worker performance data will be available after completing jobs.</Text>
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
  periodSelector: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  activePeriodButton: {
    backgroundColor: COLORS.employer.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activePeriodButtonText: {
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: COLORS.employer.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 4,
  },
  activeTabText: {
    color: COLORS.employer.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  overviewCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  overviewSubtitle: {
    fontSize: 12,
    color: '#9ca3af',
  },
  quickStats: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  viewAll: {
    fontSize: 14,
    color: COLORS.employer.primary,
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  activityDetail: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  categorySpent: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.status.success,
  },
  categoryMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryJobs: {
    fontSize: 12,
    color: '#6b7280',
  },
  categoryPercentage: {
    fontSize: 12,
    color: COLORS.employer.primary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.employer.primary,
    borderRadius: 2,
  },
  chart: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBar: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarFill: {
    width: 20,
    backgroundColor: COLORS.employer.primary,
    borderRadius: 2,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  chartValue: {
    fontSize: 10,
    color: '#9ca3af',
  },
  workerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  workerStats: {
    fontSize: 12,
    color: '#6b7280',
  },
  workerRating: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.status.warning,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray[500],
    textAlign: 'center',
    paddingVertical: 20,
  },
});