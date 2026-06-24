import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { articleCreateSchema, articleQuerySchema } from '@/lib/validation';
import { generateSlug, makeSlugUnique } from '@/lib/slug';
import { requireAuthor } from '@/lib/auth-utils';
import { invalidateStats } from '@/lib/stats-cache';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuthor();
    const { searchParams } = request.nextUrl;
    const parsed = articleQuerySchema.safeParse(Object.fromEntries(searchParams));
    const { page, pageSize, status } = parsed.success ? parsed.data : { page: 1, pageSize: 20, status: undefined };

    const where: Record<string, unknown> = { authorId: user.id };
    if (status) where.status = status;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true } },
          articleTags: { include: { tag: { select: { id: true, name: true } } } },
        },
      }),
      prisma.article.count({ where }),
    ]);

    return successResponse({
      items: articles.map((a) => ({
        id: a.id, title: a.title, slug: a.slug, summary: a.summary,
        coverImageUrl: a.coverImageUrl, viewCount: a.viewCount, status: a.status,
        publishedAt: a.publishedAt?.toISOString() || null,
        category: a.category, tags: a.articleTags.map((at) => at.tag),
        author: { nickname: user.nickname, role: user.role },
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthor();
    const body = await request.json();
    const parsed = articleCreateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');

    const { title, content, summary, coverImageUrl, status, seoTitle, seoDescription, ogImageUrl, categoryId, tagIds } = parsed.data;

    if (status === 'published' && !content) return errorResponse(400, '发布文章时内容不能为空');
    if (!title) return errorResponse(400, '标题不能为空');

    let slug = generateSlug(title);
    // Check uniqueness
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) slug = makeSlugUnique(slug);

    const article = await prisma.article.create({
      data: {
        title, slug, content: content || '', summary: summary || '',
        coverImageUrl: coverImageUrl || null, status: status || 'draft',
        seoTitle: seoTitle || null, seoDescription: seoDescription || null,
        ogImageUrl: ogImageUrl || null,
        publishedAt: status === 'published' ? new Date() : null,
        authorId: user.id,
        categoryId: categoryId || null,
        articleTags: tagIds?.length ? {
          create: tagIds.map((tagId) => ({ tagId })),
        } : undefined,
      },
    });

    invalidateStats();
    return successResponse({ id: article.id, slug: article.slug, status: article.status }, '文章创建成功', 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
