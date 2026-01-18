import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Get employer analytics
export const getEmployerAnalytics = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/analytics/employer`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch employer analytics: ${response.status}`);
  }
  return response.json();
};

// Get worker analytics
export const getWorkerAnalytics = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/analytics/worker`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch worker analytics: ${response.status}`);
  }
  return response.json();
};
