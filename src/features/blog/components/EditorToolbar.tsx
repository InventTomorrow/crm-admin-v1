import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/react';
import { useEditorState } from '@tiptap/react';
import { useRef, useState, type ReactNode } from 'react';
import {
  LuAlignCenter,
  LuAlignJustify,
  LuAlignLeft,
  LuAlignRight,
  LuBold,
  LuCode,
  LuHeading2,
  LuHeading3,
  LuHeading4,
  LuImage,
  LuItalic,
  LuLink,
  LuLink2,
  LuList,
  LuListOrdered,
  LuLoaderCircle,
  LuMinus,
  LuQuote,
  LuRedo2,
  LuRemoveFormatting,
  LuStrikethrough,
  LuTable,
  LuUnderline,
  LuUndo2,
  LuUnlink,
  LuUpload,
} from 'react-icons/lu';
import { toast } from 'sonner';
import {
  DEFAULT_LINE_HEIGHT,
  LINE_HEIGHT_OPTIONS,
  type TextAlignValue,
} from './text-styling.extension';

/** Matches the server's multer limit, so an oversized file fails before the request. */
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

interface EditorToolbarProps {
  editor: Editor | null;
  isUploading: boolean;
  onUploadImage: (file: File, editor: Editor) => Promise<void>;
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'inline-flex size-8 items-center justify-center rounded-md text-default-600 transition-colors',
        'hover:bg-default-150 disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-primary/10 text-primary'
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-default-200" />;

const ALIGNMENTS: { value: TextAlignValue; label: string; icon: ReactNode }[] = [
  { value: 'left', label: 'Align left', icon: <LuAlignLeft className="size-4" /> },
  { value: 'center', label: 'Align centre', icon: <LuAlignCenter className="size-4" /> },
  { value: 'right', label: 'Align right', icon: <LuAlignRight className="size-4" /> },
  { value: 'justify', label: 'Justify', icon: <LuAlignJustify className="size-4" /> },
];

export function EditorToolbar({ editor, isUploading, onUploadImage }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Subscribes to just the flags the buttons render, so typing does not
  // re-render the whole toolbar on every keystroke.
  const state = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      bold: current?.isActive('bold') ?? false,
      italic: current?.isActive('italic') ?? false,
      underline: current?.isActive('underline') ?? false,
      strike: current?.isActive('strike') ?? false,
      h2: current?.isActive('heading', { level: 2 }) ?? false,
      h3: current?.isActive('heading', { level: 3 }) ?? false,
      h4: current?.isActive('heading', { level: 4 }) ?? false,
      bulletList: current?.isActive('bulletList') ?? false,
      orderedList: current?.isActive('orderedList') ?? false,
      blockquote: current?.isActive('blockquote') ?? false,
      codeBlock: current?.isActive('codeBlock') ?? false,
      link: current?.isActive('link') ?? false,
      inTable: current?.isActive('table') ?? false,
      alignment: (current?.getAttributes('paragraph')['textAlign'] ??
        current?.getAttributes('heading')['textAlign'] ??
        'left') as TextAlignValue,
      lineHeight: (current?.getAttributes('paragraph')['lineHeight'] ??
        current?.getAttributes('heading')['lineHeight'] ??
        DEFAULT_LINE_HEIGHT) as string,
      canUndo: current?.can().undo() ?? false,
      canRedo: current?.can().redo() ?? false,
    }),
  });

  if (!editor || !state) return null;

  const activeLineHeight =
    LINE_HEIGHT_OPTIONS.find(option => option.value === state.lineHeight) ??
    LINE_HEIGHT_OPTIONS.find(option => option.value === DEFAULT_LINE_HEIGHT)!;

  const openLinkDialog = () => {
    setLinkUrl((editor.getAttributes('link')['href'] as string) ?? 'https://');
    setLinkDialogOpen(true);
  };

  const applyLink = () => {
    const href = linkUrl.trim();
    if (!href || href === 'https://') return;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    setLinkDialogOpen(false);
  };

  const openImageDialog = () => {
    setImageUrl('https://');
    setImageAlt('');
    setImageDialogOpen(true);
  };

  const applyImageUrl = () => {
    const src = imageUrl.trim();
    if (!src || src === 'https://') return;
    if (!src.startsWith('https://')) {
      toast.error('Image links must be https — anything else is stripped on save');
      return;
    }
    editor
      .chain()
      .focus()
      .setImage({ src, alt: imageAlt.trim() || 'Article image' })
      .run();
    setImageDialogOpen(false);
  };

  const handleFileSelected = (file: File | undefined) => {
    if (file && file.size > MAX_IMAGE_BYTES) {
      toast.error('Images must be 8MB or smaller');
    } else if (file) {
      void onUploadImage(file, editor);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-default-200 bg-default-50 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          active={state.bold}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <LuBold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={state.italic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <LuItalic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={state.underline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <LuUnderline className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={state.strike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <LuStrikethrough className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <LuRemoveFormatting className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Section heading (H2)"
          active={state.h2}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <LuHeading2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Sub-heading (H3)"
          active={state.h3}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <LuHeading3 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Minor heading (H4)"
          active={state.h4}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          <LuHeading4 className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Bullet list"
          active={state.bulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <LuList className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={state.orderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <LuListOrdered className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={state.blockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <LuQuote className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Code block"
          active={state.codeBlock}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >
          <LuCode className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <LuMinus className="size-4" />
        </ToolbarButton>

        <Divider />

        {ALIGNMENTS.map(alignment => (
          <ToolbarButton
            key={alignment.value}
            label={alignment.label}
            active={state.alignment === alignment.value}
            onClick={() =>
              state.alignment === alignment.value
                ? editor.chain().focus().unsetTextAlign().run()
                : editor.chain().focus().setTextAlign(alignment.value).run()
            }
          >
            {alignment.icon}
          </ToolbarButton>
        ))}

        <Dropdown
          align="start"
          triggerLabel="Line spacing"
          triggerClassName="size-auto gap-1.5 rounded-md bg-transparent px-2 py-1.5 text-xs font-medium text-default-600 hover:bg-default-150"
          trigger={
            <>
              <LineSpacingIcon />
              {activeLineHeight.label}
            </>
          }
        >
          {LINE_HEIGHT_OPTIONS.map(option => (
            <DropdownItem
              key={option.value}
              onSelect={() => editor.chain().focus().setLineHeight(option.value).run()}
            >
              <span
                className={cn(option.value === state.lineHeight && 'font-semibold text-primary')}
              >
                {option.label} · {option.value}
              </span>
            </DropdownItem>
          ))}
          <DropdownItem onSelect={() => editor.chain().focus().unsetLineHeight().run()}>
            Reset to default
          </DropdownItem>
        </Dropdown>

        <Divider />

        <ToolbarButton label="Link" active={state.link} onClick={openLinkDialog}>
          <LuLink className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Remove link"
          disabled={!state.link}
          onClick={() => editor.chain().focus().unsetLink().run()}
        >
          <LuUnlink className="size-4" />
        </ToolbarButton>

        <Dropdown
          align="start"
          triggerLabel={isUploading ? 'Uploading image' : 'Insert image'}
          triggerClassName="size-8 rounded-md bg-transparent text-default-600 hover:bg-default-150"
          trigger={
            isUploading ? (
              <LuLoaderCircle className="size-4 animate-spin" />
            ) : (
              <LuImage className="size-4" />
            )
          }
        >
          <DropdownItem icon={LuUpload} onSelect={() => fileInputRef.current?.click()}>
            Upload from device
          </DropdownItem>
          <DropdownItem icon={LuLink2} onSelect={openImageDialog}>
            Insert by URL
          </DropdownItem>
        </Dropdown>

        <ToolbarButton
          label={state.inTable ? 'Delete table' : 'Insert table'}
          onClick={() =>
            state.inTable
              ? editor.chain().focus().deleteTable().run()
              : editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
          }
          active={state.inTable}
        >
          <LuTable className="size-4" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          label="Undo"
          disabled={!state.canUndo}
          onClick={() => editor.chain().focus().undo().run()}
        >
          <LuUndo2 className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={!state.canRedo}
          onClick={() => editor.chain().focus().redo().run()}
        >
          <LuRedo2 className="size-4" />
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={event => handleFileSelected(event.target.files?.[0])}
        />
      </div>

      <Modal
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        title="Add link"
        footer={
          <>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyLink}>Apply</Button>
          </>
        }
      >
        <Field
          label="URL"
          htmlFor="editor-link-url"
          hint="External links get rel=nofollow automatically."
        >
          <Input
            id="editor-link-url"
            value={linkUrl}
            autoFocus
            onChange={event => setLinkUrl(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyLink();
              }
            }}
          />
        </Field>
      </Modal>

      <Modal
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
        title="Insert image by URL"
        footer={
          <>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyImageUrl}>Insert</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field
            label="Image URL"
            htmlFor="editor-image-url"
            hint="Only images hosted on our own storage survive saving — upload instead when unsure."
          >
            <Input
              id="editor-image-url"
              value={imageUrl}
              autoFocus
              onChange={event => setImageUrl(event.target.value)}
            />
          </Field>
          <Field label="Alt text" htmlFor="editor-image-alt">
            <Input
              id="editor-image-alt"
              value={imageAlt}
              placeholder="Describe the image"
              onChange={event => setImageAlt(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyImageUrl();
                }
              }}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/** react-icons/lu has no line-height glyph, so this mirrors the toolbar icon set. */
function LineSpacingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 5h18M3 12h18M3 19h18" />
    </svg>
  );
}
