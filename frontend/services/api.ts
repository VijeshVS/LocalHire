// API Configuration
// Dynamic API URL configuration for development and production
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the base URL dynamically
const getBaseUrl = () => {
  // Check if there's a production API URL in environment
  // You can set this in app.json under "extra" for production builds
  const productionUrl = Constants.expoConfig?.extra?.apiUrl;
  if (productionUrl && typeof productionUrl === 'string' && productionUrl.trim() !== '') {
    console.log('🌐 Using production API:', productionUrl);
    return productionUrl;
  }

  // Development mode - auto-detect based on platform
  const PORT = 5000;
  
  if (Platform.OS === 'web') {
    // Web browser - use localhost
    const devUrl = `http://localhost:${PORT}/api`;
    console.log('🌐 Using dev API (web):', devUrl);
    return devUrl;
  }
  
  if (Platform.OS === 'android') {
    // Check if running on Android emulator or physical device
    // Emulator uses 10.0.2.2 to access host machine
    // Physical device needs the actual IP
    
    // Get the debug server host (Expo provides this)
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    
    if (debuggerHost) {
      // Use the same IP that Expo Metro bundler is using
      const devUrl = `http://${debuggerHost}:${PORT}/api`;
      console.log('🌐 Using dev API (android):', devUrl);
      console.log('📡 Detected IP from Metro bundler:', debuggerHost);
      return devUrl;
    }
    
    // Fallback to emulator IP
    const fallbackUrl = `http://10.0.2.2:${PORT}/api`;
    console.log('🌐 Using emulator API:', fallbackUrl);
    return fallbackUrl;
  }
  
  if (Platform.OS === 'ios') {
    // iOS simulator - use localhost
    const devUrl = `http://localhost:${PORT}/api`;
    console.log('🌐 Using dev API (ios):', devUrl);
    return devUrl;
  }
  
  // Default fallback
  const defaultUrl = `http://localhost:${PORT}/api`;
  console.log('🌐 Using default API:', defaultUrl);
  return defaultUrl;
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
