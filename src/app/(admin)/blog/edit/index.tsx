import PageMeta from '@/components/PageMeta';
import { ErrorState, LoadingState } from '@/components/states';
import { buttonVariants } from '@/components/ui/button';
import { PostFormView } from '@/features/blog/components/PostFormView';
import { usePost } from '@/features/blog/blog.hooks';
import { cn } from '@/lib/utils';
import { Link, useParams } from 'react-router';

const BlogPostEditPage = () => {
  const { postId = '' } = useParams<{ postId: string }>();
  const { data: post, isLoading, isError, error, refetch } = usePost(postId);

  return (
    <>
      <PageMeta title="Edit post" />
      <main>
        {isLoading ? (
          <div className="card">
            <LoadingState />
          </div>
        ) : isError ? (
          <div className="card">
            <ErrorState error={error} onRetry={refetch} />
          </div>
        ) : !post ? (
          <div className="card">
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
          </div>
        ) : (
          <PostFormView post={post} />
        )}
      </main>
    </>
  );
};

export default BlogPostEditPage;
