import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Application Types
export interface Application {
  id: string;
  job_posting_id: string;
  employee_id: string;
  status: string;
  applied_at: string;
  job_postings?: {
    id: string;
    title: string;
    wage: number;
    address: string;
    duration: string;
    description?: string;
    employer_id?: string;
  };
}

// Helper to handle fetch errors
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  
  return data;
};

// Apply for a job (Worker/Employee)
export const applyForJob = async (job_posting_id: string): Promise<Application> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/job-applications/apply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ job_posting_id }),
  });

  const data = await handleResponse(response);
  return data.data || data;
};

// Get all applications for the logged-in worker
export const getMyApplications = async (): Promise<Application[]> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/job-applications/my-applications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return await handleResponse(response);
};

// Get a specific application by ID
export const getApplicationById = async (applicationId: string): Promise<Application> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/job-applications/application/${applicationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return await handleResponse(response);
};

// Withdraw an application
export const withdrawApplication = async (applicationId: string): Promise<{ message: string }> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/job-applications/withdraw/${applicationId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return await handleResponse(response);
};
