import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { siteConfigSchema } from '@/lib/validation';
import { requireAdmin } from '@/lib/auth-utils';

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();
    const parsed = siteConfigSchema.safeParse(body);
    if (!parsed.success) return errorResponse(400, parsed.error.errors[0]?.message || '参数错误');

    const { blogName, aboutContent, socialLinks, logoUrl } = parsed.data;

    const config = await prisma.siteConfig.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        blogName,
        aboutContent: aboutContent || '',
        socialLinks: JSON.stringify(socialLinks || {}),
        logoUrl: logoUrl || null,
      },
      update: {
        blogName,
        aboutContent: aboutContent || '',
        socialLinks: JSON.stringify(socialLinks || {}),
        logoUrl: logoUrl || null,
      },
    });

    return successResponse({ blogName: config.blogName }, '站点设置更新成功');
  } catch (e) {
    if (e instanceof Response) return e;
    return errorResponse(500, '服务器错误');
  }
}
