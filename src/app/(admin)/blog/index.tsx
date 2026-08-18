import PageMeta from '@/components/PageMeta';
import { PostsView } from '@/features/blog/components/PostsView';

const BlogPage = () => {
  return (
    <>
      <PageMeta title="Blog" />
      <main>
        <PostsView />
      </main>
    </>
  );
};

export default BlogPage;
