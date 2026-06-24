import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { categorySchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');

    const existing = await prisma.category.findUnique({ where: { name: parsed.data.name } });
    if (existing) return errorResponse(409, '该分类名称已存在');

    const category = await prisma.category.create({ data: parsed.data });
    return successResponse({ id: category.id, name: category.name }, '分类创建成功', 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
