import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatDate } from '@/lib/format';
import type { BlogPostListItem, BlogPostStatus } from '@/lib/types';
import { LuEye, LuImage, LuSend, LuSquarePen, LuStar, LuTrash2, LuUndo2 } from 'react-icons/lu';
import { Link } from 'react-router';

const STATUS_TONE: Record<BlogPostStatus, BadgeTone> = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  ARCHIVED: 'warning',
};

interface PostGridCardProps {
  post: BlogPostListItem;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  isStatusPending: boolean;
  onToggleStatus: (post: BlogPostListItem) => void;
  onDelete: (post: BlogPostListItem) => void;
}

/** Card form of a row in the posts list — same actions, cover-first layout. */
export function PostGridCard({
  post,
  canEdit,
  canPublish,
  canDelete,
  isStatusPending,
  onToggleStatus,
  onDelete,
}: PostGridCardProps) {
  const isPublished = post.status === 'PUBLISHED';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-default-200 bg-card transition-colors hover:border-primary/40">
      <Link
        to={`/blog/${post.id}/preview`}
        className="flex h-44 items-center justify-center bg-default-100"
      >
        {post.coverImageUrl ? (
          /* Contain, so the card shows the whole cover rather than a crop of it. */
          <img
            src={post.coverImageUrl}
            alt=""
            className="max-h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <LuImage className="size-8 text-default-300" />
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Badge tone={STATUS_TONE[post.status]}>
            {post.status.charAt(0) + post.status.slice(1).toLowerCase()}
          </Badge>
          <span className="truncate text-xs text-default-400">{post.category.name}</span>
          {post.isFeatured && (
            <LuStar className="ms-auto size-3.5 shrink-0 fill-warning text-warning" />
          )}
        </div>

        <Link
          to={`/blog/${post.id}/edit`}
          className="mt-2.5 line-clamp-2 font-semibold text-default-800 hover:text-primary"
        >
          {post.title}
        </Link>

        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-default-500">
          {post.excerpt}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-default-400">
          <span>{post.authorName}</span>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min</span>
          {post.publishedAt && (
            <>
              <span aria-hidden>·</span>
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-1 border-t border-default-200 pt-3">
          <Link
            to={`/blog/${post.id}/preview`}
            className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            title="Preview"
            aria-label={`Preview ${post.title}`}
          >
            <LuEye className="size-4" />
          </Link>
          {canEdit && (
            <Link
              to={`/blog/${post.id}/edit`}
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
              title="Edit"
              aria-label={`Edit ${post.title}`}
            >
              <LuSquarePen className="size-4" />
            </Link>
          )}
          {canPublish && (
            <Button
              variant="ghost"
              size="icon-sm"
              title={isPublished ? 'Move back to draft' : 'Publish'}
              aria-label={isPublished ? 'Move back to draft' : 'Publish'}
              loading={isStatusPending}
              onClick={() => onToggleStatus(post)}
            >
              {isPublished ? <LuUndo2 className="size-4" /> : <LuSend className="size-4" />}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Delete"
              aria-label={`Delete ${post.title}`}
              onClick={() => onDelete(post)}
            >
              <LuTrash2 className="size-4 text-danger" />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
