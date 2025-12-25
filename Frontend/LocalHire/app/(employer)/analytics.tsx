import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Icon from '../../components/Icon';

const { width } = Dimensions.get('window');

const analyticsData = {
  overview: {
    totalJobs: 15,
    activeJobs: 3,
    completedJobs: 8,
    totalSpent: 12500,
    totalHires: 24,
    avgJobCompletion: 3.2, // days
  },
  recentActivity: [
    { id: '1', action: 'Job completed', detail: 'House Painting by Rajesh Kumar', amount: '+₹800', time: '2 hours ago' },
    { id: '2', action: 'New application', detail: 'Office Cleaning - 3 new applications', amount: '', time: '4 hours ago' },
    { id: '3', action: 'Worker hired', detail: 'Moving Helper - Priya Sharma', amount: '', time: '1 day ago' },
    { id: '4', action: 'Job posted', detail: 'Kitchen Helper in Indiranagar', amount: '-₹50', time: '2 days ago' },
  ],
  topCategories: [
    { name: 'Cleaning', jobs: 6, spent: 3200, percentage: 40 },
    { name: 'Painting', jobs: 4, spent: 2800, percentage: 30 },
    { name: 'Helper', jobs: 3, spent: 1800, percentage: 20 },
    { name: 'Driver', jobs: 2, spent: 900, percentage: 10 },
  ],
  monthlyStats: [
    { month: 'Jan', jobs: 2, spent: 1200 },
    { month: 'Feb', jobs: 3, spent: 1800 },
    { month: 'Mar', jobs: 4, spent: 2400 },
    { month: 'Apr', jobs: 3, spent: 2100 },
    { month: 'May', jobs: 2, spent: 1600 },
    { month: 'Jun', jobs: 1, spent: 800 },
  ],
};

export default function Analytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTab, setSelectedTab] = useState('overview');

  const periods = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'quarter', label: 'This Quarter' },
    { key: 'year', label: 'This Year' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'analytics' },
    { key: 'jobs', label: 'Jobs', icon: 'briefcase' },
    { key: 'spending', label: 'Spending', icon: 'wallet' },
    { key: 'workers', label: 'Workers', icon: 'people' },
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

  const renderActivityItem = (item: typeof analyticsData.recentActivity[0]) => (
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

  const renderCategoryItem = (item: typeof analyticsData.topCategories[0]) => (
    <View key={item.name} style={styles.categoryItem}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categorySpent}>₹{item.spent.toLocaleString()}</Text>
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
    const maxSpent = Math.max(...analyticsData.monthlyStats.map(s => s.spent));
    
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <TouchableOpacity>
          <Icon name="download" size={24} color="#2563eb" />
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
              color={selectedTab === tab.key ? '#2563eb' : '#6b7280'} 
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
              {renderOverviewCard('Total Jobs', analyticsData.overview.totalJobs.toString(), 'All time', 'briefcase')}
              {renderOverviewCard('Active Jobs', analyticsData.overview.activeJobs.toString(), 'Currently hiring', 'trending-up', '#16a34a')}
              {renderOverviewCard('Completed', analyticsData.overview.completedJobs.toString(), 'Successfully done', 'checkmark-circle', '#8b5cf6')}
              {renderOverviewCard('Total Spent', `₹${analyticsData.overview.totalSpent.toLocaleString()}`, 'All time', 'wallet', '#f59e0b')}
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{analyticsData.overview.totalHires}</Text>
                  <Text style={styles.statLabel}>Total Hires</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{analyticsData.overview.avgJobCompletion}</Text>
                  <Text style={styles.statLabel}>Avg. Days to Complete</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>₹{Math.round(analyticsData.overview.totalSpent / analyticsData.overview.totalHires)}</Text>
                  <Text style={styles.statLabel}>Avg. Cost per Hire</Text>
                </View>
              </View>
            </View>

            {/* Recent Activity */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity>
                  <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
              </View>
              {analyticsData.recentActivity.slice(0, 4).map(renderActivityItem)}
            </View>
          </>
        )}

        {selectedTab === 'jobs' && (
          <>
            {/* Top Categories */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Job Categories Performance</Text>
              {analyticsData.topCategories.map(renderCategoryItem)}
            </View>

            {/* Chart */}
            {renderChart()}
          </>
        )}

        {selectedTab === 'spending' && (
          <>
            {/* Spending Overview */}
            <View style={styles.overviewGrid}>
              {renderOverviewCard('This Month', '₹2,400', '+15% vs last month', 'trending-up', '#16a34a')}
              {renderOverviewCard('Average per Job', '₹833', 'Based on completed jobs', 'analytics')}
            </View>

            {/* Chart */}
            {renderChart()}

            {/* Category Breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              {analyticsData.topCategories.map(renderCategoryItem)}
            </View>
          </>
        )}

        {selectedTab === 'workers' && (
          <>
            <View style={styles.overviewGrid}>
              {renderOverviewCard('Total Workers', '24', 'Hired all time', 'people')}
              {renderOverviewCard('Active Workers', '3', 'Currently working', 'person', '#16a34a')}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performing Workers</Text>
              <View style={styles.workerItem}>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>Rajesh Kumar</Text>
                  <Text style={styles.workerStats}>5 jobs completed • ₹4,200 earned</Text>
                </View>
                <Text style={styles.workerRating}>4.9 ⭐</Text>
              </View>
              <View style={styles.workerItem}>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>Priya Sharma</Text>
                  <Text style={styles.workerStats}>3 jobs completed • ₹2,100 earned</Text>
                </View>
                <Text style={styles.workerRating}>4.8 ⭐</Text>
              </View>
              <View style={styles.workerItem}>
                <View style={styles.workerInfo}>
                  <Text style={styles.workerName}>Amit Singh</Text>
                  <Text style={styles.workerStats}>4 jobs completed • ₹3,200 earned</Text>
                </View>
                <Text style={styles.workerRating}>4.7 ⭐</Text>
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
    backgroundColor: '#2563eb',
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
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 4,
  },
  activeTabText: {
    color: '#2563eb',
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
    color: '#2563eb',
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
    color: '#16a34a',
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
    color: '#2563eb',
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
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
    backgroundColor: '#2563eb',
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
    color: '#f59e0b',
  },
});