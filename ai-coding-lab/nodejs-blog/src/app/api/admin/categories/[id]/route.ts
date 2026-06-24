import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { categorySchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-utils';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');

    const existing = await prisma.category.findFirst({
      where: { name: parsed.data.name, NOT: { id } },
    });
    if (existing) return errorResponse(409, '该分类名称已存在');

    const updated = await prisma.category.update({ where: { id }, data: parsed.data });
    return successResponse({ id: updated.id, name: updated.name }, '分类更新成功');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const id = parseInt(params.id, 10);

    // Set categoryId to null for articles in this category
    await prisma.article.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
    await prisma.category.delete({ where: { id } });

    return successResponse(null, '分类已删除');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
