import { prisma } from '@/lib/prisma';
import { TagBadge } from '@/components/common/TagBadge';
import { EmptyState } from '@/components/common/EmptyState';

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { articleTags: { where: { article: { status: 'published' } } } } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">标签</h1>
      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {tags.map((tag) => (
            <TagBadge key={tag.id} name={tag.name} size="md" />
          ))}
          <span className="text-sm text-gray-400 self-center">({tags.length} 个标签)</span>
        </div>
      ) : (
        <EmptyState icon="🏷️" message="暂无标签" />
      )}
    </div>
  );
}
