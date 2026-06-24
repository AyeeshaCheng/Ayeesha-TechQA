import { z } from 'zod';
import { SITE_CONFIG } from '@/config/site';

export const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(SITE_CONFIG.PASSWORD_MIN_LENGTH, `密码至少 ${SITE_CONFIG.PASSWORD_MIN_LENGTH} 位`),
  nickname: z.string().min(1, '昵称不能为空').max(50, '昵称最多 50 个字符'),
});

export const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '密码不能为空'),
});

export const articleCreateSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  content: z.string().optional().default(''),
  summary: z.string().optional().default(''),
  coverImageUrl: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImageUrl: z.string().nullable().optional(),
  categoryId: z.number().int().nullable().optional(),
  tagIds: z.array(z.number().int()).max(SITE_CONFIG.MAX_TAGS_PER_ARTICLE, `最多 ${SITE_CONFIG.MAX_TAGS_PER_ARTICLE} 个标签`).optional().default([]),
});

export const articleUpdateSchema = z.object({
  title: z.string().min(1, '标题不能为空').optional(),
  content: z.string().optional(),
  slug: z.string().optional(),
  summary: z.string().optional(),
  coverImageUrl: z.string().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  ogImageUrl: z.string().nullable().optional(),
  categoryId: z.number().int().nullable().optional(),
  tagIds: z.array(z.number().int()).max(SITE_CONFIG.MAX_TAGS_PER_ARTICLE).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, '分类名称不能为空').max(50, '分类名称最多 50 个字符'),
  description: z.string().optional().default(''),
});

export const tagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(30, '标签名称最多 30 个字符'),
});

export const siteConfigSchema = z.object({
  blogName: z.string().min(1, '博客名称不能为空').max(100),
  aboutContent: z.string().optional().default(''),
  socialLinks: z.record(z.string()).optional().default({}),
  logoUrl: z.string().nullable().optional(),
});

export const roleUpdateSchema = z.object({
  role: z.enum(['admin', 'author', 'reader'], { required_error: '无效的角色' }),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['draft', 'published', 'archived'], { required_error: '无效的状态' }),
});

export const articleQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(SITE_CONFIG.PAGE_SIZE).optional().default(SITE_CONFIG.PAGE_SIZE),
  search: z.string().optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  authorId: z.coerce.number().int().optional(),
});
