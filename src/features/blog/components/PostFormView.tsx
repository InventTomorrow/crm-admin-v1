import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/states';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { ToggleRow } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useMe } from '@/features/auth/auth.hooks';
import type { BlogPostDetail, BlogPostStatus } from '@/lib/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  LuArchive,
  LuArrowLeft,
  LuEllipsisVertical,
  LuExternalLink,
  LuEye,
  LuRotateCcw,
  LuSave,
  LuSend,
  LuTrash2,
} from 'react-icons/lu';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router';
import {
  useBlogCategories,
  usePostDraftPersistence,
  usePosts,
  useSavePost,
  useUpdatePostStatus,
} from '../blog.hooks';
import { draftKey, fromStoredDraft } from '../post-draft.store';
import {
  emptyPostDefaults,
  formValuesToPostInput,
  postFormSchema,
  postToFormValues,
  type PostFormValues,
} from '../post-form.schema';
import { ArticlePreview } from './ArticlePreview';
import { CoverImageUploader } from './CoverImageUploader';
import { RichTextEditor } from './RichTextEditor';
import { TagsInput } from './TagsInput';

interface PostFormViewProps {
  post?: BlogPostDetail;
}

/** Marketing site origin — "View on site" must leave the admin portal. */
const SITE_URL = (import.meta.env.VITE_SITE_URL ?? 'https://asaanrabta.com').replace(/\/+$/, '');

const STATUS_TONE: Record<BlogPostStatus, BadgeTone> = {
  PUBLISHED: 'success',
  DRAFT: 'neutral',
  ARCHIVED: 'warning',
};

/** Every state-changing action is confirmed against a summary of the post. */
type PendingAction = 'draft' | 'publish' | 'discard' | 'archive';

const ACTION_COPY: Record<
  PendingAction,
  { title: string; description: string; confirmLabel: string; destructive: boolean }
> = {
  draft: {
    title: 'Save as draft?',
    description: 'Stored on the server but kept off the public site until you publish it.',
    confirmLabel: 'Save draft',
    destructive: false,
  },
  publish: {
    title: 'Publish this post?',
    description: 'It goes live on the marketing site as soon as the cache refreshes.',
    confirmLabel: 'Publish now',
    destructive: false,
  },
  discard: {
    title: 'Discard your unsaved changes?',
    description:
      'The copy held on this device is deleted. Anything already saved on the server stays as it is.',
    confirmLabel: 'Discard changes',
    destructive: true,
  },
  archive: {
    title: 'Archive this post?',
    description:
      'It leaves the public site and moves to the archived list. You can restore it later.',
    confirmLabel: 'Archive post',
    destructive: true,
  },
};

/** Card shell used for every block on the page. */
function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="card-body space-y-4">
        <h5 className="text-sm font-semibold text-default-800">{title}</h5>
        {children}
      </div>
    </div>
  );
}

function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <span className={current > max ? 'text-danger' : 'text-default-400'}>
      {current}/{max}
    </span>
  );
}

/** Opening lines of the body, used in the confirmation when no excerpt was written. */
function bodySummary(bodyHtml: string, maxLength = 200): string {
  const text = bodyHtml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength).trimEnd()}…` : text;
}

function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Waits for the signed-in admin, whose id scopes the on-device draft. */
export function PostFormView({ post }: PostFormViewProps) {
  const { data: signedInAdmin, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="card">
        <LoadingState />
      </div>
    );
  }

  return (
    <PostForm
      {...(post ? { post } : {})}
      adminId={signedInAdmin?.id}
      adminName={
        [signedInAdmin?.firstName, signedInAdmin?.lastName].filter(Boolean).join(' ') ||
        'AsaanRabta Team'
      }
    />
  );
}

function PostForm({
  post,
  adminId,
  adminName,
}: {
  post?: BlogPostDetail;
  adminId: string | undefined;
  adminName: string;
}) {
  const navigate = useNavigate();
  const { data: categories = [] } = useBlogCategories();
  const saveMutation = useSavePost();
  const statusMutation = useUpdatePostStatus();

  // Tags already in use across the blog, offered as suggestions.
  const { data: recentPosts } = usePosts({ page: 1, limit: 100 });
  const knownTags = useMemo(
    () => [...new Set((recentPosts?.items ?? []).flatMap(item => item.tags))].sort(),
    [recentPosts]
  );

  const { restoredDraft, lastSavedAt, queueDraftWrite, discardStoredDraft } =
    usePostDraftPersistence(draftKey(adminId, post?.id));

  const [isRestoredNoticeOpen, setIsRestoredNoticeOpen] = useState(!!restoredDraft);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const bodyJsonRef = useRef<unknown>(
    restoredDraft ? restoredDraft.bodyJson : (post?.bodyJson ?? null)
  );
  const [isBodyTouched, setIsBodyTouched] = useState(!!restoredDraft);

  // A reset feeds every field back through the watcher; without this the store
  // would immediately re-create the draft we just cleared.
  const skipDraftWrite = useRef(false);
  const loadedPostId = useRef(post?.id);

  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: restoredDraft
      ? fromStoredDraft(restoredDraft)
      : post
        ? postToFormValues(post)
        : emptyPostDefaults(adminName),
  });

  const resetForm = (values: PostFormValues) => {
    skipDraftWrite.current = true;
    reset(values);
    setTimeout(() => {
      skipDraftWrite.current = false;
    }, 0);
  };

  // Only a genuinely different post replaces the form — a background refetch
  // must never overwrite what is being typed.
  useEffect(() => {
    if (!post || post.id === loadedPostId.current) return;
    loadedPostId.current = post.id;
    resetForm(postToFormValues(post));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post]);

  useEffect(() => {
    const subscription = watch(values => {
      if (skipDraftWrite.current) return;
      queueDraftWrite(values as PostFormValues, bodyJsonRef.current);
    });
    return () => subscription.unsubscribe();
  }, [watch, queueDraftWrite]);

  const title = watch('title');
  const excerpt = watch('excerpt');
  const seoTitle = watch('seoTitle');
  const seoDescription = watch('seoDescription');
  const status = watch('status');
  const coverImageUrl = watch('coverImageUrl');

  const isEditing = !!post;
  const currentStatus = post?.status ?? status;
  const isPublished = post?.status === 'PUBLISHED';
  const isBusy = saveMutation.isPending || statusMutation.isPending;

  /** Validates first, so the confirmation never opens on a post that cannot save. */
  const requestSave = (action: 'draft' | 'publish') =>
    handleSubmit(
      () => setPendingAction(action),
      () => toast.error('Fix the highlighted fields first')
    )();

  const runSave = async (action: 'draft' | 'publish') => {
    const values = getValues();
    const nextStatus: BlogPostStatus = action === 'publish' ? 'PUBLISHED' : 'DRAFT';
    const publishedAt =
      action === 'publish' ? (values.publishedAt ?? new Date()) : values.publishedAt;

    const saved = await saveMutation.mutateAsync({
      ...(post ? { id: post.id } : {}),
      input: formValuesToPostInput(
        { ...values, status: nextStatus, publishedAt },
        isBodyTouched ? bodyJsonRef.current : undefined
      ),
    });

    discardStoredDraft();
    setIsRestoredNoticeOpen(false);
    setPendingAction(null);
    loadedPostId.current = saved.id;
    resetForm(postToFormValues(saved));
    if (!post) navigate(`/blog/${saved.id}/edit`, { replace: true });
  };

  const runDiscard = () => {
    discardStoredDraft();
    setIsRestoredNoticeOpen(false);
    setPendingAction(null);
    if (post) {
      resetForm(postToFormValues(post));
      bodyJsonRef.current = post.bodyJson ?? null;
      setIsBodyTouched(false);
      toast.success('Unsaved changes discarded');
      return;
    }
    navigate('/blog');
  };

  const runArchive = async () => {
    if (!post) return;
    await statusMutation.mutateAsync({ id: post.id, status: 'ARCHIVED' });
    discardStoredDraft();
    setPendingAction(null);
    navigate('/blog');
  };

  const confirmPendingAction = () => {
    if (pendingAction === 'discard') return runDiscard();
    if (pendingAction === 'archive') return void runArchive();
    if (pendingAction) return void runSave(pendingAction);
  };

  const previewData = () => {
    const values = getValues();
    return {
      title: values.title,
      excerpt: values.excerpt,
      bodyHtml: values.bodyHtml,
      coverImageUrl: values.coverImageUrl,
      coverImageAlt: values.coverImageAlt,
      categoryName: categories.find(category => category.id === values.categoryId)?.name ?? '',
      tags: values.tags,
      authorName: values.authorName,
      publishedAt: values.publishedAt,
    };
  };

  const summary = () => {
    const values = getValues();
    return {
      title: values.title.trim() || 'Untitled post',
      excerpt: values.excerpt.trim() || bodySummary(values.bodyHtml),
      categoryName: categories.find(category => category.id === values.categoryId)?.name ?? '—',
    };
  };

  return (
    <form onSubmit={event => event.preventDefault()}>
      <PageHeader
        title={isEditing ? 'Edit post' : 'New post'}
        subtitle="Blog"
        action={
          <div className="flex flex-wrap items-center gap-2">
            {isDirty && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
                <span className="size-1.5 rounded-full bg-warning" aria-hidden />
                Unsaved
              </span>
            )}

            <Link
              to="/blog"
              title="Back to posts"
              aria-label="Back to posts"
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
            >
              <LuArrowLeft className="size-4" />
            </Link>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
            >
              <LuEye className="size-4" />
              Preview
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={saveMutation.isPending && pendingAction === 'draft'}
              onClick={() => void requestSave('draft')}
            >
              <LuSave className="size-4" />
              {isPublished ? 'Move to draft' : 'Save as draft'}
            </Button>

            <Button
              type="button"
              size="sm"
              loading={saveMutation.isPending && pendingAction === 'publish'}
              onClick={() => void requestSave('publish')}
            >
              <LuSend className="size-4" />
              {isPublished ? 'Update live post' : 'Publish'}
            </Button>

            {/* Destructive and rare actions stay out of the main row. */}
            <Dropdown
              trigger={<LuEllipsisVertical className="size-4" />}
              triggerLabel="More actions"
              triggerClassName="size-7.5 bg-default-100 text-default-500 hover:bg-default-200"
              menuClassName="w-52"
            >
              <DropdownItem
                icon={LuTrash2}
                destructive
                disabled={isBusy}
                onSelect={() => setPendingAction('discard')}
              >
                Discard changes
              </DropdownItem>
              {isEditing && post.status !== 'ARCHIVED' && (
                <DropdownItem
                  icon={LuArchive}
                  destructive
                  disabled={isBusy}
                  onSelect={() => setPendingAction('archive')}
                >
                  Archive post
                </DropdownItem>
              )}
            </Dropdown>
          </div>
        }
      />

      {isRestoredNoticeOpen && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
          <p className="text-sm text-default-700">
            <span className="font-semibold">Unsaved work restored</span> from this device
            {restoredDraft ? ` — last edited at ${formatClockTime(restoredDraft.savedAt)}` : ''}.
            Nothing has been saved to the server yet.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="border border-default-200"
            onClick={() => setPendingAction('discard')}
          >
            <LuRotateCcw className="size-3.5" />
            {post ? 'Revert to saved version' : 'Start fresh'}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <FormCard title="Content">
            <Field label="Title" htmlFor="post-title" required error={errors.title?.message}>
              <Input
                id="post-title"
                placeholder="How to reply faster on WhatsApp"
                invalid={!!errors.title}
                {...register('title')}
              />
            </Field>

            <Field
              label="URL slug"
              htmlFor="post-slug"
              error={errors.slug?.message}
              hint={
                isEditing
                  ? 'Changing this breaks existing links and shared posts.'
                  : 'Leave empty to generate it from the title.'
              }
            >
              <Input
                id="post-slug"
                placeholder="reply-faster-on-whatsapp"
                invalid={!!errors.slug}
                {...register('slug')}
              />
            </Field>

            <Field
              label="Excerpt"
              htmlFor="post-excerpt"
              error={errors.excerpt?.message}
              hint="Shown on cards and in search results. Left empty, the opening lines are used."
            >
              <Textarea
                id="post-excerpt"
                rows={2}
                invalid={!!errors.excerpt}
                {...register('excerpt')}
              />
              <div className="mt-1 text-end text-xs">
                <CharacterCount current={excerpt?.length ?? 0} max={320} />
              </div>
            </Field>

            <Field label="Article" required error={errors.bodyHtml?.message}>
              <Controller
                control={control}
                name="bodyHtml"
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    invalid={!!errors.bodyHtml}
                    onChange={(html, json) => {
                      bodyJsonRef.current = json;
                      setIsBodyTouched(true);
                      field.onChange(html);
                    }}
                  />
                )}
              />
            </Field>
          </FormCard>

          <FormCard title="Search appearance">
            <Field
              label="SEO title"
              htmlFor="post-seo-title"
              error={errors.seoTitle?.message}
              hint="Falls back to the post title when empty."
            >
              <Input
                id="post-seo-title"
                placeholder={title || 'Post title'}
                invalid={!!errors.seoTitle}
                {...register('seoTitle')}
              />
              <div className="mt-1 text-end text-xs">
                <CharacterCount current={seoTitle?.length ?? 0} max={70} />
              </div>
            </Field>

            <Field
              label="Meta description"
              htmlFor="post-seo-description"
              error={errors.seoDescription?.message}
              hint="Falls back to the excerpt when empty."
            >
              <Textarea
                id="post-seo-description"
                rows={2}
                invalid={!!errors.seoDescription}
                {...register('seoDescription')}
              />
              <div className="mt-1 text-end text-xs">
                <CharacterCount current={seoDescription?.length ?? 0} max={180} />
              </div>
            </Field>
          </FormCard>
        </div>

        <div className="space-y-4">
          <FormCard title="Publishing">
            <div className="flex items-center justify-between">
              <span className="text-sm text-default-600">Status</span>
              <Badge tone={STATUS_TONE[currentStatus]}>
                {currentStatus.charAt(0) + currentStatus.slice(1).toLowerCase()}
              </Badge>
            </div>

            <p className="text-xs text-default-400">
              {lastSavedAt
                ? `Kept on this device at ${formatClockTime(lastSavedAt)} — use Save as draft or Publish to store it on the server.`
                : 'Changes are kept on this device as you type.'}
            </p>

            <Controller
              control={control}
              name="publishedAt"
              render={({ field }) => (
                <Field
                  label="Publish date"
                  hint={
                    isPublished
                      ? 'Shown on the article and in search results.'
                      : 'Left empty, it is stamped when you publish.'
                  }
                >
                  <DatePicker value={field.value} onChange={field.onChange} />
                </Field>
              )}
            />

            <Controller
              control={control}
              name="isFeatured"
              render={({ field }) => (
                <ToggleRow
                  label="Featured"
                  description="Featured posts fill the landing page strip."
                  checked={field.value}
                  onChange={event => field.onChange(event.target.checked)}
                />
              )}
            />

            {isEditing && (
              <div className="border-t border-default-200 pt-3">
                {post.status === 'PUBLISHED' ? (
                  <a
                    href={`${SITE_URL}/blog/${post.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    View on site <LuExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-xs text-default-400">Not on the public site yet.</span>
                )}
              </div>
            )}
          </FormCard>

          <FormCard title="Organisation">
            <Field
              label="Category"
              htmlFor="post-category"
              required
              error={errors.categoryId?.message}
              hint={categories.length === 0 ? 'Create a category first.' : undefined}
            >
              <Select id="post-category" invalid={!!errors.categoryId} {...register('categoryId')}>
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Field
                  label="Tags"
                  error={errors.tags?.message}
                  hint="Tags decide which posts are suggested as related."
                >
                  <TagsInput
                    value={field.value}
                    onChange={field.onChange}
                    suggestions={knownTags}
                    invalid={!!errors.tags}
                  />
                </Field>
              )}
            />

            <Field label="Author" htmlFor="post-author" required error={errors.authorName?.message}>
              <Input id="post-author" invalid={!!errors.authorName} {...register('authorName')} />
            </Field>
          </FormCard>

          <FormCard title="Cover image">
            <CoverImageUploader
              value={coverImageUrl}
              onChange={url => setValue('coverImageUrl', url, { shouldDirty: true })}
            />
            <Field
              label="Alt text"
              htmlFor="post-cover-alt"
              error={errors.coverImageAlt?.message}
              hint="Describe the image for screen readers and image search."
            >
              <Input
                id="post-cover-alt"
                invalid={!!errors.coverImageAlt}
                {...register('coverImageAlt')}
              />
            </Field>
          </FormCard>
        </div>
      </div>

      <Modal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        size="xl"
        title="Preview"
        footer={
          <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="max-h-[70vh] overflow-y-auto pe-1">
          <ArticlePreview post={previewData()} />
        </div>
      </Modal>

      <Modal
        open={pendingAction !== null}
        onOpenChange={open => !open && setPendingAction(null)}
        title={pendingAction ? ACTION_COPY[pendingAction].title : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingAction(null)} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              variant={
                pendingAction && ACTION_COPY[pendingAction].destructive ? 'destructive' : 'default'
              }
              loading={isBusy}
              onClick={confirmPendingAction}
            >
              {pendingAction ? ACTION_COPY[pendingAction].confirmLabel : ''}
            </Button>
          </>
        }
      >
        {pendingAction && (
          <div className="space-y-3">
            <p className="text-sm text-default-500">{ACTION_COPY[pendingAction].description}</p>
            <div className="rounded-lg border border-default-200 bg-default-50 p-3">
              <p className="text-sm font-semibold text-default-800">{summary().title}</p>
              <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-default-500">
                {summary().excerpt || 'No excerpt yet.'}
              </p>
              <p className="mt-2 text-xs text-default-400">Category: {summary().categoryName}</p>
            </div>
          </div>
        )}
      </Modal>
    </form>
  );
}
