import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { articleQuerySchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-utils';
import { invalidateStats } from '@/lib/stats-cache';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const parsed = articleQuerySchema.safeParse(Object.fromEntries(searchParams));
    const { page, pageSize, status, authorId } = parsed.success ? parsed.data : { page: 1, pageSize: 20 };

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (authorId) where.authorId = authorId;

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
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

    return successResponse({
      items: articles.map((a) => ({
        id: a.id, title: a.title, slug: a.slug, summary: a.summary,
        coverImageUrl: a.coverImageUrl, viewCount: a.viewCount, status: a.status,
        publishedAt: a.publishedAt?.toISOString() || null,
        category: a.category, tags: a.articleTags.map((at) => at.tag),
        author: a.author,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = request.nextUrl;
    const id = parseInt(searchParams.get('id') || '', 10);
    if (isNaN(id)) return errorResponse(400, '参数错误');

    await prisma.article.delete({ where: { id } });
    invalidateStats();
    return successResponse(null, '文章已删除');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
