'use client';

import { useRouter } from 'next/navigation';

interface PaginationProps {
  page: number;
  totalPages: number;
  baseUrl: string;
}

export function Pagination({ page, totalPages, baseUrl }: PaginationProps) {
  const router = useRouter();

  if (totalPages <= 1) return null;

  const goToPage = (p: number) => {
    const url = baseUrl ? `${baseUrl}?page=${p}` : `?page=${p}`;
    router.push(url);
  };

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="px-3 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        上一页
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`w-9 h-9 rounded-md text-sm font-medium ${
              p === page
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-2 rounded-md text-sm border border-gray-300 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        下一页
      </button>
    </nav>
  );
}
