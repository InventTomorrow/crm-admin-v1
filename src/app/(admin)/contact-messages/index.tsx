import PageMeta from '@/components/PageMeta';
import { ContactMessagesView } from '@/features/contact-messages/components/ContactMessagesView';

const ContactMessagesPage = () => {
  return (
    <>
      <PageMeta title="Contact messages" />
      <main>
        <ContactMessagesView />
      </main>
    </>
  );
};

export default ContactMessagesPage;
