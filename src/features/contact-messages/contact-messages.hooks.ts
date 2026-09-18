import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  deleteContactMessage,
  getContactMessageStats,
  listContactMessages,
  updateContactMessageStatus,
  type ListContactMessagesParams,
} from './contact-messages.api';

export function useContactMessages(params: ListContactMessagesParams) {
  return useQuery({
    queryKey: ['contact-messages', params],
    queryFn: () => listContactMessages(params),
    placeholderData: keepPreviousData,
  });
}

export function useContactMessageStats() {
  return useQuery({ queryKey: ['contact-message-stats'], queryFn: getContactMessageStats });
}

export function useUpdateContactMessageStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateContactMessageStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-messages'] });
      qc.invalidateQueries({ queryKey: ['contact-message-stats'] });
      toast.success('Status updated');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useDeleteContactMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteContactMessage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-messages'] });
      qc.invalidateQueries({ queryKey: ['contact-message-stats'] });
      toast.success('Message deleted');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}
