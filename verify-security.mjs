import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// 1. Kontroller beregningsmotoren (engine.mjs)
const engineSource = fs.readFileSync('dist/engine.mjs', 'utf8');
assert.doesNotMatch(engineSource, /\b(?:eval|fetch|XMLHttpRequest|WebSocket|EventSource|Worker|SharedWorker|Function)\s*\(/);
assert.doesNotMatch(engineSource, /\b(?:sendBeacon|serviceWorker|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|document\.write)\b/);
assert.doesNotMatch(engineSource, /https?:\/\//);

// 2. Kontroller brukergrensesnittkoden (app.mjs)
const appSource = fs.readFileSync('dist/app.mjs', 'utf8');
assert.doesNotMatch(appSource, /\b(?:eval|fetch|XMLHttpRequest|WebSocket|EventSource|Worker|SharedWorker|Function)\s*\(/);
assert.doesNotMatch(appSource, /\b(?:sendBeacon|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|document\.write)\b/);
assert.doesNotMatch(appSource, /https?:\/\//);

// 3. Kontroller Service Worker (sw.js)
const swSource = fs.readFileSync('dist/sw.js', 'utf8');
assert.doesNotMatch(swSource, /\b(?:eval|Function|XMLHttpRequest|WebSocket|EventSource|SharedWorker)\s*\(/);
assert.doesNotMatch(swSource, /\b(?:sendBeacon|localStorage|sessionStorage|indexedDB|document)\b/);
assert.doesNotMatch(swSource, /https?:\/\/(?!voxcuriosa\.no)/);

// 4. Kontroller index.html og CSP
const html = fs.readFileSync('dist/index.html', 'utf8');
assert.match(html, /connect-src 'none'/);
assert.match(html, /worker-src 'self'/);
assert.match(html, /manifest-src 'self'/);
assert.doesNotMatch(html, /\son[a-z]+=|javascript:|<iframe|<form|<object|<embed/i);

// Kontroller at ingen inline-stil eksisterer
assert.doesNotMatch(html, /<style\b/i);

const localAssets = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map(m => m[1])
  .filter(link => !link.startsWith('http'))
  .sort();

// index.html skal utelukkende laste app-ressurser (ikke info.html eller SEB-fil direkte)
assert.deepEqual(
  localAssets,
  ['app.mjs', 'manifest.webmanifest', 'styles.css']
);

// 5. Kontroller info.html
const infoHtml = fs.readFileSync('dist/info.html', 'utf8');
assert.doesNotMatch(infoHtml, /<style\b/i);
assert.doesNotMatch(infoHtml, /\sstyle="/i);
assert.match(infoHtml, /<link rel="stylesheet" href="info\.css">/);
assert.match(infoHtml, /<h1\b[^>]*>Sikkerhetstiltak, SEB og kostnadsscenario<\/h1>/);

// 6. Oppdater SHA-256 sjekksummer for alle distribusjonsfiler (unntatt SHA256SUMS.json selv)
const hashes = {};
for (const file of fs.readdirSync('dist').sort()) {
  if (file === 'SHA256SUMS.json') continue;
  hashes[file] = crypto.createHash('sha256').update(fs.readFileSync('dist/' + file)).digest('hex');
}
fs.writeFileSync('SHA256SUMS.json', JSON.stringify(hashes, null, 2) + '\n');
fs.writeFileSync('dist/SHA256SUMS.json', JSON.stringify(hashes, null, 2) + '\n');
console.log('Statisk sikkerhetskontroll bestått. SHA-256-oversikt skrevet for alle filer i dist/.');
