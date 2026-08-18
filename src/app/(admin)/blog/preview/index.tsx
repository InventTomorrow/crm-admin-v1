import PageMeta from '@/components/PageMeta';
import { PageHeader } from '@/components/PageHeader';
import { ErrorState, LoadingState } from '@/components/states';
import { buttonVariants } from '@/components/ui/button';
import { usePost } from '@/features/blog/blog.hooks';
import { ArticlePreview } from '@/features/blog/components/ArticlePreview';
import { cn } from '@/lib/utils';
import { LuArrowLeft, LuExternalLink, LuSquarePen } from 'react-icons/lu';
import { Link, useParams } from 'react-router';

/** Marketing site origin — the live article lives outside the admin portal. */
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://asaanrabta.com').replace(/\/+$/, '');

const BlogPostPreviewPage = () => {
  const { postId = '' } = useParams<{ postId: string }>();
  const { data: post, isLoading, isError, error, refetch } = usePost(postId);

  return (
    <>
      <PageMeta title="Preview post" />
      <main>
        <PageHeader
          title="Preview"
          subtitle="Blog"
          action={
            <div className="flex items-center gap-2">
              <Link to="/blog" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <LuArrowLeft className="size-4" />
                Back
              </Link>
              {post && (
                <>
                  {post.status === 'PUBLISHED' && (
                    <a
                      href={`${SITE_URL}/blog/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ variant: 'outline', size: 'sm' })}
                    >
                      View on site
                      <LuExternalLink className="size-3.5" />
                    </a>
                  )}
                  <Link
                    to={`/blog/${post.id}/edit`}
                    className={buttonVariants({ size: 'sm' })}
                  >
                    <LuSquarePen className="size-4" />
                    Edit
                  </Link>
                </>
              )}
            </div>
          }
        />

        <div className="card">
          {isLoading ? (
            <LoadingState />
          ) : isError ? (
            <ErrorState error={error} onRetry={refetch} />
          ) : !post ? (
            <div className="card-body py-16 text-center">
              <p className="text-sm text-default-500">Post not found.</p>
              <Link
                to="/blog"
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  'mt-4 border border-default-200'
                )}
              >
                Back to blog
              </Link>
            </div>
          ) : (
            <div className="card-body py-10">
              <ArticlePreview
                post={{
                  title: post.title,
                  excerpt: post.excerpt,
                  bodyHtml: post.bodyHtml,
                  coverImageUrl: post.coverImageUrl,
                  coverImageAlt: post.coverImageAlt ?? '',
                  categoryName: post.category.name,
                  tags: post.tags,
                  authorName: post.authorName,
                  publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
                }}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default BlogPostPreviewPage;
