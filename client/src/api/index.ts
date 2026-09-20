import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cl_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cl_token');
      localStorage.removeItem('cl_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; college?: string; campus?: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Listings
export const listingsAPI = {
  getAll: (params?: any) => api.get('/listings', { params }),
  getOne: (id: string) => api.get(`/listings/${id}`),
  create: (data: FormData) => api.post('/listings', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: any) => api.patch(`/listings/${id}`, data),
  delete: (id: string) => api.delete(`/listings/${id}`),
  favorite: (id: string) => api.post(`/listings/${id}/favorite`),
  report: (id: string, data: { reason: string; description?: string }) =>
    api.post(`/listings/${id}/report`, data),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Messages
export const messagesAPI = {
  getConversations: () => api.get('/messages'),
  getMessages: (convId: string) => api.get(`/messages/${convId}/messages`),
  startConversation: (seller_id: string, listing_id?: string) =>
    api.post('/messages', { seller_id, listing_id }),
  sendMessage: (convId: string, content: string) =>
    api.post(`/messages/${convId}/messages`, { content }),
};

// Users
export const usersAPI = {
  getProfile: (id: string) => api.get(`/users/${id}/profile`),
  updateMe: (data: any) => api.patch('/users/me', data),
  getFavorites: () => api.get('/users/me/favorites'),
  getMyListings: (status?: string) => api.get('/users/me/listings', { params: { status } }),
  getDashboard: () => api.get('/users/me/dashboard'),
  getNotifications: () => api.get('/users/me/notifications'),
  markNotificationsRead: () => api.post('/users/me/notifications/read'),
  submitReview: (data: any) => api.post('/users/reviews', data),
};

// AI
export const aiAPI = {
  chat: (message: string, history: any[]) =>
    api.post('/ai/chat', { message, history }),
  enhanceListing: (data: { name: string; condition: string; description: string }) =>
    api.post('/ai/enhance-listing', data),
  suggestPrice: (data: { title: string; condition: string; original_price?: number }) =>
    api.post('/ai/suggest-price', data),
  smartSearch: (q: string) => api.get('/ai/smart-search', { params: { q } }),
};

// Marketplace stats
export const marketplaceAPI = {
  getStats: () => api.get('/marketplace/stats'),
};

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  suspendUser: (id: string, suspend: boolean) => api.patch(`/admin/users/${id}/suspend`, { suspend }),
  getListings: (status?: string) => api.get('/admin/listings', { params: { status } }),
  updateListing: (id: string, status: string) => api.patch(`/admin/listings/${id}`, { status }),
  getReports: () => api.get('/admin/reports'),
  updateReport: (id: string, data: any) => api.patch(`/admin/reports/${id}`, data),
};

export default api;
