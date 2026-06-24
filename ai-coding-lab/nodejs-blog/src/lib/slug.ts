import { pinyin } from 'pinyin-pro';

export function generateSlug(title: string): string {
  // Check if title contains Chinese characters
  const hasChinese = /[一-鿿]/.test(title);

  let slug: string;
  if (hasChinese) {
    // Convert Chinese to pinyin
    slug = pinyin(title, { toneType: 'none', type: 'array' }).join('-');
  } else {
    slug = title;
  }

  // Normalize: lowercase, replace spaces/special chars with dash
  slug = slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  // Fallback if slug is empty after processing
  if (!slug) slug = 'untitled';

  return slug;
}

export function makeSlugUnique(baseSlug: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${baseSlug}-${suffix}`;
}
