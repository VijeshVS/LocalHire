import { API_BASE_URL } from './api';
import { getToken } from './authService';

// Skill Types
export interface Skill {
  id: string;
  skill_name: string;
  category?: string;
}

// Get all available skills (public endpoint - no auth required)
export const getAllSkills = async (): Promise<Skill[]> => {
  const response = await fetch(`${API_BASE_URL}/skills/skills`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch skills');
  }

  return data;
};

// Get skills by category (filters client-side for now)
export const getSkillsByCategory = async (category: string): Promise<Skill[]> => {
  const allSkills = await getAllSkills();
  return allSkills.filter(skill => skill.category === category);
};

// Get skill by ID
export const getSkillById = async (skillId: string): Promise<Skill> => {
  const token = await getToken();
  
  const response = await fetch(`${API_BASE_URL}/skills/${skillId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch skill');
  }

  return data;
};

// Search skills by name
export const searchSkills = async (query: string): Promise<Skill[]> => {
  const allSkills = await getAllSkills();
  const lowerQuery = query.toLowerCase();
  return allSkills.filter(skill => 
    skill.skill_name.toLowerCase().includes(lowerQuery)
  );
};
