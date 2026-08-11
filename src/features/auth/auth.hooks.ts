import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
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

/** True when the signed-in admin may perform SYSTEM_ADMIN-only writes. */
export function useCanWrite(): boolean {
  const { data: signedInAdmin } = useMe();
  return signedInAdmin?.systemRole === 'SYSTEM_ADMIN';
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
