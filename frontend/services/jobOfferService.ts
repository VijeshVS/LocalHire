import { apiRequest } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Authorization': `Bearer ${token}`,
  };
};

// Get all job offers for the logged-in worker
export const getJobOffers = async () => {
  const headers = await getAuthHeaders();
  return await apiRequest('/job-offers', { headers });
};

// Get job offer statistics
export const getJobOfferStats = async () => {
  const headers = await getAuthHeaders();
  return await apiRequest('/job-offers/stats', { headers });
};

// Get worker's schedule for a specific date
export const getWorkerSchedule = async (date: string) => {
  const headers = await getAuthHeaders();
  return await apiRequest(`/job-offers/schedule?date=${date}`, { headers });
};

// Check if worker is available for a time slot
export const checkAvailability = async (startTime: string, endTime: string) => {
  const headers = await getAuthHeaders();
  return await apiRequest(
    `/job-offers/check-availability?start_time=${startTime}&end_time=${endTime}`,
    { headers }
  );
};

// Get single job offer details
export const getJobOfferDetails = async (offerId: string) => {
  const headers = await getAuthHeaders();
  return await apiRequest(`/job-offers/${offerId}`, { headers });
};

// Accept a job offer
export const acceptJobOffer = async (offerId: string) => {
  const headers = await getAuthHeaders();
  return await apiRequest(`/job-offers/${offerId}/accept`, { method: 'POST', headers });
};

// Reject a job offer
export const rejectJobOffer = async (offerId: string, reason?: string) => {
  const headers = await getAuthHeaders();
  return await apiRequest(`/job-offers/${offerId}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });
};

export default {
  getJobOffers,
  getJobOfferStats,
  getWorkerSchedule,
  checkAvailability,
  getJobOfferDetails,
  acceptJobOffer,
  rejectJobOffer,
};
