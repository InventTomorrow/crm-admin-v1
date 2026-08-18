import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { LuImagePlus, LuLoaderCircle, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { uploadBlogImage } from '../blog.api';

interface CoverImageUploaderProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function CoverImageUploader({ value, onChange }: CoverImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    try {
      onChange(await uploadBlogImage(file));
    } catch {
      toast.error('Cover upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="group relative overflow-hidden rounded-lg border border-default-200 bg-default-100">
          {/* Shown whole rather than cropped to 16:9, so what you upload is what you check. */}
          <img src={value} alt="Cover preview" className="mx-auto max-h-96 w-full object-contain" />
          <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-2">
            <Button
              type="button"
              size="sm"
              variant="soft"
              onClick={() => fileInputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              type="button"
              size="sm"
              variant="soft-danger"
              onClick={() => onChange(null)}
              aria-label="Remove cover image"
            >
              <LuTrash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default-300 text-default-500 transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
        >
          {isUploading ? (
            <LuLoaderCircle className="size-6 animate-spin" />
          ) : (
            <LuImagePlus className="size-6" />
          )}
          <span className="text-sm">{isUploading ? 'Uploading…' : 'Upload cover image'}</span>
          <span className="text-xs text-default-400">16:9 works best — 1600×900 or larger</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
        onChange={event => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}
