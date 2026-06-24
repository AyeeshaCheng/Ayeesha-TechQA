import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { roleUpdateSchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-utils';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const targetId = parseInt(params.id, 10);

    if (admin.id === targetId) {
      return errorResponse(400, '不能修改自己的角色');
    }

    const body = await request.json();
    const parsed = roleUpdateSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, '无效的角色');

    const user = await prisma.user.update({
      where: { id: targetId },
      data: { role: parsed.data.role },
    });

    return successResponse({ id: user.id, role: user.role }, '角色更新成功');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
