import { prisma } from '@/lib/prisma';
import { MarkdownRenderer } from '@/lib/markdown';
import { TagBadge } from '@/components/common/TagBadge';
import { EmptyState } from '@/components/common/EmptyState';
import Link from 'next/link';
import { SITE_CONFIG } from '@/config/site';

export const revalidate = SITE_CONFIG.ISR_TTL;

export async function generateStaticParams() {
  const articles = await prisma.article.findMany({
    where: { status: 'published' },
    select: { id: true, slug: true },
    take: 20,
    orderBy: { publishedAt: 'desc' },
  });
  return articles.map((a) => ({ id: `${a.id}-${a.slug}` }));
}

export default async function ArticleDetailPage({ params }: { params: { 'id-slug': string } }) {
  const idStr = params['id-slug'].split('-')[0];
  const id = parseInt(idStr, 10);
  if (isNaN(id)) return <EmptyState icon="🔍" message="文章不存在" />;

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true } },
      category: { select: { id: true, name: true } },
      articleTags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });

  if (!article || article.status === 'draft') {
    return <EmptyState icon="🔍" message="文章不存在" />;
  }

  // Increment view count
  await prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const tags = article.articleTags.map((at) => at.tag);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <article>
        {/* Header */}
        <header className="mb-8">
          {article.category && (
            <Link
              href={`/categories/${encodeURIComponent(article.category.name)}`}
              className="inline-block text-sm text-blue-600 dark:text-blue-400 font-medium mb-2 hover:underline"
            >
              {article.category.name}
            </Link>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{article.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>{article.author.nickname}</span>
            <span>·</span>
            <time>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
            <span>·</span>
            <span>{article.viewCount + 1} 阅读</span>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tags.map((tag) => (
                <TagBadge key={tag.id} name={tag.name} size="md" />
              ))}
            </div>
          )}
        </header>

        {/* Cover Image */}
        {article.coverImageUrl && (
          <div className="mb-8 rounded-xl overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverImageUrl} alt={article.title} className="w-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="prose-custom">
          <MarkdownRenderer content={article.content} />
        </div>
      </article>
    </div>
  );
}
