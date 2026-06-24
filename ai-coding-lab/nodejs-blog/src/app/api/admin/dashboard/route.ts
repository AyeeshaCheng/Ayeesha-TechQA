import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getCached } from '@/lib/stats-cache';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET() {
  try {
    await requireAdmin();

    const stats = await getCached('dashboard:stats', async () => {
      const [total, published, drafts, archived, totalViews, totalUsers, recent] = await Promise.all([
        prisma.article.count(),
        prisma.article.count({ where: { status: 'published' } }),
        prisma.article.count({ where: { status: 'draft' } }),
        prisma.article.count({ where: { status: 'archived' } }),
        prisma.article.aggregate({ _sum: { viewCount: true } }),
        prisma.user.count(),
        prisma.article.findMany({
          where: { status: 'published' },
          orderBy: { publishedAt: 'desc' },
          take: 5,
          select: { id: true, title: true, slug: true, viewCount: true, publishedAt: true },
        }),
      ]);

      return {
        totalArticles: total,
        publishedArticles: published,
        draftArticles: drafts,
        archivedArticles: archived,
        totalViews: totalViews._sum.viewCount || 0,
        totalUsers,
        recentArticles: recent.map((a) => ({
          id: a.id, title: a.title, slug: a.slug,
          viewCount: a.viewCount,
          publishedAt: a.publishedAt?.toISOString() || null,
        })),
      };
    });

    return successResponse(stats);
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
