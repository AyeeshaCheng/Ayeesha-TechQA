import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/api-response';

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { articles: { where: { status: 'published' } } } },
    },
  });

  return successResponse({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      articleCount: c._count.articles,
    })),
  });
}
