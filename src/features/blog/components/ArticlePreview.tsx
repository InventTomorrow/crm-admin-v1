import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { LuCalendar, LuClock, LuUser } from 'react-icons/lu';

export interface ArticlePreviewData {
  title: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  categoryName: string;
  tags: string[];
  authorName: string;
  publishedAt: Date | null;
}

const READING_WORDS_PER_MINUTE = 220;

/** Mirrors the server's readingMinutesFrom, so the preview shows the real figure. */
function readingMinutes(bodyHtml: string): number {
  const words = bodyHtml
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / READING_WORDS_PER_MINUTE));
}

/**
 * Renders a post the way the public site does. The HTML is either straight from
 * Tiptap (whose schema cannot produce scripts) or already server-sanitized, so
 * there is no unvetted markup reaching this surface.
 */
export function ArticlePreview({ post }: { post: ArticlePreviewData }) {
  const hasBody = post.bodyHtml.trim().length > 0;

  return (
    <article className="mx-auto max-w-3xl">
      {post.coverImageUrl && (
        <img
          src={post.coverImageUrl}
          alt={post.coverImageAlt || post.title}
          className="mb-8 max-h-[28rem] w-full rounded-2xl border border-default-200 bg-default-100 object-contain"
        />
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs text-default-500">
        <Badge tone="primary">{post.categoryName || 'Uncategorised'}</Badge>
        <span className="inline-flex items-center gap-1.5">
          <LuClock className="size-3.5" />
          {readingMinutes(post.bodyHtml)} min read
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LuUser className="size-3.5" />
          {post.authorName || 'AsaanRabta Team'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <LuCalendar className="size-3.5" />
          {post.publishedAt ? formatDate(post.publishedAt.toISOString()) : 'Not published yet'}
        </span>
      </div>

      <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-default-900 sm:text-4xl">
        {post.title || 'Untitled post'}
      </h1>

      {post.excerpt && (
        <p className="mt-4 text-lg leading-relaxed text-default-600">{post.excerpt}</p>
      )}

      <hr className="my-8 border-default-200" />

      {hasBody ? (
        <div className="article-preview" dangerouslySetInnerHTML={{ __html: post.bodyHtml }} />
      ) : (
        <p className="py-12 text-center text-sm text-default-400">
          Nothing written yet — the article body is empty.
        </p>
      )}

      {post.tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2 border-t border-default-200 pt-6">
          {post.tags.map(tag => (
            <span
              key={tag}
              className="rounded-full border border-default-200 px-3 py-1 text-xs text-default-500"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
