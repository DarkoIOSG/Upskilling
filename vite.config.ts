import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'upskilling-offline',
      enforce: 'post',
      generateBundle(_, bundle) {
        const assets = [
          '/',
          '/icon.svg',
          '/manifest.webmanifest',
          '/icon-192.png',
          '/icon-512.png',
          '/apple-touch-icon.png',
          ...Object.keys(bundle).map((name) => `/${name}`),
        ];
        const version = createHash('sha256').update(assets.join()).digest('hex').slice(0, 12);
        const source = readFileSync(new URL('./scripts/service-worker.js', import.meta.url), 'utf8')
          .replace('__CACHE_VERSION__', version)
          .replace('__PRECACHE_ASSETS__', JSON.stringify(assets));
        this.emitFile({ type: 'asset', fileName: 'sw.js', source });
      },
    },
  ],
  worker: { format: 'es' },
});
