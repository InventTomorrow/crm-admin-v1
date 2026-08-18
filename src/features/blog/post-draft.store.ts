import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PostFormValues } from './post-form.schema';

/**
 * Keeps an in-progress post on the device so a reload, a crash or a stray
 * back-navigation never costs the writer their work. Nothing here talks to the
 * API — saving is always an explicit "Save as draft" or "Publish".
 */

/** Dates do not survive JSON, so the stored shape carries an ISO string instead. */
type SerializedValues = Omit<PostFormValues, 'publishedAt'> & { publishedAt: string | null };

export interface StoredDraft {
  values: SerializedValues;
  bodyJson: unknown;
  savedAt: string;
}

interface PostDraftState {
  drafts: Record<string, StoredDraft>;
  saveDraft: (key: string, draft: StoredDraft) => void;
  clearDraft: (key: string) => void;
}

/** One entry per admin per post, so two admins on one machine never collide. */
export function draftKey(userId: string | undefined, postId: string | undefined): string {
  return `${userId ?? 'anonymous'}:${postId ?? 'new'}`;
}

const DRAFT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

/** Drops entries nobody came back to, so the stored blob cannot grow forever. */
function withoutStaleDrafts(drafts: Record<string, StoredDraft>): Record<string, StoredDraft> {
  const cutoff = Date.now() - DRAFT_MAX_AGE_MS;
  return Object.fromEntries(
    Object.entries(drafts).filter(([, draft]) => new Date(draft.savedAt).getTime() > cutoff)
  );
}

export const usePostDraftStore = create<PostDraftState>()(
  persist(
    set => ({
      drafts: {},
      saveDraft: (key, draft) => set(state => ({ drafts: { ...state.drafts, [key]: draft } })),
      clearDraft: key =>
        set(state => ({
          drafts: Object.fromEntries(
            Object.entries(state.drafts).filter(([storedKey]) => storedKey !== key)
          ),
        })),
    }),
    {
      name: 'asaanrabta-blog-drafts',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => state => {
        if (state) state.drafts = withoutStaleDrafts(state.drafts);
      },
    }
  )
);

export function toStoredDraft(values: PostFormValues, bodyJson: unknown): StoredDraft {
  return {
    values: {
      ...values,
      publishedAt: values.publishedAt ? values.publishedAt.toISOString() : null,
    },
    bodyJson,
    savedAt: new Date().toISOString(),
  };
}

export function fromStoredDraft(draft: StoredDraft): PostFormValues {
  return {
    ...draft.values,
    publishedAt: draft.values.publishedAt ? new Date(draft.values.publishedAt) : null,
  };
}
