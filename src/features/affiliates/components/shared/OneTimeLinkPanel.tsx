import { LuCopy } from 'react-icons/lu';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface OneTimeLinkPanelProps {
  label: string;
  url: string;
  /** e.g. "Single use, expires on 25 Nov 2026." */
  expiryNote: string;
  emailSent: boolean;
  onDone: () => void;
}

const copyLink = async (url: string) => {
  await navigator.clipboard.writeText(url);
  toast.success('Link copied');
};

/** Shown once after a link is issued: only its hash is stored, so it can't be shown again later. */
export function OneTimeLinkPanel({
  label,
  url,
  expiryNote,
  emailSent,
  onDone,
}: OneTimeLinkPanelProps) {
  return (
    <div className="space-y-3">
      <span className="form-label block text-sm font-medium text-default-700">{label}</span>
      <div className="flex items-center gap-2">
        <Input readOnly value={url} className="font-mono text-xs" />
        <Button
          aria-label="Copy link"
          size="icon"
          className="shrink-0"
          onClick={() => copyLink(url)}
        >
          <LuCopy className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-default-500">
        {emailSent ? 'We also emailed it to them. ' : ''}
        {expiryNote} Copy it now: it won't be shown again, but you can always create a new one.
      </p>
      <Button className="w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
