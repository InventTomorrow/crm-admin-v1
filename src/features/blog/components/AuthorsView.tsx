import { PageHeader } from '@/components/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/features/auth/auth.hooks';
import { PermissionGuard } from '@/components/PermissionGuard';
import { SystemPermissions } from '@/lib/permissions';
import type { BlogAuthor } from '@/lib/types';
import { useState } from 'react';
import { LuArrowLeft, LuPlus, LuSquarePen, LuTrash2, LuUser } from 'react-icons/lu';
import { Link } from 'react-router';
import { useBlogAuthors, useDeleteAuthor, useSaveAuthor } from '../blog.hooks';

interface AuthorDraft {
  id?: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
}

const emptyDraft: AuthorDraft = { name: '', title: '', bio: '', avatarUrl: '' };

export function AuthorsView() {
  const { data: authors = [], isLoading } = useBlogAuthors();
  const saveMutation = useSaveAuthor();
  const deleteMutation = useDeleteAuthor();
  const { can, canAny } = usePermissions();
  const canEditAuthor = can(SystemPermissions.BLOG_AUTHORS_EDIT);
  const canDeleteAuthor = can(SystemPermissions.BLOG_AUTHORS_DELETE);

  const [draft, setDraft] = useState<AuthorDraft | null>(null);
  const [authorPendingDeletion, setAuthorPendingDeletion] = useState<BlogAuthor | null>(null);

  const save = () => {
    if (!draft?.name.trim()) return;
    saveMutation.mutate(
      {
        ...(draft.id ? { id: draft.id } : {}),
        input: {
          name: draft.name.trim(),
          title: draft.title.trim() || null,
          bio: draft.bio.trim() || null,
          avatarUrl: draft.avatarUrl.trim() || null,
        },
      },
      { onSuccess: () => setDraft(null) }
    );
  };

  return (
    <>
      <PageHeader
        title="Authors"
        subtitle="Blog"
        description="Manage writers and team members who author blog posts."
        action={
          <div className="flex items-center gap-2">
            <Link to="/blog" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <LuArrowLeft className="size-4" />
              Back
            </Link>
            <PermissionGuard permission={SystemPermissions.BLOG_AUTHORS_CREATE}>
              <Button size="sm" onClick={() => setDraft(emptyDraft)}>
                <LuPlus className="size-4" />
                New author
              </Button>
            </PermissionGuard>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && <p className="text-sm text-default-500">Loading…</p>}

        {!isLoading && authors.length === 0 && (
          <p className="text-sm text-default-500">
            No authors yet. Create an author to attribute articles to real team members.
          </p>
        )}

        {authors.map(author => (
          <div key={author.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {author.avatarUrl ? (
                    <img
                      src={author.avatarUrl}
                      alt={author.name}
                      className="size-10 rounded-full object-cover border border-default-200"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <LuUser className="size-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h5 className="truncate font-medium text-default-800">{author.name}</h5>
                    {author.title && <p className="text-xs text-default-500">{author.title}</p>}
                    <p className="mt-0.5 text-xs text-default-400">/{author.slug}</p>
                  </div>
                </div>

                {canAny(
                  SystemPermissions.BLOG_AUTHORS_EDIT,
                  SystemPermissions.BLOG_AUTHORS_DELETE
                ) && (
                  <div className="flex shrink-0 items-center gap-1">
                    {canEditAuthor && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${author.name}`}
                        onClick={() =>
                          setDraft({
                            id: author.id,
                            name: author.name,
                            title: author.title ?? '',
                            bio: author.bio ?? '',
                            avatarUrl: author.avatarUrl ?? '',
                          })
                        }
                      >
                        <LuSquarePen className="size-4" />
                      </Button>
                    )}
                    {canDeleteAuthor && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${author.name}`}
                        onClick={() => setAuthorPendingDeletion(author)}
                      >
                        <LuTrash2 className="size-4 text-danger" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {author.bio && (
                <p className="mt-3 text-xs text-default-600 line-clamp-3">{author.bio}</p>
              )}
              <p className="mt-3 text-xs text-default-400">
                {author.postCount ?? 0} post{(author.postCount ?? 0) === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!draft}
        onOpenChange={open => !open && setDraft(null)}
        title={draft?.id ? 'Edit author' : 'New author'}
        footer={
          <>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saveMutation.isPending}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Name" htmlFor="author-name" required>
            <Input
              id="author-name"
              autoFocus
              value={draft?.name ?? ''}
              placeholder="e.g. Sarah Jenkins"
              onChange={event =>
                setDraft(current => ({ ...(current ?? emptyDraft), name: event.target.value }))
              }
            />
          </Field>
          <Field label="Role / Title" htmlFor="author-title" hint="e.g. Senior Content Strategist">
            <Input
              id="author-title"
              value={draft?.title ?? ''}
              placeholder="Content Specialist"
              onChange={event =>
                setDraft(current => ({ ...(current ?? emptyDraft), title: event.target.value }))
              }
            />
          </Field>
          <Field label="Avatar Image URL" htmlFor="author-avatar" hint="URL to headshot photo">
            <Input
              id="author-avatar"
              value={draft?.avatarUrl ?? ''}
              placeholder="https://..."
              onChange={event =>
                setDraft(current => ({ ...(current ?? emptyDraft), avatarUrl: event.target.value }))
              }
            />
          </Field>
          <Field
            label="Bio"
            htmlFor="author-bio"
            hint="Short biography shown at the bottom of blog articles."
          >
            <Textarea
              id="author-bio"
              rows={3}
              value={draft?.bio ?? ''}
              placeholder="Sarah covers customer communication trends and WhatsApp marketing strategies."
              onChange={event =>
                setDraft(current => ({
                  ...(current ?? emptyDraft),
                  bio: event.target.value,
                }))
              }
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!authorPendingDeletion}
        onOpenChange={open => !open && setAuthorPendingDeletion(null)}
        title={`Delete "${authorPendingDeletion?.name ?? ''}"?`}
        description={
          (authorPendingDeletion?.postCount ?? 0) > 0
            ? `${authorPendingDeletion?.postCount} post(s) still use this author — reassign them first or the delete will be rejected.`
            : 'This cannot be undone.'
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!authorPendingDeletion) return;
          deleteMutation.mutate(authorPendingDeletion.id, {
            onSuccess: () => setAuthorPendingDeletion(null),
          });
        }}
      />
    </>
  );
}
