import { prisma } from '@/lib/prisma';
import { ArticleList } from '@/components/article/ArticleList';
import { EmptyState } from '@/components/common/EmptyState';
import { TagBadge } from '@/components/common/TagBadge';

export default async function TagPage({ params }: { params: { tag: string } }) {
  const tagName = decodeURIComponent(params.tag);

  const articles = await prisma.article.findMany({
    where: {
      status: 'published',
      articleTags: { some: { tag: { name: tagName } } },
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
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold">标签</h1>
        <TagBadge name={tagName} size="md" clickable={false} />
      </div>
      {items.length > 0 ? (
        <ArticleList articles={items} />
      ) : (
        <EmptyState icon="🏷️" message={`暂无包含"${tagName}"标签的文章`} />
      )}
    </div>
  );
}
