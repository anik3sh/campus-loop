import { create } from 'zustand';
import { authAPI } from '../api';

interface User {
  id: string;
  name: string;
  email: string;
  college: string;
  campus: string;
  bio?: string;
  avatar?: string;
  is_admin: boolean;
  response_rate?: number;
  total_sold?: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: JSON.parse(localStorage.getItem('cl_user') || 'null'),
  token: localStorage.getItem('cl_token'),
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.login(email, password);
      localStorage.setItem('cl_token', data.token);
      localStorage.setItem('cl_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (formData) => {
    set({ isLoading: true });
    try {
      const { data } = await authAPI.register(formData);
      localStorage.setItem('cl_token', data.token);
      localStorage.setItem('cl_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, isLoading: false });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('cl_token');
    localStorage.removeItem('cl_user');
    set({ user: null, token: null });
    window.location.href = '/';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('cl_token');
    if (!token) return;
    try {
      const { data } = await authAPI.me();
      localStorage.setItem('cl_user', JSON.stringify(data.user));
      set({ user: data.user, token });
    } catch {
      localStorage.removeItem('cl_token');
      localStorage.removeItem('cl_user');
      set({ user: null, token: null });
    }
  },
}));
