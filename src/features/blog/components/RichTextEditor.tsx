import { cn } from '@/lib/utils';
import Image from '@tiptap/extension-image';
import { TableKit } from '@tiptap/extension-table';
import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { uploadBlogImage } from '../blog.api';
import { EditorToolbar } from './EditorToolbar';
import { LineHeight, TextAlign } from './text-styling.extension';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string, json: unknown) => void;
  invalid?: boolean;
}

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
    link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener' } },
    codeBlock: { HTMLAttributes: { class: 'rounded-md bg-default-100 p-3 text-sm' } },
  }),
  Image.configure({ HTMLAttributes: { class: 'rounded-lg' } }),
  TableKit.configure({ table: { resizable: true } }),
  LineHeight,
  TextAlign,
  Placeholder.configure({
    placeholder: 'Write the article. Use H2 for sections — they become the table of contents.',
  }),
];

/** Body content styling; mirrors how the public site renders an article. */
const CONTENT_CLASS = cn(
  'article-editor prose prose-sm dark:prose-invert max-w-none px-4 py-3 focus:outline-none',
  'prose-headings:text-default-900 prose-headings:font-semibold',
  'prose-p:text-default-700 prose-li:text-default-700',
  'prose-a:text-primary prose-strong:text-default-900',
  'prose-blockquote:border-primary prose-blockquote:text-default-600',
  'prose-table:text-sm prose-th:bg-default-100 prose-th:text-default-800',
  'prose-code:text-default-800 prose-pre:bg-default-100 prose-pre:text-default-800',
  'prose-hr:border-default-200 prose-img:rounded-lg',
  'min-h-[26rem]'
);

export function RichTextEditor({ value, onChange, invalid }: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  // What the editor itself last emitted — syncing an external value back in
  // must never fight the cursor mid-typing.
  const lastEmittedHtml = useRef(value);
  const editorRef = useRef<Editor | null>(null);

  const uploadAndInsert = async (file: File, editor: Editor) => {
    setIsUploading(true);
    try {
      const url = await uploadBlogImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } catch {
      toast.error('Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const editor = useEditor({
    extensions: editorExtensions,
    content: value,
    editorProps: {
      attributes: { class: CONTENT_CLASS },
      handlePaste: (_view, event) => {
        const file = [...(event.clipboardData?.files ?? [])][0];
        if (!file?.type.startsWith('image/') || !editorRef.current) return false;
        event.preventDefault();
        void uploadAndInsert(file, editorRef.current);
        return true;
      },
      handleDrop: (_view, event) => {
        const file = [...((event as DragEvent).dataTransfer?.files ?? [])][0];
        if (!file?.type.startsWith('image/') || !editorRef.current) return false;
        event.preventDefault();
        void uploadAndInsert(file, editorRef.current);
        return true;
      },
    },
    onUpdate: ({ editor: updated }) => {
      const html = updated.getHTML();
      lastEmittedHtml.current = html;
      onChange(updated.isEmpty ? '' : html, updated.getJSON());
    },
  });

  editorRef.current = editor;

  // Reloading a post replaces the whole document; typing does not.
  useEffect(() => {
    if (!editor || value === lastEmittedHtml.current) return;
    lastEmittedHtml.current = value;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-md border bg-card transition-colors',
        invalid ? 'border-danger/60' : 'border-default-200 focus-within:border-primary/40'
      )}
    >
      <EditorToolbar editor={editor} isUploading={isUploading} onUploadImage={uploadAndInsert} />
      <EditorContent editor={editor} />
    </div>
  );
}
