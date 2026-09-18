import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { LuDownload, LuLoaderCircle } from 'react-icons/lu';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { CSV_EXTENSION, stripCsvExtension, withCsvExtension } from '@/lib/exportFileName';

const exportFormSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1, 'Enter a file name')
    .max(120, 'Keep the name under 120 characters')
    .regex(/^[^\\/:*?"<>|]+$/, 'Remove \\ / : * ? " < > | from the name'),
});

type ExportFormValues = z.infer<typeof exportFormSchema>;

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  defaultFileName: string;
  recordCount: number;
  /** Plural noun for the summary line, e.g. "users". */
  recordLabel: string;
  /** Explains which rows are included, e.g. "12 selected" or "all matching the current filters". */
  scopeDescription: string;
  note?: string;
  isExporting: boolean;
  onExport: (fileName: string) => void;
}

export function ExportDialog({
  open,
  onOpenChange,
  title = 'Export to CSV',
  defaultFileName,
  recordCount,
  recordLabel,
  scopeDescription,
  note,
  isExporting,
  onExport,
}: ExportDialogProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} size="sm">
      {/* Keyed by the default so reopening for a different scope starts from a fresh name. */}
      <ExportForm
        key={defaultFileName}
        defaultFileName={defaultFileName}
        recordCount={recordCount}
        recordLabel={recordLabel}
        scopeDescription={scopeDescription}
        note={note}
        isExporting={isExporting}
        onCancel={() => onOpenChange(false)}
        onExport={onExport}
      />
    </Modal>
  );
}

function ExportForm({
  defaultFileName,
  recordCount,
  recordLabel,
  scopeDescription,
  note,
  isExporting,
  onCancel,
  onExport,
}: Omit<ExportDialogProps, 'open' | 'onOpenChange' | 'title'> & { onCancel: () => void }) {
  const form = useForm<ExportFormValues>({
    resolver: zodResolver(exportFormSchema),
    defaultValues: { fileName: stripCsvExtension(defaultFileName) },
  });
  const fileNameError = form.formState.errors.fileName?.message;

  return (
    <form
      onSubmit={form.handleSubmit(values => onExport(withCsvExtension(values.fileName)))}
      noValidate
      className="space-y-4"
    >
      <div className="rounded-lg border border-default-200 bg-default-150/40 px-4 py-3">
        <p className="text-2xl font-semibold tabular-nums text-default-800">
          {recordCount.toLocaleString()}
        </p>
        <p className="text-sm text-default-600">
          {recordLabel} · {scopeDescription}
        </p>
        {note && <p className="mt-1 text-xs text-default-500">{note}</p>}
      </div>

      <Field label="File name" htmlFor="exportFileName" required error={fileNameError}>
        <div className="flex items-center">
          <Input
            id="exportFileName"
            autoFocus
            invalid={Boolean(fileNameError)}
            className="rounded-e-none"
            {...form.register('fileName')}
          />
          <span className="form-input w-auto rounded-s-none border-s-0 bg-default-150 text-default-500">
            {CSV_EXTENSION}
          </span>
        </div>
      </Field>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isExporting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isExporting || recordCount === 0}>
          {isExporting ? (
            <LuLoaderCircle className="size-4 animate-spin" />
          ) : (
            <LuDownload className="size-4" />
          )}
          {isExporting ? 'Exporting…' : 'Export'}
        </Button>
      </div>
    </form>
  );
}
