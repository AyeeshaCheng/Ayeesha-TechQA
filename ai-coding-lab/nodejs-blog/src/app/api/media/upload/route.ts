import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { storageAdapter } from '@/lib/storage/local';
import { requireAuthor } from '@/lib/auth-utils';
import { SITE_CONFIG } from '@/config/site';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthor();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) return errorResponse(400, '请选择文件');

    // Validate MIME type
    if (!SITE_CONFIG.ALLOWED_MIME_TYPES.includes(file.type as typeof SITE_CONFIG.ALLOWED_MIME_TYPES[number])) {
      return errorResponse(415, '不支持的格式，仅支持 JPEG、PNG、WebP');
    }

    // Validate file size
    if (file.size > SITE_CONFIG.MAX_UPLOAD_SIZE) {
      return errorResponse(413, `文件过大，最大允许 ${SITE_CONFIG.MAX_UPLOAD_SIZE / 1024 / 1024}MB`);
    }

    const result = await storageAdapter.upload(file, file.name);

    const media = await prisma.media.create({
      data: {
        originalName: file.name,
        storagePath: result.storagePath,
        url: result.url,
        fileSize: file.size,
        mimeType: file.type,
        uploaderId: user.id,
      },
    });

    return successResponse({
      id: media.id,
      url: media.url,
      originalName: media.originalName,
      fileSize: media.fileSize,
      mimeType: media.mimeType,
    }, '上传成功', 201);
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '上传失败');
  }
}
