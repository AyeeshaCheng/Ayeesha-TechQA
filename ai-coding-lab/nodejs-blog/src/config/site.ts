export const SITE_CONFIG = {
  PAGE_SIZE: 20,
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  ISR_TTL: 60, // seconds
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  PASSWORD_MIN_LENGTH: 8,
  MAX_TAGS_PER_ARTICLE: 5,
  DASHBOARD_CACHE_TTL: 5 * 60 * 1000, // 5 minutes in ms
  UPLOAD_DIR: 'public/uploads',
} as const;
