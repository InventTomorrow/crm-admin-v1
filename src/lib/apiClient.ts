import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

/**
 * Axios instance for the admin portal. In dev, requests go to `/api/v1` and are
 * proxied to the backend by Vite (first-party cookies). In prod, set
 * `VITE_API_URL` to the backend origin.
 */
const baseURL = `${import.meta.env.VITE_API_URL ?? ''}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// ── 401 → refresh, then retry once ─────────────────────────────────────────────
let isRefreshing = false;
let queue: { resolve: () => void; reject: (e: unknown) => void }[] = [];

const flush = (error: unknown) => {
  queue.forEach(p => (error ? p.reject(error) : p.resolve()));
  queue = [];
};

apiClient.interceptors.response.use(
  res => res,
  async (error: AxiosError<{ error?: { code?: string } }>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const code = error.response?.data?.error?.code;
    const url = original?.url ?? '';

    const isExpired = error.response?.status === 401 && code === 'auth/token_expired';
    const isAuthRoute = url.includes('/admin/auth/login') || url.includes('/admin/auth/refresh');

    if (isExpired && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve: () => resolve(apiClient(original)), reject });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        await apiClient.post('/admin/auth/refresh');
        flush(null);
        return apiClient(original);
      } catch (refreshErr) {
        flush(refreshErr);
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Unwraps the server's `{ success, data, meta }` envelope. */
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: { page: number; limit: number; total: number };
}

export function apiMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      (error.response?.data as { error?: { message?: string } })?.error?.message ??
      error.message ??
      'Something went wrong'
    );
  }
  return 'Something went wrong';
}
