import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Application Types
export interface JobApplication {
  id: string;
  job_posting_id: string;
  employee_id: string;
  status: string;
  applied_at: string;
  employees?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    skills?: { id: string; skill_name: string }[];
    years_of_experience?: number;
    rating?: number;
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

// Get all applications for a specific job (Employer)
export const getJobApplications = async (jobId: string): Promise<JobApplication[]> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/employer-job-applications/${jobId}/applications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return await handleResponse(response);
};

// Update application status (accept, reject, shortlist, etc.)
export const updateApplicationStatus = async (
  applicationId: string, 
  status: 'accepted' | 'rejected' | 'shortlisted' | 'applied'
): Promise<any> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/employer-job-applications/applications/${applicationId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  return await handleResponse(response);
};

// Get all applications across all jobs for an employer
export const getAllEmployerApplications = async (): Promise<JobApplication[]> => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  // Get all employer's jobs first, then get applications for each
  const jobsResponse = await fetch(`${API_BASE_URL}/job-postings/myjobs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const jobs = await handleResponse(jobsResponse);
  
  // Get applications for all jobs
  const allApplications: JobApplication[] = [];
  for (const job of jobs) {
    try {
      const applications = await getJobApplications(job.id);
      allApplications.push(...applications);
    } catch (error) {
      console.log(`Failed to get applications for job ${job.id}:`, error);
    }
  }
  
  return allApplications;
};
