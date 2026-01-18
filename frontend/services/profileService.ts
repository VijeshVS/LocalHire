import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Helper to handle fetch errors
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  
  return data;
};

// Employee/Worker Profile
export const getEmployeeProfile = async () => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/employee/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw error;
  }
};

export const updateEmployeeProfile = async (profileData: {
  name?: string;
  phone?: string;
  language?: string;
  years_of_experience?: number;
  address?: string;
  location?: { latitude: number; longitude: number };
}) => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/employee/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  return await handleResponse(response);
};

// Employee Skills
export const addEmployeeSkill = async (skill_id: string) => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/employee/skills`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ skill_id }),
  });

  return await handleResponse(response);
};

export const removeEmployeeSkill = async (skill_id: string) => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/employee/skills/${skill_id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  return await handleResponse(response);
};

// Employer Profile
export const getEmployerProfile = async () => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/employer/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    return await handleResponse(response);
  } catch (error: any) {
    if (error?.name === 'TypeError' && error?.message?.includes('Network request failed')) {
      throw new Error('Unable to connect to server. Please check your internet connection.');
    }
    throw error;
  }
};

export const updateEmployerProfile = async (profileData: {
  name?: string;
  phone?: string;
  business_name?: string;
  business_type?: string;
  language?: string;
  address?: string;
  location?: { latitude: number; longitude: number };
}) => {
  const token = await getToken();
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await fetch(`${API_BASE_URL}/employer/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(profileData),
  });

  return await handleResponse(response);
};
