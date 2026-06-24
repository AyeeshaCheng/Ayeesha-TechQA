import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: { id: true, email: true, nickname: true, role: true, createdAt: true, lastLoginAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse({ users });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
