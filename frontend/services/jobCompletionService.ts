import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Worker marks job as completed
export const markJobCompleted = async (
  applicationId: string,
  completionNotes?: string,
  rating?: number,
  review?: string
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/job-applications/${applicationId}/complete`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      completion_notes: completionNotes,
      rating,
      review,
    }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || errorData.details || `Failed to mark job as completed: ${response.status}`);
  }
  return response.json();
};

// Employer confirms job completion
export const confirmJobCompletion = async (
  applicationId: string,
  rating: number,
  review?: string
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/job-applications/${applicationId}/confirm-completion`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      rating,
      review,
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to confirm job completion: ${response.status}`);
  }
  return response.json();
};

// Get pending confirmations for employer
export const getPendingConfirmations = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/job-applications/pending-confirmations`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to get pending confirmations: ${response.status}`);
  }
  return response.json();
};
