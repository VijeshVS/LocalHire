// API Configuration
// Change this to your backend URL
// For local development with Android emulator: http://10.0.2.2:PORT
// For local development with iOS simulator: http://localhost:PORT
// For physical device: use your machine's local IP address
import { Platform } from 'react-native';

// IMPORTANT: Update this IP to your machine's IP address
const YOUR_MACHINE_IP = '10.186.208.239';

// Automatically select the right URL based on platform
const getBaseUrl = () => {
  // For web browser
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }
  
  // For Android emulator specifically (not physical device)
  // Uncomment the next line if using Android emulator:
  // return 'http://10.0.2.2:5000/api';
  
  // For physical devices and most cases, use machine IP
  return `http://${YOUR_MACHINE_IP}:5000/api`;
};

const API_BASE_URL = getBaseUrl();

// Log the API URL on startup for debugging
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);

// Helper function for making API requests with better error handling
export const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    console.log(`API Request: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    // Try to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data.error 
        ? data.error 
        : `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error('Unable to connect to server. Please check your network connection.');
    }
    throw error;
  }
};

export { API_BASE_URL };
