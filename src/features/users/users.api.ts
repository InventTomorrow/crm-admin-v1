import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import { downloadBlob, filenameFromDisposition } from '@/lib/download';
import type {
  Paged,
  SystemRole,
  UserDetail,
  UserListItem,
  UserLookupItem,
  UserSortField,
  WhatsAppConnectionItem,
} from '@/lib/types';

export interface UserListFilters {
  search?: string;
  type: 'all' | 'system' | 'crm';
  status?: 'active' | 'deleted' | 'all';
  sortBy?: UserSortField;
  sortOrder?: 'asc' | 'desc';
}

export async function listUsers(
  params: UserListFilters & { page: number; limit: number }
): Promise<Paged<UserListItem>> {
  const { data } = await apiClient.get<ApiEnvelope<UserListItem[]>>('/admin/users', { params });
  return { items: data.data, meta: data.meta! };
}

/**
 * Downloads a CSV of every row matching the current filters — the whole result
 * set, not the visible page. `ids` narrows it to the current row selection.
 */
export async function exportUsers(params: UserListFilters & { ids?: string[] }): Promise<void> {
  const { ids, ...filters } = params;
  const response = await apiClient.get('/admin/users/export', {
    params: { ...filters, ...(ids?.length ? { ids: ids.join(',') } : {}) },
    responseType: 'blob',
  });
  downloadBlob(
    response.data as Blob,
    filenameFromDisposition(response.headers['content-disposition'], 'users.csv')
  );
}

export interface BulkDeleteResult {
  deleted: number;
  failed: number;
  failures: { id: string; reason: string }[];
}

export async function bulkDeleteUsers(ids: string[]): Promise<BulkDeleteResult> {
  const { data } = await apiClient.post<ApiEnvelope<BulkDeleteResult>>('/admin/users/bulk-delete', {
    ids,
  });
  return data.data;
}

/**
 * Owner picker search. Hits the narrow lookup route rather than the full list,
 * so managers (who hold `users:lookup` but not `users:view`) can still choose a
 * subscription owner.
 */
export async function lookupUsers(params: {
  search?: string;
  limit?: number;
}): Promise<UserLookupItem[]> {
  const { data } = await apiClient.get<ApiEnvelope<UserLookupItem[]>>('/admin/users/lookup', {
    params,
  });
  return data.data;
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

export interface DeleteUserResult {
  /** Deadline for restoring the account and the workspaces it took down. */
  scheduledPurgeAt: string;
  /** Names of the owned workspaces suspended alongside the account. */
  suspendedWorkspaces: string[];
}

export async function deleteUser(id: string): Promise<DeleteUserResult> {
  const { data } = await apiClient.delete<ApiEnvelope<DeleteUserResult>>(`/admin/users/${id}`);
  return data.data;
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
