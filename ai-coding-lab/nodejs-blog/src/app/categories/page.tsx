import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { EmptyState } from '@/components/common/EmptyState';

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { articles: { where: { status: 'published' } } } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">分类</h1>
      {categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${encodeURIComponent(cat.name)}`}
              className="block p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                </div>
                <span className="text-sm text-gray-400">{cat._count.articles} 篇</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState icon="📂" message="暂无分类" />
      )}
    </div>
  );
}
