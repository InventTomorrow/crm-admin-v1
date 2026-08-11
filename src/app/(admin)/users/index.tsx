import PageMeta from '@/components/PageMeta';
import { UsersView } from '@/features/users/components/UsersView';

const UsersPage = () => {
  return (
    <>
      <PageMeta title="Users" />
      <main>
        <UsersView />
      </main>
    </>
  );
};

export default UsersPage;
