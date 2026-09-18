import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiMessage } from '@/lib/apiClient';
import {
  deleteSubscriber,
  downloadSubscribersCsv,
  getNewsletterStats,
  listSubscribers,
  type ListSubscribersParams,
} from './newsletter.api';

export function useNewsletterSubscribers(params: ListSubscribersParams) {
  return useQuery({
    queryKey: ['newsletter-subscribers', params],
    queryFn: () => listSubscribers(params),
    placeholderData: keepPreviousData,
  });
}

export function useNewsletterStats() {
  return useQuery({ queryKey: ['newsletter-stats'], queryFn: getNewsletterStats });
}

export function useDeleteSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubscriber(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      qc.invalidateQueries({ queryKey: ['newsletter-stats'] });
      toast.success('Subscriber removed');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useExportSubscribers() {
  return useMutation({
    mutationFn: downloadSubscribersCsv,
    onSuccess: () => toast.success('Export downloaded'),
    onError: error => toast.error(apiMessage(error)),
  });
}
