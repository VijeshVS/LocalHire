import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Location Types
export interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface NearbyJob {
  id: string;
  title: string;
  description: string;
  wage: number;
  address: string;
  latitude?: number;
  longitude?: number;
  dist_km?: number; // Backend returns dist_km
  distance_km?: number; // For frontend compatibility
  employer_id?: string;
  category?: string;
  duration?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface NearbyEmployee {
  id: string;
  name: string;
  email: string;
  phone: string;
  skills?: { id: string; skill_name: string }[];
  distance_km?: number;
  years_of_experience?: number;
  rating?: number;
}

// Find nearby jobs based on location (for workers)
export const findNearbyJobs = async (
  latitude: number, 
  longitude: number, 
  radiusKm: number = 10
): Promise<NearbyJob[]> => {
  const token = await getToken();
  
  const response = await fetch(
    `${API_BASE_URL}/location/jobs?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`, 
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch nearby jobs');
  }

  // Map backend response to include distance_km for frontend compatibility
  return data.map((job: any) => ({
    ...job,
    distance_km: job.dist_km || job.distance_km
  }));
};

// Find nearby employees with skills (for employers)
export const findNearbyEmployees = async (
  latitude: number, 
  longitude: number, 
  radiusKm: number = 10
): Promise<NearbyEmployee[]> => {
  const token = await getToken();
  
  const response = await fetch(
    `${API_BASE_URL}/location/employees?latitude=${latitude}&longitude=${longitude}&radius_km=${radiusKm}`, 
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch nearby employees');
  }

  return data;
};
