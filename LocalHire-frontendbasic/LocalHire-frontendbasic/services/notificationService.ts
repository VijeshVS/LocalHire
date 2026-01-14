import { API_BASE_URL } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Get all notifications
export const getNotifications = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }
  return response.json();
};

// Get unread notification count
export const getUnreadCount = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch unread count: ${response.status}`);
  }
  return response.json();
};

// Mark single notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to mark notification as read: ${response.status}`);
  }
  return response.json();
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to mark all notifications as read: ${response.status}`);
  }
  return response.json();
};

// Delete single notification
export const deleteNotification = async (notificationId: string) => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.status}`);
  }
  return response.json();
};

// Clear all notifications
export const clearAllNotifications = async () => {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to clear notifications: ${response.status}`);
  }
  return response.json();
};
