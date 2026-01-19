import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Application Types
export interface Application {
  id: string;
  job_posting_id: string;
  employee_id: string;
  status: string;
  applied_at: string;
  work_status?: string;
  has_conflicts?: boolean;
  conflicting_application_ids?: string[];
  can_confirm?: boolean;
  job_postings?: {
    id: string;
    title: string;
    wage: number;
    address: string;
    duration: string;
    description?: string;
    employer_id?: string;
    scheduled_date?: string;
    scheduled_start_time?: string;
    scheduled_end_time?: string;
    employer?: {
      name: string;
      business_name?: string;
    };
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

// Get all applications with conflict information
export const getMyApplicationsWithConflicts = async (): Promise<Application[]> => {
  const token = await getToken();
  
  if (!token) {
    console.log('No token found, returning empty array');
    return [];
  }
  
  try {
    // Try the conflict-aware endpoint first
    const response = await fetch(`${API_BASE_URL}/job-applications/my-applications-with-conflicts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    
    console.log('Conflict endpoint failed with status:', response.status);
  } catch (error) {
    console.log('Conflict endpoint error, falling back:', error);
  }

  // Fall back to regular endpoint if conflict endpoint fails
  try {
    const response = await fetch(`${API_BASE_URL}/job-applications/my-applications`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (error) {
    console.log('Regular endpoint also failed:', error);
  }

  return [];
};

// Validate if a job can be accepted without conflicts
export const validateJobAcceptance = async (applicationId: string): Promise<{
  can_accept: boolean;
  conflict_reason?: string;
  conflicting_jobs?: string[];
}> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/job-applications/${applicationId}/validate-acceptance`, {
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
