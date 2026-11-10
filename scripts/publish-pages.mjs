// GitHub Pages for this repository deploys from the root of main. Vite builds
// into dist/, and this script copies the public build into the served root.
// Run it through `npm run publish` after changes, then commit the result.
//
// Source lives in app/. Never edit the generated root index.html or assets/
// by hand; change app/ and publish again.

import { cpSync, existsSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const appPublic = join(root, 'app', 'public');

if (!existsSync(join(dist, 'index.html')) || !existsSync(join(dist, 'assets'))) {
  console.error('No production build found. Run "npm run build" first, or use "npm run publish".');
  process.exit(1);
}

// Hashed bundles are replaced wholesale so stale assets cannot linger.
rmSync(join(root, 'assets'), { recursive: true, force: true });
cpSync(join(dist, 'assets'), join(root, 'assets'), { recursive: true });
cpSync(join(dist, 'index.html'), join(root, 'index.html'));

// Jekyll must not process the generated site.
writeFileSync(join(root, '.nojekyll'), '');

// Public files have to sit at the served root, not only under app/public.
for (const entry of readdirSync(appPublic)) {
  if (entry === '.nojekyll') continue;
  const target = join(root, entry);
  rmSync(target, { recursive: true, force: true });
  cpSync(join(appPublic, entry), target, { recursive: true });
}

console.log('Published the production build to the repository root for GitHub Pages.');
