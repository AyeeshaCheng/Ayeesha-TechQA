import type { ArticleStatus } from '@/types/article';

const statusConfig: Record<ArticleStatus, { label: string; className: string }> = {
  draft: { label: '草稿', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  published: { label: '已发布', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  archived: { label: '已归档', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const config = statusConfig[status] || statusConfig.draft;
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
