import PageMeta from '@/components/PageMeta';
import { CategoriesView } from '@/features/blog/components/CategoriesView';

const BlogCategoriesPage = () => {
  return (
    <>
      <PageMeta title="Blog categories" />
      <main>
        <CategoriesView />
      </main>
    </>
  );
};

export default BlogCategoriesPage;
