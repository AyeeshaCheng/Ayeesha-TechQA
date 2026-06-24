import { SITE_CONFIG } from '@/config/site';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string, fetcher: () => Promise<T>, ttl = SITE_CONFIG.DASHBOARD_CACHE_TTL): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data as T);
  }
  return fetcher().then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + ttl });
    return data;
  });
}

export function invalidateCache(key: string): void {
  cache.delete(key);
}

export function invalidateStats(): void {
  cache.delete('dashboard:stats');
}
