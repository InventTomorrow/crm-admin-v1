import { LuDownload, LuLoaderCircle } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import type { InvoiceListItem } from '@/lib/types';
import { useDownloadInvoice } from '../invoices.hooks';

export function DownloadInvoiceButton({
  invoice,
}: {
  invoice: Pick<InvoiceListItem, 'id' | 'number'>;
}) {
  const downloadMutation = useDownloadInvoice();
  return (
    <Button
      variant="soft"
      size="icon-sm"
      title="Download PDF"
      aria-label={`Download invoice ${invoice.number}`}
      disabled={downloadMutation.isPending}
      onClick={() => downloadMutation.mutate(invoice)}
    >
      {downloadMutation.isPending ? (
        <LuLoaderCircle className="size-4 animate-spin" />
      ) : (
        <LuDownload className="size-4" />
      )}
    </Button>
  );
}
