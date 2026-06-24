import { prisma } from '@/lib/prisma';
import { MarkdownRenderer } from '@/lib/markdown';

export default async function AboutPage() {
  const config = await prisma.siteConfig.findFirst({ where: { id: 1 } });

  let socialLinks: Record<string, string> = {};
  try { socialLinks = JSON.parse(config?.socialLinks || '{}'); } catch { /* ignore */ }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">关于</h1>
      {config?.aboutContent ? (
        <MarkdownRenderer content={config.aboutContent} />
      ) : (
        <p className="text-gray-500">暂无介绍内容。</p>
      )}
      {Object.keys(socialLinks).length > 0 && (
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-3">社交链接</h2>
          <div className="flex gap-4">
            {Object.entries(socialLinks).map(([name, url]) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline capitalize"
              >
                {name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
