import { ArticleCard } from './ArticleCard';
import type { ArticleListItem } from '@/types/article';

interface ArticleListProps {
  articles: ArticleListItem[];
}

export function ArticleList({ articles }: ArticleListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
