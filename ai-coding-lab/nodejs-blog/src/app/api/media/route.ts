import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { storageAdapter } from '@/lib/storage/local';
import { requireAuthor } from '@/lib/auth-utils';

export async function GET() {
  try {
    const user = await requireAuthor();
    const where = user.role === 'admin' ? {} : { uploaderId: user.id };

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, url: true, originalName: true, fileSize: true,
        mimeType: true, createdAt: true,
      },
    });

    return successResponse({ media });
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
