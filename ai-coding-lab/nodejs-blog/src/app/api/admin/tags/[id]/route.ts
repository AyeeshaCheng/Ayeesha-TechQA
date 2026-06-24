import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { tagSchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-utils';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');

    const name = parsed.data.name.toLowerCase();
    const existing = await prisma.tag.findFirst({ where: { name, NOT: { id } } });
    if (existing) return errorResponse(409, '该标签名称已存在');

    const updated = await prisma.tag.update({ where: { id }, data: { name } });
    return successResponse({ id: updated.id, name: updated.name }, '标签更新成功');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const id = parseInt(params.id, 10);

    const count = await prisma.articleTag.count({ where: { tagId: id } });
    if (count > 0) {
      return errorResponse(409, `该标签正被 ${count} 篇文章使用，无法删除`);
    }

    await prisma.tag.delete({ where: { id } });
    return successResponse(null, '标签已删除');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
