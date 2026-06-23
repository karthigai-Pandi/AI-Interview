/**
 * Ensures API base URL always ends with /api/v1
 * e.g. https://my-app.onrender.com -> https://my-app.onrender.com/api/v1
 */
export function normalizeApiUrl(url: string): string {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '/api/v1') return '/api/v1';
  if (trimmed.endsWith('/api/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
  if (/^https?:\/\//i.test(trimmed)) return `${trimmed}/api/v1`;
  if (trimmed.startsWith('/')) return trimmed.includes('/api') ? trimmed : `/api/v1`;
  return `/api/v1`;
}

declare global {
  interface Window {
    __APP_CONFIG__?: {
      apiUrl?: string;
    };
  }
}

export function getApiUrl(): string {
  const raw =
    window.__APP_CONFIG__?.apiUrl ||
    import.meta.env.VITE_API_URL ||
    '/api/v1';
  return normalizeApiUrl(raw);
}
