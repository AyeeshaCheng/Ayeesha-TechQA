import Link from 'next/link';
import { TagBadge } from '@/components/common/TagBadge';
import type { ArticleListItem } from '@/types/article';

interface ArticleCardProps {
  article: ArticleListItem;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200">
      {article.coverImageUrl && (
        <Link href={`/posts/${article.id}-${article.slug}`}>
          <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImageUrl}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      )}
      <div className="p-5">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
          {article.category && (
            <Link
              href={`/categories/${encodeURIComponent(article.category.name)}`}
              className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {article.category.name}
            </Link>
          )}
          <span>·</span>
          <time>{article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('zh-CN') : ''}</time>
        </div>
        <Link href={`/posts/${article.id}-${article.slug}`}>
          <h2 className="text-lg font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
            {article.title}
          </h2>
        </Link>
        {article.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{article.summary}</p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            {article.tags.slice(0, 4).map((tag) => (
              <TagBadge key={tag.id} name={tag.name} />
            ))}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {article.author.nickname} · {article.viewCount} 阅读
          </span>
        </div>
      </div>
    </article>
  );
}
