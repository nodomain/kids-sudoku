#!/usr/bin/env node

/**
 * build.js - Cache-busting build for GitHub Pages
 *
 * Hashes JS/CSS files, copies them to dist/ with content hash in filename,
 * rewrites index.html references. Service worker cache name also updated.
 *
 * Usage: node build.js
 * Output: dist/ directory ready to deploy
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SRC = __dirname;
const DIST = path.join(SRC, 'docs');

// Files to hash (relative to SRC)
const HASHABLE = ['app.js', 'sudoku.js', 'sounds.js', 'style.css'];
// Files to copy as-is
const COPY_AS_IS = ['manifest.json', 'icons/icon-192.png', 'icons/icon-512.png'];

function hash(content) {
  return crypto.createHash('md5').update(content).digest('hex').slice(0, 8);
}

function clean() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
  }
  fs.mkdirSync(DIST, { recursive: true });
  fs.mkdirSync(path.join(DIST, 'icons'), { recursive: true });
}

function buildHashedFiles() {
  const mapping = {}; // original name -> hashed name

  for (const file of HASHABLE) {
    const content = fs.readFileSync(path.join(SRC, file));
    const h = hash(content);
    const ext = path.extname(file);
    const base = path.basename(file, ext);
    const hashedName = `${base}.${h}${ext}`;
    fs.writeFileSync(path.join(DIST, hashedName), content);
    mapping[file] = hashedName;
    console.log(`  ${file} -> ${hashedName}`);
  }

  return mapping;
}

function buildIndexHtml(mapping) {
  let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8');

  // Replace references to hashable files
  for (const [original, hashed] of Object.entries(mapping)) {
    // Match both href="file" and src="file" patterns
    html = html.replace(new RegExp(`(href|src)="${original}"`, 'g'), `$1="${hashed}"`);
  }

  fs.writeFileSync(path.join(DIST, 'index.html'), html);
  console.log('  index.html (references rewritten)');
}

function buildServiceWorker(mapping) {
  const cacheVersion = hash(
    Object.values(mapping).sort().join(',')
  );

  const assets = [
    './',
    './index.html',
    ...Object.values(mapping).map(f => `./${f}`),
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png'
  ];

  const sw = `const CACHE_NAME = 'kids-sudoku-${cacheVersion}';
const ASSETS = ${JSON.stringify(assets, null, 2)};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Network-first for HTML (always get latest references to hashed assets)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')) {
    e.respondWith(
      fetch(e.request).then(r => {
        const clone = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return r;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Cache-first for hashed assets (immutable content)
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
`;

  fs.writeFileSync(path.join(DIST, 'sw.js'), sw);
  console.log(`  sw.js (cache: kids-sudoku-${cacheVersion})`);
}

function copyStatic() {
  for (const file of COPY_AS_IS) {
    const src = path.join(SRC, file);
    const dest = path.join(DIST, file);
    fs.copyFileSync(src, dest);
  }
  console.log(`  ${COPY_AS_IS.length} static files copied`);
}

// Run
console.log('Building kids-sudoku with cache busting...\n');
clean();
const mapping = buildHashedFiles();
buildIndexHtml(mapping);
buildServiceWorker(mapping);
copyStatic();
console.log(`\nDone! Output in docs/`);
