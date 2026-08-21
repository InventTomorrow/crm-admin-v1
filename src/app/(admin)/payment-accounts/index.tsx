import PageMeta from '@/components/PageMeta';
import { PaymentAccountsView } from '@/features/payment-accounts/components/PaymentAccountsView';

const PaymentAccountsPage = () => {
  return (
    <>
      <PageMeta title="Payment accounts" />
      <main>
        <PaymentAccountsView />
      </main>
    </>
  );
};

export default PaymentAccountsPage;
