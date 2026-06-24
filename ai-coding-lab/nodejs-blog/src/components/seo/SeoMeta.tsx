import type { Metadata } from 'next';

interface SeoMetaInput {
  title?: string;
  description?: string;
  ogImage?: string;
  siteName?: string;
}

export function generateSeoMeta({
  title,
  description,
  ogImage,
  siteName = 'Ayeesha Blog',
}: SeoMetaInput): Metadata {
  const metaTitle = title ? `${title} | ${siteName}` : siteName;
  return {
    title: metaTitle,
    description: description || 'A personal blog about tech, life, and more.',
    openGraph: {
      title: metaTitle,
      description: description || '',
      siteName,
      images: ogImage ? [{ url: ogImage }] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: description || '',
      images: ogImage ? [ogImage] : [],
    },
  };
}
