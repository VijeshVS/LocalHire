import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

const TOKEN_KEY = 'auth_token';
const USER_TYPE_KEY = 'user_type';
const USER_ID_KEY = 'user_id';

// Helper to handle fetch errors
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  
  return data;
};

// Worker/Employee Authentication
export const loginEmployee = async (email: string, password: string) => {
  try {
    console.log('🔐 Attempting login to:', `${API_BASE_URL}/employee/login`);
    const response = await fetch(`${API_BASE_URL}/employee/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('📡 Response status:', response.status);
    const data = await handleResponse(response);
    console.log('✅ Login successful, token received');

    // Store token and user type
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_TYPE_KEY, 'worker');
    
    return data;
  } catch (error) {
    console.error('❌ Login error:', error);
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw error;
  }
};

export const registerEmployee = async (employeeData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  language?: string;
  user_type?: string;
  years_of_experience?: number;
  address?: string;
  location?: { latitude: number; longitude: number };
  skill_ids?: string[];
  requested_skills?: string[];
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employee/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeData),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw error;
  }
};

// Employer Authentication
export const loginEmployer = async (email: string, password: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employer/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await handleResponse(response);

    // Store token and user type
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_TYPE_KEY, 'employer');
    
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw error;
  }
};

export const registerEmployer = async (employerData: {
  name: string;
  email: string;
  phone: string;
  password: string;
  business_name?: string;
  business_type?: string;
  language?: string;
  location?: { latitude: number; longitude: number };
  address?: string;
}) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employer/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employerData),
    });

    return await handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw error;
  }
};

// Token Management
export const getToken = async () => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const getUserType = async () => {
  return await AsyncStorage.getItem(USER_TYPE_KEY);
};

export const logout = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_TYPE_KEY);
};

export const isAuthenticated = async () => {
  const token = await getToken();
  return !!token;
};
