import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './api';

const TOKEN_KEY = 'auth_token';

// Helper to get auth headers
const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Get all conversations for current user
export const getConversations = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get conversations');
  }
  return response.json();
};

// Create or get existing conversation
export const getOrCreateConversation = async (
  otherUserId: string, 
  otherUserRole: 'EMPLOYEE' | 'EMPLOYER',
  jobId?: string
) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/messages/conversations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      other_user_id: otherUserId,
      other_user_role: otherUserRole,
      job_id: jobId
    }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create conversation');
  }
  return response.json();
};

// Get conversation details
export const getConversationDetails = async (conversationId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get conversation details');
  }
  return response.json();
};

// Get messages in a conversation
export const getMessages = async (conversationId: string, limit = 50, offset = 0) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get messages');
  }
  return response.json();
};

// Send a message
export const sendMessage = async (conversationId: string, text: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/messages/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }
  return response.json();
};
