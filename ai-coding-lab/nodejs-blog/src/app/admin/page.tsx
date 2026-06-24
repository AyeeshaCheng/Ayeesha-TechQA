import { prisma } from '@/lib/prisma';
import { getCached } from '@/lib/stats-cache';

async function getDashboardStats() {
  return getCached('dashboard:stats', async () => {
    const [total, published, drafts, archived, totalViews, totalUsers, recentArticles] = await Promise.all([
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
      recentArticles: recentArticles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        viewCount: a.viewCount,
        publishedAt: a.publishedAt?.toISOString() || null,
      })),
    };
  });
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  const cards = [
    { label: '文章总数', value: stats.totalArticles, icon: '📝' },
    { label: '已发布', value: stats.publishedArticles, icon: '✅' },
    { label: '草稿', value: stats.draftArticles, icon: '📄' },
    { label: '已归档', value: stats.archivedArticles, icon: '📦' },
    { label: '总阅读量', value: stats.totalViews.toLocaleString(), icon: '👁️' },
    { label: '用户总数', value: stats.totalUsers, icon: '👥' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">仪表盘</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cards.map((card) => (
          <div
            key={card.label}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
          >
            <span className="text-2xl">{card.icon}</span>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-semibold mb-4">最近发布</h2>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-850">
            <tr>
              <th className="text-left p-3 font-medium">标题</th>
              <th className="text-right p-3 font-medium">阅读</th>
              <th className="text-right p-3 font-medium">发布时间</th>
            </tr>
          </thead>
          <tbody>
            {stats.recentArticles.map((a) => (
              <tr key={a.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="p-3">
                  <a href={`/posts/${a.id}-${a.slug}`} className="hover:text-blue-600">
                    {a.title}
                  </a>
                </td>
                <td className="p-3 text-right text-gray-500">{a.viewCount}</td>
                <td className="p-3 text-right text-gray-500">
                  {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('zh-CN') : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
