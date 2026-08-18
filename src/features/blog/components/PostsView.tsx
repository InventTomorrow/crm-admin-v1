import { PageHeader } from '@/components/PageHeader';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Select } from '@/components/ui/select';
import { usePermissions } from '@/features/auth/auth.hooks';
import { PermissionGuard } from '@/components/PermissionGuard';
import { SystemPermissions } from '@/lib/permissions';
import { formatDate } from '@/lib/format';
import type { BlogPostListItem, BlogPostStatus } from '@/lib/types';
import { useDebounce } from '@/lib/useDebounce';
import type { ColumnDef } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import {
  LuEye,
  LuFolderTree,
  LuPlus,
  LuSend,
  LuSquarePen,
  LuStar,
  LuTrash2,
  LuUndo2,
} from 'react-icons/lu';
import { Link } from 'react-router';
import { useBlogCategories, useDeletePost, usePosts, useUpdatePostStatus } from '../blog.hooks';
import { PostGridCard } from './PostGridCard';

const STATUS_TONE: Record<BlogPostStatus, BadgeTone> = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  ARCHIVED: 'warning',
};

export function PostsView() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | ''>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [postPendingDeletion, setPostPendingDeletion] = useState<BlogPostListItem | null>(null);

  const search = useDebounce(searchInput, 300);
  const { can } = usePermissions();
  const canEditPost = can(SystemPermissions.BLOG_EDIT);
  const canPublishPost = can(SystemPermissions.BLOG_PUBLISH);
  const canDeletePost = can(SystemPermissions.BLOG_DELETE);
  const { data: categories = [] } = useBlogCategories();
  const deleteMutation = useDeletePost();
  const statusMutation = useUpdatePostStatus();

  const { data, isLoading, isError, error, refetch } = usePosts({
    page,
    limit: pageSize,
    ...(search ? { search } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
  });

  const columns = useMemo<ColumnDef<BlogPostListItem, unknown>[]>(
    () => [
      {
        id: 'title',
        header: 'Post',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.coverImageUrl ? (
              <img
                src={row.original.coverImageUrl}
                alt=""
                className="size-10 shrink-0 rounded-md object-cover"
              />
            ) : (
              <span className="size-10 shrink-0 rounded-md bg-default-100" />
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <Link
                  to={`/blog/${row.original.id}/edit`}
                  className="truncate font-medium text-default-800 hover:text-primary"
                >
                  {row.original.title}
                </Link>
                {row.original.isFeatured && (
                  <LuStar className="size-3.5 shrink-0 fill-warning text-warning" />
                )}
              </span>
              <span className="block truncate text-xs text-default-400">/{row.original.slug}</span>
            </span>
          </div>
        ),
      },
      {
        id: 'category',
        accessorFn: post => post.category.name,
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-sm text-default-600">{row.original.category.name}</span>
        ),
      },
      {
        id: 'status',
        accessorFn: post => post.status,
        header: 'Status',
        cell: ({ row }) => (
          <Badge tone={STATUS_TONE[row.original.status]}>
            {row.original.status.charAt(0) + row.original.status.slice(1).toLowerCase()}
          </Badge>
        ),
      },
      {
        id: 'published',
        accessorFn: post => post.publishedAt ?? '',
        header: 'Published',
        cell: ({ row }) => (
          <span className="text-sm text-default-500">
            {row.original.publishedAt ? formatDate(row.original.publishedAt) : '—'}
          </span>
        ),
      },
      {
        id: 'read',
        accessorFn: post => post.readingMinutes,
        header: 'Read',
        cell: ({ row }) => (
          <span className="text-xs text-default-500">{row.original.readingMinutes} min</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const post = row.original;
          const isPublished = post.status === 'PUBLISHED';
          return (
            <div className="flex items-center justify-end gap-1">
              <Link
                to={`/blog/${post.id}/preview`}
                className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                title="Preview"
                aria-label={`Preview ${post.title}`}
              >
                <LuEye className="size-4" />
              </Link>
              {canEditPost && (
                <Link
                  to={`/blog/${post.id}/edit`}
                  className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                  aria-label={`Edit ${post.title}`}
                >
                  <LuSquarePen className="size-4" />
                </Link>
              )}
              {canPublishPost && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title={isPublished ? 'Move back to draft' : 'Publish'}
                  aria-label={isPublished ? 'Move back to draft' : 'Publish'}
                  loading={statusMutation.isPending && statusMutation.variables?.id === post.id}
                  onClick={() =>
                    statusMutation.mutate({
                      id: post.id,
                      status: isPublished ? 'DRAFT' : 'PUBLISHED',
                    })
                  }
                >
                  {isPublished ? <LuUndo2 className="size-4" /> : <LuSend className="size-4" />}
                </Button>
              )}
              {canDeletePost && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  title="Delete"
                  aria-label={`Delete ${post.title}`}
                  onClick={() => setPostPendingDeletion(post)}
                >
                  <LuTrash2 className="size-4 text-danger" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [canEditPost, canPublishPost, canDeletePost, statusMutation]
  );

  return (
    <>
      <PageHeader
        title="Blog"
        description="Articles published on the marketing site."
        action={
          <div className="flex items-center gap-2">
            <PermissionGuard permission={SystemPermissions.BLOG_CATEGORIES_VIEW}>
              <Link
                to="/blog/categories"
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                <LuFolderTree className="size-4" />
                Categories
              </Link>
            </PermissionGuard>
            <PermissionGuard permission={SystemPermissions.BLOG_CREATE}>
              <Link to="/blog/new" className={buttonVariants({ size: 'sm' })}>
                <LuPlus className="size-4" />
                New post
              </Link>
            </PermissionGuard>
          </div>
        }
      />

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        total={data?.meta.total ?? 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={size => {
          setPageSize(size);
          setPage(1);
        }}
        search={searchInput}
        onSearchChange={value => {
          setSearchInput(value);
          setPage(1);
        }}
        searchPlaceholder="Search posts…"
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={refetch}
        emptyMessage="No posts yet."
        getRowId={post => post.id}
        renderGridItem={post => (
          <PostGridCard
            post={post}
            canEdit={canEditPost}
            canPublish={canPublishPost}
            canDelete={canDeletePost}
            isStatusPending={statusMutation.isPending && statusMutation.variables?.id === post.id}
            onToggleStatus={target =>
              statusMutation.mutate({
                id: target.id,
                status: target.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
              })
            }
            onDelete={setPostPendingDeletion}
          />
        )}
        toolbarFilters={
          <>
            <Select
              value={statusFilter}
              className="w-auto"
              aria-label="Filter by status"
              onChange={event => {
                setStatusFilter(event.target.value as BlogPostStatus | '');
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
            <Select
              value={categoryFilter}
              className="w-auto"
              aria-label="Filter by category"
              onChange={event => {
                setCategoryFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </>
        }
      />

      <ConfirmDialog
        open={!!postPendingDeletion}
        onOpenChange={open => !open && setPostPendingDeletion(null)}
        title={`Delete "${postPendingDeletion?.title ?? ''}"?`}
        description="This cannot be undone. Any links to this article will start returning 404."
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (!postPendingDeletion) return;
          deleteMutation.mutate(postPendingDeletion.id, {
            onSuccess: () => setPostPendingDeletion(null),
          });
        }}
      />
    </>
  );
}
