import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type { Paged, SystemRole, UserDetail, UserListItem, WhatsAppConnectionItem } from '@/lib/types';

export async function listUsers(params: {
  page: number;
  limit: number;
  search?: string;
  type: 'all' | 'system' | 'crm';
  status?: 'active' | 'deleted' | 'all';
}): Promise<Paged<UserListItem>> {
  const { data } = await apiClient.get<ApiEnvelope<UserListItem[]>>('/admin/users', { params });
  return { items: data.data, meta: data.meta! };
}

export async function getUser(id: string): Promise<UserDetail> {
  const { data } = await apiClient.get<ApiEnvelope<UserDetail>>(`/admin/users/${id}`);
  return data.data;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  systemRole?: SystemRole;
}

export async function createUser(input: CreateUserInput): Promise<UserListItem> {
  const { data } = await apiClient.post<ApiEnvelope<UserListItem>>('/admin/users', input);
  return data.data;
}

export async function setSystemRole(id: string, systemRole: SystemRole | null) {
  await apiClient.patch(`/admin/users/${id}/system-role`, { systemRole });
}

export async function deleteUser(id: string) {
  await apiClient.delete(`/admin/users/${id}`);
}

/** Reverses a user-initiated deletion, along with the workspaces it closed. */
export async function restoreUser(id: string) {
  await apiClient.post(`/admin/users/${id}/restore`);
}

export interface WipeWorkspacesResult {
  wipedWorkspaces: number;
  workspaceNames: string[];
}

/** Erases the workspaces of a permanently closed account. The user row survives. */
export async function wipeUserWorkspaces(id: string): Promise<WipeWorkspacesResult> {
  const { data } = await apiClient.post<ApiEnvelope<WipeWorkspacesResult>>(
    `/admin/users/${id}/wipe-workspaces`
  );
  return data.data;
}

/** WhatsApp numbers this user has connected, across every workspace they belong to. */
export async function getUserWhatsAppNumbers(id: string): Promise<WhatsAppConnectionItem[]> {
  const { data } = await apiClient.get<ApiEnvelope<WhatsAppConnectionItem[]>>(
    `/admin/users/${id}/whatsapp-numbers`
  );
  return data.data;
}
