import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { getApiUrl } from '@/lib/appConfig';

export const api = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function isAuthRoute(url?: string): boolean {
  if (!url) return false;
  return /\/auth\/(login|register|refresh|forgot-password|reset-password|verify-email)/.test(url);
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isAuthRoute(originalRequest.url)) {
      return Promise.reject(error);
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { data } = await axios.post(
        `${getApiUrl()}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      useAuthStore.getState().setToken(data.data.accessToken);
      originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return api(originalRequest);
    } catch {
      useAuthStore.getState().logout();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  }
);

export default api;
