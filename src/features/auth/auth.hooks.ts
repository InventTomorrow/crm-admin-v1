import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import { permissionsForRole, type SystemPermission } from '@/lib/permissions';
import {
  changePassword,
  getMe,
  login,
  logout,
  updateProfile,
  type UpdateProfileInput,
} from './auth.api';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/**
 * Resolves what the signed-in admin is allowed to do. Permissions come from the
 * role map in `@/lib/permissions`, which mirrors the server catalogue — so a
 * hidden button and a rejected request always agree.
 *
 * `isLoading` matters: callers must not render actions before the session
 * resolves, or a manager briefly sees admin-only controls.
 */
export function usePermissions() {
  const { data: signedInAdmin, isLoading } = useMe();
  const role = signedInAdmin?.systemRole;

  const granted = useMemo(() => permissionsForRole(role), [role]);

  return useMemo(
    () => ({
      isLoading,
      role: role ?? null,
      isSystemAdmin: role === 'SYSTEM_ADMIN',
      can: (permission: SystemPermission) => granted.has(permission),
      canAny: (...permissions: SystemPermission[]) =>
        permissions.some(permission => granted.has(permission)),
      canAll: (...permissions: SystemPermission[]) =>
        permissions.every(permission => granted.has(permission)),
    }),
    [granted, isLoading, role],
  );
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: user => qc.setQueryData(['me'], user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => qc.clear(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateProfile(input),
    onSuccess: user => {
      qc.setQueryData(['me'], user);
      toast.success('Profile updated');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => toast.success('Password updated'),
    onError: error => toast.error(apiMessage(error)),
  });
}
