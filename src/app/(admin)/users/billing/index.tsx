import PageBreadcrumb from '@/components/PageBreadcrumb';
import PageMeta from '@/components/PageMeta';
import { UserBillingView } from '@/features/invoices/components/UserBillingView';

const UserBillingPage = () => {
  return (
    <>
      <PageMeta title="User billing" />
      <main>
        <PageBreadcrumb title="Billing" subtitle="Users" />
        <UserBillingView />
      </main>
    </>
  );
};

export default UserBillingPage;
