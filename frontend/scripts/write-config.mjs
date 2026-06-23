import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

const backendUrl = (process.env.BACKEND_URL || '').replace(/\/$/, '');
const viteApiUrl = (process.env.VITE_API_URL || '').trim();
const apiUrl =
  viteApiUrl ||
  (backendUrl ? `${backendUrl}/api/v1` : '/api/v1');

mkdirSync(publicDir, { recursive: true });
writeFileSync(
  join(publicDir, 'config.js'),
  `window.__APP_CONFIG__ = { apiUrl: ${JSON.stringify(apiUrl)} };\n`
);

console.log(`[write-config] API URL set to: ${apiUrl}`);
