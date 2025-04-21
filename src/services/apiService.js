/**
 * API Service for making requests to the backend
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get auth token from local storage
 * @returns {string|null} The auth token or null if not found
 */
export const getToken = () => {
  return localStorage.getItem('apployd_token');
};

/**
 * Set auth token in local storage
 * @param {string} token - The auth token to store
 */
export const setToken = (token) => {
  localStorage.setItem('apployd_token', token);
};

/**
 * Remove auth token from local storage
 */
export const removeToken = () => {
  localStorage.removeItem('apployd_token');
};

/**
 * Make an API request with authentication
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} data - Request body data
 * @returns {Promise<any>} Response data
 */
const apiRequest = async (endpoint, method = 'GET', data = null) => {
  const url = `${API_URL}${endpoint}`;
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Something went wrong');
    }

    return responseData;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  register: (userData) => apiRequest('/auth/register', 'POST', userData),
  login: (credentials) => apiRequest('/auth/login', 'POST', credentials),
  getProfile: () => apiRequest('/auth/profile'),
  updateProfile: (userData) => apiRequest('/auth/profile', 'PUT', userData),
};

// User API
export const userAPI = {
  getStats: () => apiRequest('/users/stats'),
  updatePreferences: (preferences) => apiRequest('/users/preferences', 'PUT', { preferences }),
};

// Document API
export const documentAPI = {
  getDocuments: () => apiRequest('/documents'),
  getDocument: (id) => apiRequest(`/documents/${id}`),
  createDocument: (document) => apiRequest('/documents', 'POST', document),
  updateDocument: (id, document) => apiRequest(`/documents/${id}`, 'PUT', document),
  deleteDocument: (id) => apiRequest(`/documents/${id}`, 'DELETE'),
  shareDocument: (id, shareData) => apiRequest(`/documents/${id}/share`, 'POST', shareData),
  getSharedDocument: (shareId) => apiRequest(`/documents/shared/${shareId}`),
};

// Conversation API
export const conversationAPI = {
  getConversations: () => apiRequest('/conversations'),
  getConversation: (id) => apiRequest(`/conversations/${id}`),
  createConversation: (title) => apiRequest('/conversations', 'POST', { title }),
  updateConversation: (id, title) => apiRequest(`/conversations/${id}`, 'PUT', { title }),
  deleteConversation: (id) => apiRequest(`/conversations/${id}`, 'DELETE'),
  getMessages: (id) => apiRequest(`/conversations/${id}/messages`),
  addMessage: (id, message) => apiRequest(`/conversations/${id}/messages`, 'POST', message),
};

// Memory API
export const memoryAPI = {
  getMemories: () => apiRequest('/memories'),
  getMemory: (id) => apiRequest(`/memories/${id}`),
  createMemory: (memory) => apiRequest('/memories', 'POST', memory),
  updateMemory: (id, memory) => apiRequest(`/memories/${id}`, 'PUT', memory),
  deleteMemory: (id) => apiRequest(`/memories/${id}`, 'DELETE'),
  getMemoriesByConversation: (conversationId) => apiRequest(`/memories/conversation/${conversationId}`),
};

// AI API
export const aiAPI = {
  generateChatResponse: (data) => apiRequest('/ai/chat', 'POST', data),
  processImage: (data) => apiRequest('/ai/image', 'POST', data),
  generateDocumentContent: (data) => apiRequest('/ai/document', 'POST', data),
};

// Export as named exports and default export
export {
  getToken,
  setToken,
  removeToken,
  authAPI,
  userAPI,
  documentAPI,
  conversationAPI,
  memoryAPI,
};

// Also export as default for backward compatibility
export default {
  getToken,
  setToken,
  removeToken,
  authAPI,
  userAPI,
  documentAPI,
  conversationAPI,
  memoryAPI,
  aiAPI,
};
