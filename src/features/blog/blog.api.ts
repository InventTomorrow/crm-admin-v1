import { apiClient, type ApiEnvelope } from '@/lib/apiClient';
import type {
  BlogAuthor,
  BlogCategory,
  BlogPostDetail,
  BlogPostListItem,
  BlogPostStatus,
  Paged,
} from '@/lib/types';

/** Mirrors the server's postInputSchema (admin/blog/blog.dto.ts). */
export interface PostInput {
  title: string;
  slug?: string;
  excerpt?: string;
  bodyHtml: string;
  bodyJson?: unknown;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  categoryId: string;
  tags: string[];
  status: BlogPostStatus;
  isFeatured: boolean;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId?: string;
  authorName?: string;
}

export interface ListPostsParams {
  page: number;
  limit: number;
  search?: string;
  status?: BlogPostStatus;
  categoryId?: string;
}

export async function listPosts(params: ListPostsParams): Promise<Paged<BlogPostListItem>> {
  const { data } = await apiClient.get<ApiEnvelope<BlogPostListItem[]>>('/admin/blog/posts', {
    params,
  });
  return { items: data.data, meta: data.meta! };
}

export async function getPost(id: string): Promise<BlogPostDetail> {
  const { data } = await apiClient.get<ApiEnvelope<BlogPostDetail>>(`/admin/blog/posts/${id}`);
  return data.data;
}

export async function createPost(input: PostInput): Promise<BlogPostDetail> {
  const { data } = await apiClient.post<ApiEnvelope<BlogPostDetail>>('/admin/blog/posts', input);
  return data.data;
}

export async function updatePost(id: string, input: Partial<PostInput>): Promise<BlogPostDetail> {
  const { data } = await apiClient.patch<ApiEnvelope<BlogPostDetail>>(
    `/admin/blog/posts/${id}`,
    input
  );
  return data.data;
}

export async function updatePostStatus(
  id: string,
  status: BlogPostStatus
): Promise<BlogPostDetail> {
  const { data } = await apiClient.patch<ApiEnvelope<BlogPostDetail>>(
    `/admin/blog/posts/${id}/status`,
    { status }
  );
  return data.data;
}

export async function deletePost(id: string) {
  await apiClient.delete(`/admin/blog/posts/${id}`);
}

export async function listCategories(): Promise<BlogCategory[]> {
  const { data } = await apiClient.get<ApiEnvelope<BlogCategory[]>>('/admin/blog/categories');
  return data.data;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  description: string | null;
}

export async function createCategory(input: CategoryInput): Promise<BlogCategory> {
  const { data } = await apiClient.post<ApiEnvelope<BlogCategory>>('/admin/blog/categories', input);
  return data.data;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<BlogCategory> {
  const { data } = await apiClient.patch<ApiEnvelope<BlogCategory>>(
    `/admin/blog/categories/${id}`,
    input
  );
  return data.data;
}

export async function deleteCategory(id: string) {
  await apiClient.delete(`/admin/blog/categories/${id}`);
}

// ─── Author API Functions ───────────────────────────────────────────────────

export interface AuthorInput {
  name: string;
  slug?: string;
  title?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export async function listAuthors(): Promise<BlogAuthor[]> {
  const { data } = await apiClient.get<ApiEnvelope<BlogAuthor[]>>('/admin/blog/authors');
  return data.data;
}

export async function createAuthor(input: AuthorInput): Promise<BlogAuthor> {
  const { data } = await apiClient.post<ApiEnvelope<BlogAuthor>>('/admin/blog/authors', input);
  return data.data;
}

export async function updateAuthor(
  id: string,
  input: Partial<AuthorInput>
): Promise<BlogAuthor> {
  const { data } = await apiClient.patch<ApiEnvelope<BlogAuthor>>(
    `/admin/blog/authors/${id}`,
    input
  );
  return data.data;
}

export async function deleteAuthor(id: string) {
  await apiClient.delete(`/admin/blog/authors/${id}`);
}

/** Server re-encodes to WebP and returns the stored URL. */
export async function uploadBlogImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ApiEnvelope<{ url: string }>>(
    '/admin/blog/uploads',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return data.data.url;
}
