import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { storageAdapter } from '@/lib/storage/local';
import { requireAuthor } from '@/lib/auth-utils';

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuthor();
    const id = parseInt(params.id, 10);

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) return errorResponse(404, '文件不存在');

    // Authorization: only uploader or admin
    if (media.uploaderId !== user.id && user.role !== 'admin') {
      return errorResponse(403, '无权操作');
    }

    // Delete physical file
    await storageAdapter.delete(media.storagePath);
    // Delete DB record
    await prisma.media.delete({ where: { id } });

    return successResponse(null, '文件已删除');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
