import { PageHeader } from '@/components/PageHeader';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useCanWrite } from '@/features/auth/auth.hooks';
import type { BlogCategory } from '@/lib/types';
import { useState } from 'react';
import { LuArrowLeft, LuPlus, LuSquarePen, LuTrash2 } from 'react-icons/lu';
import { Link } from 'react-router';
import { useBlogCategories, useDeleteCategory, useSaveCategory } from '../blog.hooks';

interface CategoryDraft {
  id?: string;
  name: string;
  description: string;
}

const emptyDraft: CategoryDraft = { name: '', description: '' };

export function CategoriesView() {
  const { data: categories = [], isLoading } = useBlogCategories();
  const saveMutation = useSaveCategory();
  const deleteMutation = useDeleteCategory();
  const canWrite = useCanWrite();

  const [draft, setDraft] = useState<CategoryDraft | null>(null);
  const [categoryPendingDeletion, setCategoryPendingDeletion] = useState<BlogCategory | null>(null);

  const save = () => {
    if (!draft?.name.trim()) return;
    saveMutation.mutate(
      {
        ...(draft.id ? { id: draft.id } : {}),
        input: { name: draft.name.trim(), description: draft.description.trim() || null },
      },
      { onSuccess: () => setDraft(null) }
    );
  };

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Blog"
        description="Every post belongs to exactly one category."
        action={
          <div className="flex items-center gap-2">
            <Link to="/blog" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              <LuArrowLeft className="size-4" />
              Back
            </Link>
            {canWrite && (
              <Button size="sm" onClick={() => setDraft(emptyDraft)}>
                <LuPlus className="size-4" />
                New category
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading && <p className="text-sm text-default-500">Loading…</p>}

        {!isLoading && categories.length === 0 && (
          <p className="text-sm text-default-500">
            No categories yet. Create one before writing your first post.
          </p>
        )}

        {categories.map(category => (
          <div key={category.id} className="card">
            <div className="card-body">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h5 className="truncate font-medium text-default-800">{category.name}</h5>
                  <p className="mt-0.5 text-xs text-default-400">/{category.slug}</p>
                </div>
                {canWrite && (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${category.name}`}
                      onClick={() =>
                        setDraft({
                          id: category.id,
                          name: category.name,
                          description: category.description ?? '',
                        })
                      }
                    >
                      <LuSquarePen className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${category.name}`}
                      onClick={() => setCategoryPendingDeletion(category)}
                    >
                      <LuTrash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                )}
              </div>

              {category.description && (
                <p className="mt-2 text-sm text-default-500">{category.description}</p>
              )}
              <p className="mt-3 text-xs text-default-400">
                {category.postCount} post{category.postCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={!!draft}
        onOpenChange={open => !open && setDraft(null)}
        title={draft?.id ? 'Edit category' : 'New category'}
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
          <Field label="Name" htmlFor="category-name" required>
            <Input
              id="category-name"
              autoFocus
              value={draft?.name ?? ''}
              placeholder="WhatsApp CRM"
              onChange={event =>
                setDraft(current => ({ ...(current ?? emptyDraft), name: event.target.value }))
              }
            />
          </Field>
          <Field
            label="Description"
            htmlFor="category-description"
            hint="Shown on the category filter on the public blog."
          >
            <Textarea
              id="category-description"
              rows={2}
              value={draft?.description ?? ''}
              onChange={event =>
                setDraft(current => ({
                  ...(current ?? emptyDraft),
                  description: event.target.value,
                }))
              }
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!categoryPendingDeletion}
        onOpenChange={open => !open && setCategoryPendingDeletion(null)}
        title={`Delete "${categoryPendingDeletion?.name ?? ''}"?`}
        description={
          (categoryPendingDeletion?.postCount ?? 0) > 0
            ? `${categoryPendingDeletion?.postCount} post(s) still use this category — move them first or the delete will be rejected.`
            : 'This cannot be undone.'
        }
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!categoryPendingDeletion) return;
          deleteMutation.mutate(categoryPendingDeletion.id, {
            onSuccess: () => setCategoryPendingDeletion(null),
          });
        }}
      />
    </>
  );
}
