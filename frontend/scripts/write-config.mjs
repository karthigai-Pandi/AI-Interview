import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const repoRoot = join(__dirname, '..', '..');

function normalizeApiUrl(url) {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  if (!trimmed || trimmed === '/api/v1') return '/api/v1';
  if (trimmed.endsWith('/api/v1')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/v1`;
  if (/^https?:\/\//i.test(trimmed)) return `${trimmed}/api/v1`;
  return '/api/v1';
}

const backendUrl = (process.env.BACKEND_URL || '').replace(/\/$/, '');
const viteApiUrl = (process.env.VITE_API_URL || '').trim();
const apiUrl = normalizeApiUrl(viteApiUrl || (backendUrl ? backendUrl : '/api/v1'));

mkdirSync(publicDir, { recursive: true });
writeFileSync(
  join(publicDir, 'config.js'),
  `window.__APP_CONFIG__ = { apiUrl: ${JSON.stringify(apiUrl)} };\n`
);

// Patch root vercel.json: proxy /api to backend when BACKEND_URL is set
try {
  const vercelPath = join(repoRoot, 'vercel.json');
  const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
  vercel.rewrites = backendUrl
    ? [
        { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
        { source: '/(.*)', destination: '/index.html' },
      ]
    : [{ source: '/(.*)', destination: '/index.html' }];
  writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`);
  if (backendUrl) {
    console.log(`[write-config] Vercel API proxy -> ${backendUrl}/api/*`);
  }
} catch (err) {
  console.warn('[write-config] Could not update vercel.json:', err.message);
}

console.log(`[write-config] API URL set to: ${apiUrl}`);
