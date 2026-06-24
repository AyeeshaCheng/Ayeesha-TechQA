import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { statusUpdateSchema } from '@/lib/validation';
import { requireAuthor } from '@/lib/auth-utils';
import { invalidateStats } from '@/lib/stats-cache';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuthor();
    const articleId = parseInt(params.id, 10);
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return errorResponse(404, '文章不存在');
    if (article.authorId !== user.id && user.role !== 'admin') return errorResponse(403, '无权操作');

    const body = await request.json();
    const parsed = statusUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, '无效的状态');

    const { status } = parsed.data;

    // Validate: can't publish empty content
    if (status === 'published' && !article.content) {
      return errorResponse(400, '发布文章时内容不能为空');
    }

    const updateData: Record<string, unknown> = { status };
    // Set publishedAt when first publishing
    if (status === 'published' && !article.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const updated = await prisma.article.update({ where: { id: articleId }, data: updateData });
    invalidateStats();
    return successResponse({ id: updated.id, status: updated.status }, '状态变更成功');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
