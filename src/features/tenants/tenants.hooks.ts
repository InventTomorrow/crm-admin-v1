import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import type { DateRange } from '@/features/dashboard/dashboard.hooks';
import type { TenantDetail, TenantStatus } from '@/lib/types';
import {
  bulkUpdateTenantStatus,
  getPermissionCatalog,
  getTenant,
  getTenantAiUsage,
  getTenantRoles,
  getTenantWhatsAppNumbers,
  listTenants,
  updateTenantStatus,
} from './tenants.api';

export function useTenants(params: {
  page: number;
  search: string;
  status?: TenantStatus;
  limit?: number;
}) {
  const limit = params.limit ?? 20;
  return useQuery({
    queryKey: ['tenants', params.page, params.search, params.status ?? 'ALL', limit],
    queryFn: () =>
      listTenants({
        page: params.page,
        limit,
        search: params.search || undefined,
        status: params.status,
      }),
  });
}

export function useTenant(id: string) {
  return useQuery({
    queryKey: ['tenant', id],
    queryFn: () => getTenant(id),
    enabled: !!id,
  });
}

/** Optimistically patches the detail cache, rolling back on failure. */
export function useUpdateTenantStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: TenantStatus) => updateTenantStatus(id, status),
    onMutate: async status => {
      await qc.cancelQueries({ queryKey: ['tenant', id] });
      const previousTenant = qc.getQueryData<TenantDetail>(['tenant', id]);
      if (previousTenant) {
        qc.setQueryData<TenantDetail>(['tenant', id], { ...previousTenant, status });
      }
      return { previousTenant };
    },
    onError: (error, _status, context) => {
      if (context?.previousTenant) {
        qc.setQueryData(['tenant', id], context.previousTenant);
      }
      toast.error(apiMessage(error));
    },
    onSuccess: () => toast.success('Status updated'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tenant', id] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
}

export function useBulkTenantStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TenantStatus }) =>
      bulkUpdateTenantStatus(ids, status),
    onSuccess: updatedCount => {
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success(`${updatedCount} tenant${updatedCount === 1 ? '' : 's'} updated`);
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function usePermissionCatalog() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: getPermissionCatalog,
    staleTime: Infinity,
  });
}

export function useTenantRoles(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-roles', tenantId],
    queryFn: () => getTenantRoles(tenantId),
    enabled: !!tenantId,
  });
}

export function useTenantWhatsAppNumbers(tenantId: string) {
  return useQuery({
    queryKey: ['tenant', tenantId, 'whatsapp-numbers'],
    queryFn: () => getTenantWhatsAppNumbers(tenantId),
    enabled: !!tenantId,
  });
}

export function useTenantAiUsage(tenantId: string, range: DateRange) {
  return useQuery({
    queryKey: ['tenant', tenantId, 'ai-usage', range.from, range.to],
    queryFn: () => getTenantAiUsage(tenantId, range),
    enabled: !!tenantId,
    placeholderData: prev => prev,
  });
}
