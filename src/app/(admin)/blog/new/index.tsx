import PageMeta from '@/components/PageMeta';
import { PostFormView } from '@/features/blog/components/PostFormView';

const BlogPostCreatePage = () => {
  return (
    <>
      <PageMeta title="New post" />
      <main>
        <PostFormView />
      </main>
    </>
  );
};

export default BlogPostCreatePage;
