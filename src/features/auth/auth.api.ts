import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { AdminUser } from '@/lib/types';

export async function login(email: string, password: string): Promise<AdminUser> {
  const { data } = await apiClient.post<ApiEnvelope<AdminUser>>('/admin/auth/login', {
    email,
    password,
  });
  return data.data;
}

export async function getMe(): Promise<AdminUser> {
  const { data } = await apiClient.get<ApiEnvelope<AdminUser>>('/admin/auth/me');
  return data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/admin/auth/logout');
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export async function updateProfile(input: UpdateProfileInput): Promise<AdminUser> {
  const { data } = await apiClient.patch<ApiEnvelope<AdminUser>>('/admin/auth/profile', input);
  return data.data;
}

export async function changePassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.post('/admin/auth/change-password', input);
}
