export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImageUrl: string | null;
  viewCount: number;
  publishedAt: string | null;
  author: { nickname: string; role: string };
  category: { id: number; name: string } | null;
  tags: { id: number; name: string }[];
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
  status: ArticleStatus;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: number; nickname: string };
}

export interface ArticleCreateInput {
  title: string;
  content: string;
  summary?: string;
  coverImageUrl?: string;
  status?: ArticleStatus;
  seoTitle?: string;
  seoDescription?: string;
  ogImageUrl?: string;
  categoryId?: number | null;
  tagIds?: number[];
}

export interface ArticleUpdateInput extends Partial<ArticleCreateInput> {
  slug?: string;
}

export interface Tag {
  id: number;
  name: string;
  articleCount?: number;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  articleCount?: number;
  createdAt?: string;
}
