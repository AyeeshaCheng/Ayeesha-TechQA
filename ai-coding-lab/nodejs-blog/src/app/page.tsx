import { prisma } from '@/lib/prisma';
import { ArticleList } from '@/components/article/ArticleList';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from '@/components/common/PaginationList';
import { SITE_CONFIG } from '@/config/site';

export const revalidate = SITE_CONFIG.ISR_TTL;

export default async function HomePage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const pageSize = SITE_CONFIG.PAGE_SIZE;

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        author: { select: { nickname: true, role: true } },
        category: { select: { id: true, name: true } },
        articleTags: { include: { tag: { select: { id: true, name: true } } } },
      },
    }),
    prisma.article.count({ where: { status: 'published' } }),
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">最新文章</h1>
      {items.length > 0 ? (
        <>
          <ArticleList articles={items} />
          <Pagination page={page} totalPages={Math.ceil(total / pageSize)} baseUrl="" />
        </>
      ) : (
        <EmptyState icon="📝" message="暂无文章" />
      )}
    </div>
  );
}
