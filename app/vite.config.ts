import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The site is served from https://divitgangrade-lab.github.io/DigiWard/.
const BASE_PATH = '/DigiWard/';

// GitHub Pages cannot set response headers, so the production build carries the
// policy in a meta tag. Development omits it: Vite and React Fast Refresh inject
// inline scripts that a strict script-src would block.
//
// `frame-ancestors` is deliberately absent: browsers ignore it in a meta tag, so
// including it would only log a console error without preventing framing. See the
// README for the GitHub Pages header limitation.
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

export default defineConfig({
  base: BASE_PATH,
  plugins: [
    react(),
    {
      name: 'digiward-production-csp',
      apply: 'build',
      transformIndexHtml(html: string) {
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`,
        );
      },
    },
  ],
  build: {
    target: 'es2022',
    sourcemap: false,
    // Emitted to <repo>/dist, then copied to the repository root by
    // scripts/publish-pages.mjs for the branch-based GitHub Pages deployment.
    outDir: '../dist',
    emptyOutDir: true,
  },
});
