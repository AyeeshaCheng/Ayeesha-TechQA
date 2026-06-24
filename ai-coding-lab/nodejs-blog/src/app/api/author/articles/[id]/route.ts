import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { articleUpdateSchema } from '@/lib/validation';
import { generateSlug } from '@/lib/slug';
import { requireAuthor } from '@/lib/auth-utils';
import { invalidateStats } from '@/lib/stats-cache';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuthor();
    const articleId = parseInt(params.id, 10);
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return errorResponse(404, '文章不存在');
    if (article.authorId !== user.id && user.role !== 'admin') return errorResponse(403, '无权操作');

    const body = await request.json();
    const parsed = articleUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');

    const { title, content, slug: manualSlug, summary, coverImageUrl, seoTitle, seoDescription, ogImageUrl, categoryId, tagIds } = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) { updateData.title = title; updateData.slug = manualSlug || generateSlug(title); }
    if (content !== undefined) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (coverImageUrl !== undefined) updateData.coverImageUrl = coverImageUrl;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (ogImageUrl !== undefined) updateData.ogImageUrl = ogImageUrl;
    if (categoryId !== undefined) updateData.categoryId = categoryId;

    // Handle tags if provided
    if (tagIds !== undefined) {
      // Remove existing and recreate
      await prisma.articleTag.deleteMany({ where: { articleId } });
      if (tagIds.length > 0) {
        await prisma.articleTag.createMany({
          data: tagIds.map((tagId) => ({ articleId, tagId })),
        });
      }
    }

    const updated = await prisma.article.update({ where: { id: articleId }, data: updateData });
    invalidateStats();
    return successResponse({ id: updated.id, slug: updated.slug }, '文章更新成功');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuthor();
    const articleId = parseInt(params.id, 10);
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) return errorResponse(404, '文章不存在');
    if (article.authorId !== user.id && user.role !== 'admin') return errorResponse(403, '无权操作');

    await prisma.article.delete({ where: { id: articleId } });
    invalidateStats();
    return successResponse(null, '文章已删除');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
