import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Get employer analytics
export const getEmployerAnalytics = async () => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/analytics/employer`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch employer analytics: ${response.status}`);
  }
  
  return response.json();
};

// Get worker analytics
export const getWorkerAnalytics = async () => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/analytics/worker`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch worker analytics: ${response.status}`);
  }
  
  return response.json();
};
