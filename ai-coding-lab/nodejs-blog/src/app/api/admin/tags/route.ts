import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { tagSchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = tagSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');

    const name = parsed.data.name.toLowerCase();
    const existing = await prisma.tag.findUnique({ where: { name } });
    if (existing) return errorResponse(409, '该标签已存在');

    const tag = await prisma.tag.create({ data: { name } });
    return successResponse({ id: tag.id, name: tag.name }, '标签创建成功', 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
