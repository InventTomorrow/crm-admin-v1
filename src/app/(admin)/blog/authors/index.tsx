import PageMeta from '@/components/PageMeta';
import { AuthorsView } from '@/features/blog/components/AuthorsView';

const BlogAuthorsPage = () => {
  return (
    <>
      <PageMeta title="Blog authors" />
      <main>
        <AuthorsView />
      </main>
    </>
  );
};

export default BlogAuthorsPage;
