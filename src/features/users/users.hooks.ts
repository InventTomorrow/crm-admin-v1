import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import type { SystemRole } from '@/lib/types';
import {
  createUser,
  deleteUser,
  getUser,
  getUserWhatsAppNumbers,
  listUsers,
  restoreUser,
  setSystemRole,
  wipeUserWorkspaces,
  type CreateUserInput,
} from './users.api';

type UserType = 'all' | 'system' | 'crm';
type UserStatus = 'active' | 'deleted' | 'all';

export function useUsers(params: {
  type: UserType;
  page: number;
  search: string;
  limit?: number;
  status?: UserStatus;
}) {
  const limit = params.limit ?? 10;
  const status = params.status ?? 'active';
  return useQuery({
    queryKey: ['users', params.type, status, params.page, params.search, limit],
    queryFn: () =>
      listUsers({
        page: params.page,
        limit,
        search: params.search || undefined,
        type: params.type,
        status,
      }),
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
