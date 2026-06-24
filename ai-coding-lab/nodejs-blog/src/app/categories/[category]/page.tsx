import { prisma } from '@/lib/prisma';
import { ArticleList } from '@/components/article/ArticleList';
import { EmptyState } from '@/components/common/EmptyState';

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const categoryName = decodeURIComponent(params.category);

  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
      category: { name: categoryName },
    },
    orderBy: { publishedAt: 'desc' },
    include: {
      author: { select: { nickname: true, role: true } },
      category: { select: { id: true, name: true } },
      articleTags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });

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
      <h1 className="text-3xl font-bold mb-2">分类: {categoryName}</h1>
      <p className="text-gray-500 mb-8">{items.length} 篇文章</p>
      {items.length > 0 ? (
        <ArticleList articles={items} />
      ) : (
        <EmptyState icon="📂" message={`暂无"${categoryName}"分类下的文章`} />
      )}
    </div>
  );
}
