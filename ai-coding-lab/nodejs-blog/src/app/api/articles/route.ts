import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { articleQuerySchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const parsed = articleQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return errorResponse(400, '参数错误');
  }

  const { page, pageSize, search, category, tag, status } = parsed.data;

  const where: Record<string, unknown> = {
    status: status || 'published',
  };

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { content: { contains: search } },
    ];
  }

  if (category) {
    where.category = { name: category };
  }

  if (tag) {
    where.articleTags = { some: { tag: { name: tag } } };
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { nickname: true, role: true } },
        category: { select: { id: true, name: true } },
        articleTags: { include: { tag: { select: { id: true, name: true } } } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  const items = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    summary: a.summary,
    coverImageUrl: a.coverImageUrl,
    viewCount: a.viewCount,
    publishedAt: a.publishedAt?.toISOString() || null,
    author: a.author,
    category: a.category,
    tags: a.articleTags.map((at) => at.tag),
  }));

  return successResponse({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
}
