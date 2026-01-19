import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Job Posting Types
export interface JobData {
  title: string;
  category: string;
  description: string;
  wage: number;
  duration: string;
  radius_km?: number;
  location?: { latitude: number; longitude: number };
  address?: string;
  skill_ids?: string[];
}

export interface Job {
  id: string;
  employer_id: string;
  title: string;
  category: string;
  description: string;
  wage: number;
  duration: string;
  radius_km?: number;
  address: string;
  location?: string;
  is_active?: boolean;
  created_at: string;
  skills?: { id: string; skill_name: string }[];
  dist_km?: number;
  distance_km?: number;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  scheduled_date?: string;
}

// Get all jobs for the logged-in employer
export const getMyJobs = async (): Promise<Job[]> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/myjobs`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch jobs');
  }

  return data;
};

// Create a new job posting
export const createJob = async (jobData: JobData): Promise<Job> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(jobData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create job');
  }

  return data;
};

// Get a single job by ID (for both workers and employers)
export const getJobById = async (jobId: string): Promise<Job> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/${jobId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch job');
  }

  return data;
};

// Update a job posting
export const updateJob = async (jobId: string, jobData: Partial<JobData>): Promise<Job> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/update/${jobId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(jobData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update job');
  }

  return data;
};

// Delete a job posting
export const deleteJob = async (jobId: string): Promise<{ message: string }> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/delete/${jobId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete job');
  }

  return data;
};

// Add a skill to a job
export const addSkillToJob = async (jobId: string, skill_id: string): Promise<{ message: string }> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/${jobId}/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ skill_id }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add skill');
  }

  return data;
};

// Remove a skill from a job
export const removeSkillFromJob = async (jobId: string, skill_id: string): Promise<{ message: string }> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/${jobId}/skills`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ skill_id }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to remove skill');
  }

  return data;
};

// Get all active jobs (for workers to browse)
export const getAllActiveJobs = async (): Promise<Job[]> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/job-postings/all`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch jobs');
  }

  return data;
};

// Search jobs by title and/or category
export const searchJobs = async (query?: string, category?: string): Promise<Job[]> => {
  const token = await getToken();
  
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (category) params.append('category', category);
  
  const response = await fetch(`${API_BASE_URL}/job-postings/search?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to search jobs');
  }

  return data;
};
