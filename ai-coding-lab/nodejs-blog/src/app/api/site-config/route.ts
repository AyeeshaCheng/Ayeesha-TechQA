import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/api-response';

export async function GET() {
  let config = await prisma.siteConfig.findFirst({ where: { id: 1 } });
  if (!config) {
    config = await prisma.siteConfig.create({
      data: { id: 1, blogName: 'Ayeesha Blog', aboutContent: '', socialLinks: '{}' },
    });
  }

  let socialLinks: Record<string, string> = {};
  try {
    socialLinks = JSON.parse(config.socialLinks);
  } catch { /* ignore parse errors */ }

  return successResponse({
    blogName: config.blogName,
    aboutContent: config.aboutContent,
    socialLinks,
    logoUrl: config.logoUrl,
  });
}
