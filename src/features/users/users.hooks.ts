import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import type { SystemRole, UserSortField } from '@/lib/types';
import {
  bulkDeleteUsers,
  createUser,
  deleteUser,
  exportUsers,
  getUser,
  getUserWhatsAppNumbers,
  listUsers,
  restoreUser,
  setSystemRole,
  wipeUserWorkspaces,
  type CreateUserInput,
  type UserListFilters,
} from './users.api';

type UserType = 'all' | 'system' | 'crm';
type UserStatus = 'active' | 'deleted' | 'all';

export function useUsers(params: {
  type: UserType;
  page: number;
  search: string;
  limit?: number;
  status?: UserStatus;
  sortBy?: UserSortField;
  sortOrder?: 'asc' | 'desc';
}) {
  const limit = params.limit ?? 10;
  const status = params.status ?? 'active';
  const sortBy = params.sortBy ?? 'createdAt';
  const sortOrder = params.sortOrder ?? 'desc';
  return useQuery({
    queryKey: ['users', params.type, status, params.page, params.search, limit, sortBy, sortOrder],
    queryFn: () =>
      listUsers({
        page: params.page,
        limit,
        search: params.search || undefined,
        type: params.type,
        status,
        sortBy,
        sortOrder,
      }),
  });
}

export function useExportUsers() {
  return useMutation({
    mutationFn: (params: UserListFilters & { ids?: string[] }) => exportUsers(params),
    onSuccess: () => toast.success('Export downloaded'),
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useBulkDeleteUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => bulkDeleteUsers(ids),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['users'] });
      if (result.deleted > 0) toast.success(`${result.deleted} user(s) deleted`);
      // Owned-workspace and self-delete guards reject individual rows; surface
      // the first reason rather than silently dropping them from the count.
      if (result.failed > 0) {
        toast.error(`${result.failed} skipped — ${result.failures[0]?.reason ?? 'not deletable'}`);
      }
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useSetSystemRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: SystemRole | null }) => setSystemRole(id, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useRestoreUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success('Account restored');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useWipeUserWorkspaces() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wipeUserWorkspaces(id),
    onSuccess: result => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['tenants'] });
      toast.success(`${result.wipedWorkspaces} workspace(s) erased`);
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: !!id,
  });
}

export function useUserWhatsAppNumbers(id: string) {
  return useQuery({
    queryKey: ['users', id, 'whatsapp-numbers'],
    queryFn: () => getUserWhatsAppNumbers(id),
    enabled: !!id,
  });
}
