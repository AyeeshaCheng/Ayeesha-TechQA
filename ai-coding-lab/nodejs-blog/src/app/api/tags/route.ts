import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/api-response';

export async function GET() {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { articleTags: { where: { article: { status: 'published' } } } } },
    },
  });

  return successResponse({
    tags: tags.map((t) => ({
      id: t.id,
      name: t.name,
      articleCount: t._count.articleTags,
    })),
  });
}
