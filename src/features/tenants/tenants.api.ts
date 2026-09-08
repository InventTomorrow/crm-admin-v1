import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type {
  Paged,
  TenantAiUsage,
  TenantDetail,
  TenantListItem,
  TenantStatus,
  WhatsAppConnectionItem,
  WorkspaceRole,
} from '@/lib/types';

export async function listTenants(params: {
  page: number;
  limit: number;
  search?: string;
  status?: TenantStatus;
}): Promise<Paged<TenantListItem>> {
  const { data } = await apiClient.get<ApiEnvelope<TenantListItem[]>>('/admin/tenants', { params });
  return { items: data.data, meta: data.meta! };
}

export async function getTenant(id: string): Promise<TenantDetail> {
  const { data } = await apiClient.get<ApiEnvelope<TenantDetail>>(`/admin/tenants/${id}`);
  return data.data;
}

export async function updateTenantStatus(id: string, status: TenantStatus) {
  await apiClient.patch(`/admin/tenants/${id}/status`, { status });
}

export async function bulkUpdateTenantStatus(ids: string[], status: TenantStatus): Promise<number> {
  const { data } = await apiClient.patch<ApiEnvelope<{ updated: number }>>(
    '/admin/tenants/bulk-status',
    { ids, status }
  );
  return data.data.updated;
}

// Roles, members and permissions are READ-ONLY for platform admins — the server
// exposes no write endpoints for them.
export async function getPermissionCatalog(): Promise<string[]> {
  const { data } = await apiClient.get<ApiEnvelope<string[]>>('/admin/permissions');
  return data.data;
}

export async function getTenantRoles(tenantId: string): Promise<WorkspaceRole[]> {
  const { data } = await apiClient.get<ApiEnvelope<WorkspaceRole[]>>(
    `/admin/tenants/${tenantId}/roles`
  );
  return data.data;
}

export async function getTenantWhatsAppNumbers(
  tenantId: string
): Promise<WhatsAppConnectionItem[]> {
  const { data } = await apiClient.get<ApiEnvelope<WhatsAppConnectionItem[]>>(
    `/admin/tenants/${tenantId}/whatsapp-numbers`
  );
  return data.data;
}

export async function getTenantAiUsage(
  tenantId: string,
  range: { from: string; to: string }
): Promise<TenantAiUsage> {
  const { data } = await apiClient.get<ApiEnvelope<TenantAiUsage>>(
    `/admin/tenants/${tenantId}/ai-usage`,
    { params: range }
  );
  return data.data;
}
