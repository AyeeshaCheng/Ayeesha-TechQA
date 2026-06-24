import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  // Parse numeric ID from "123-slug" format
  const id = parseInt(params.id.split('-')[0], 10);
  if (isNaN(id)) return errorResponse(404, '文章不存在');

  const article = await prisma.article.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, nickname: true } },
      category: { select: { id: true, name: true } },
      articleTags: { include: { tag: { select: { id: true, name: true } } } },
    },
  });

  if (!article || article.status === 'draft') {
    return errorResponse(404, '文章不存在');
  }

  // Increment view count
  await prisma.article.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return successResponse({
    id: article.id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    summary: article.summary,
    coverImageUrl: article.coverImageUrl,
    status: article.status,
    viewCount: article.viewCount + 1,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    ogImageUrl: article.ogImageUrl,
    publishedAt: article.publishedAt?.toISOString() || null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
    author: article.author,
    category: article.category,
    tags: article.articleTags.map((at) => at.tag),
  });
}
