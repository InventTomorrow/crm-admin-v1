import PageMeta from '@/components/PageMeta';
import { LinksView } from '@/features/checkout-links/components/LinksView';

const CheckoutLinksPage = () => {
  return (
    <>
      <PageMeta title="Checkout links" />
      <main>
        <LinksView />
      </main>
    </>
  );
};

export default CheckoutLinksPage;
