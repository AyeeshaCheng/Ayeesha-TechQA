import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@blog.local' },
    update: {},
    create: {
      email: 'admin@blog.local',
      passwordHash: adminHash,
      nickname: 'Admin',
      role: 'admin',
    },
  });

  // Create author user
  const authorHash = await bcrypt.hash('author123', 12);
  const author = await prisma.user.upsert({
    where: { email: 'author@blog.local' },
    update: {},
    create: {
      email: 'author@blog.local',
      passwordHash: authorHash,
      nickname: 'Demo Author',
      role: 'author',
    },
  });

  // Create categories
  const tech = await prisma.category.upsert({
    where: { name: 'Tech' },
    update: {},
    create: { name: 'Tech', description: '技术文章' },
  });
  await prisma.category.upsert({
    where: { name: 'Life' },
    update: {},
    create: { name: 'Life', description: '生活随笔' },
  });
  await prisma.category.upsert({
    where: { name: 'Tutorial' },
    update: {},
    create: { name: 'Tutorial', description: '教程指南' },
  });

  // Create tags
  const tags = await Promise.all(
    ['javascript', 'typescript', 'react', 'nextjs', 'css'].map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  // Create sample article
  const existingArticle = await prisma.article.findFirst({ where: { slug: 'hello-world' } });
  if (!existingArticle) {
    await prisma.article.create({
      data: {
        title: 'Hello World — 我的第一篇博客',
        slug: 'hello-world',
        content: `# Hello World 👋

欢迎来到我的博客！这是我的第一篇文章。

## 关于我

我是一名全栈开发者，热爱 **TypeScript** 和 **React** 生态。

## 代码示例

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

console.log(greet('World'));
\`\`\`

## 列表

- 技术分享
- 项目心得
- 学习笔记

> 写代码是一件快乐的事情。

---

感谢阅读！`,
        summary: '欢迎来到我的个人博客，这是我的第一篇文章。',
        status: 'published',
        publishedAt: new Date(),
        viewCount: 0,
        authorId: admin.id,
        categoryId: tech.id,
        articleTags: {
          create: tags.slice(0, 3).map((t) => ({ tagId: t.id })),
        },
      },
    });
  }

  // Create site config
  await prisma.siteConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      blogName: 'Ayeesha Blog',
      aboutContent: `# 关于我 👩‍💻

我是一名热爱技术的全栈开发者，专注于 Web 开发领域。

这是我的个人博客，我会在这里分享：
- 技术文章和教程
- 项目经验和心得
- 学习笔记和总结

欢迎交流！`,
      socialLinks: JSON.stringify({
        github: 'https://github.com',
        twitter: 'https://twitter.com',
      }),
      logoUrl: null,
    },
  });

  console.log('Seed complete!');
  console.log(`  Admin: admin@blog.local / admin123`);
  console.log(`  Author: author@blog.local / author123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
