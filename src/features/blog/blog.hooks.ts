import { apiMessage } from '@/lib/apiClient';
import type { BlogPostStatus } from '@/lib/types';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { PostFormValues } from './post-form.schema';
import { toStoredDraft, usePostDraftStore, type StoredDraft } from './post-draft.store';
import {
  createCategory,
  createPost,
  deleteCategory,
  deletePost,
  getPost,
  listCategories,
  listPosts,
  updateCategory,
  updatePost,
  updatePostStatus,
  type CategoryInput,
  type ListPostsParams,
  type PostInput,
} from './blog.api';

export function usePosts(params: ListPostsParams) {
  return useQuery({
    queryKey: ['blog-posts', params],
    queryFn: () => listPosts(params),
    placeholderData: keepPreviousData,
  });
}

/** Fetches one post directly — the editor must not rely on the list cache. */
export function usePost(id: string) {
  return useQuery({
    queryKey: ['blog-posts', id],
    queryFn: () => getPost(id),
    enabled: !!id,
  });
}

/** Single hook for both create and edit — pass an id to update. */
export function useSavePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: PostInput }) =>
      id ? updatePost(id, input) : createPost(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success(variables.id ? 'Post updated' : 'Post created');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useUpdatePostStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BlogPostStatus }) =>
      updatePostStatus(id, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success(
        variables.status === 'PUBLISHED'
          ? 'Post published'
          : `Moved to ${variables.status.toLowerCase()}`
      );
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post deleted');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useBlogCategories() {
  return useQuery({ queryKey: ['blog-categories'], queryFn: listCategories });
}

export function useSaveCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CategoryInput }) =>
      id ? updateCategory(id, input) : createCategory(input),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success(variables.id ? 'Category updated' : 'Category created');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blog-categories'] });
      toast.success('Category deleted');
    },
    onError: error => toast.error(apiMessage(error)),
  });
}

/** How long the writer must pause before the draft is written to the device. */
const DRAFT_WRITE_DELAY_MS = 800;

interface PostDraftPersistence {
  /** The copy found on this device when the form mounted, if any. */
  restoredDraft: StoredDraft | undefined;
  /** When the local copy was last written — drives the "Saved locally" label. */
  lastSavedAt: string | null;
  queueDraftWrite: (values: PostFormValues, bodyJson: unknown) => void;
  discardStoredDraft: () => void;
}

/**
 * Mirrors the form onto the device between explicit saves. The draft found at
 * mount is read once, so later writes never re-render the form around the cursor.
 */
export function usePostDraftPersistence(key: string): PostDraftPersistence {
  const saveDraft = usePostDraftStore(state => state.saveDraft);
  const clearDraft = usePostDraftStore(state => state.clearDraft);

  const [restoredDraft] = useState(() => usePostDraftStore.getState().drafts[key]);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(restoredDraft?.savedAt ?? null);
  const writeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
    },
    []
  );

  const queueDraftWrite = useCallback(
    (values: PostFormValues, bodyJson: unknown) => {
      if (writeTimer.current) clearTimeout(writeTimer.current);
      writeTimer.current = setTimeout(() => {
        const draft = toStoredDraft(values, bodyJson);
        saveDraft(key, draft);
        setLastSavedAt(draft.savedAt);
      }, DRAFT_WRITE_DELAY_MS);
    },
    [key, saveDraft]
  );

  const discardStoredDraft = useCallback(() => {
    if (writeTimer.current) clearTimeout(writeTimer.current);
    clearDraft(key);
    setLastSavedAt(null);
  }, [clearDraft, key]);

  return { restoredDraft, lastSavedAt, queueDraftWrite, discardStoredDraft };
}
