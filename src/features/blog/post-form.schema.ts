import type { BlogPostDetail } from '@/lib/types';
import { z } from 'zod';
import type { PostInput } from './blog.api';

/** Mirrors the server's postInputSchema; empty optional fields map to null on submit. */
export const postFormSchema = z.object({
  title: z.string().trim().min(4, 'At least 4 characters').max(160, 'Keep it under 160 characters'),
  slug: z
    .string()
    .trim()
    .max(90, 'Keep it under 90 characters')
    .regex(/^[a-z0-9]*(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and dashes only'),
  excerpt: z.string().trim().max(320, 'Keep it under 320 characters'),

  bodyHtml: z.string().min(1, 'Write the article before saving'),

  coverImageUrl: z.string().nullable(),
  coverImageAlt: z.string().trim().max(180, 'Keep it under 180 characters'),

  categoryId: z.string().min(1, 'Pick a category'),
  tags: z.array(z.string().trim().min(1).max(40)).max(12, 'Twelve tags is plenty'),

  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  isFeatured: z.boolean(),
  publishedAt: z.date().nullable(),

  seoTitle: z.string().trim().max(70, 'Google truncates past ~60 characters'),
  seoDescription: z.string().trim().max(180, 'Google truncates past ~160 characters'),
  authorId: z.string().nullable(),
  authorName: z.string().trim().max(80),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

export const emptyPostDefaults = (authorName: string): PostFormValues => ({
  title: '',
  slug: '',
  excerpt: '',
  bodyHtml: '',
  coverImageUrl: null,
  coverImageAlt: '',
  categoryId: '',
  tags: [],
  status: 'DRAFT',
  isFeatured: false,
  publishedAt: null,
  seoTitle: '',
  seoDescription: '',
  authorId: null,
  authorName,
});

export function postToFormValues(post: BlogPostDetail): PostFormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    bodyHtml: post.bodyHtml,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt ?? '',
    categoryId: post.categoryId ?? post.category.id,
    tags: post.tags,
    status: post.status,
    isFeatured: post.isFeatured,
    publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
    seoTitle: post.seoTitle ?? '',
    seoDescription: post.seoDescription ?? '',
    authorId: post.authorId ?? null,
    authorName: post.authorName,
  };
}

/** bodyJson comes straight from the editor, so it stays outside the zod schema. */
export function formValuesToPostInput(values: PostFormValues, bodyJson: unknown): PostInput {
  const trimmedSlug = values.slug.trim();
  const trimmedExcerpt = values.excerpt.trim();

  return {
    title: values.title.trim(),
    ...(trimmedSlug ? { slug: trimmedSlug } : {}),
    ...(trimmedExcerpt ? { excerpt: trimmedExcerpt } : {}),
    bodyHtml: values.bodyHtml,
    bodyJson,
    coverImageUrl: values.coverImageUrl,
    coverImageAlt: values.coverImageAlt.trim() || null,
    categoryId: values.categoryId,
    tags: values.tags,
    status: values.status,
    isFeatured: values.isFeatured,
    publishedAt: values.publishedAt ? values.publishedAt.toISOString() : null,
    seoTitle: values.seoTitle.trim() || null,
    seoDescription: values.seoDescription.trim() || null,
    authorId: values.authorId || undefined,
    authorName: values.authorName.trim() || undefined,
  };
}
