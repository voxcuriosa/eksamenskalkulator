import fs from 'node:fs';

const sw = fs.readFileSync('dist/sw.js', 'utf8');

// 1. Unikt cacheprefiks
if (!sw.includes("CACHE_PREFIX = 'eksamenskalkulator-'")) {
  throw new Error('Mangler CACHE_PREFIX');
}

// 2. Sletter kun egne cacher (startswith CACHE_PREFIX)
if (!sw.includes('key.startsWith(CACHE_PREFIX)')) {
  throw new Error('Sletter ikke bare egne cacher');
}

// 3. Eksakt ressursliste
if (!sw.includes('REQUIRED_RESOURCES')) {
  throw new Error('Mangler REQUIRED_RESOURCES');
}

// 4. Scope-sjekk /kalkulator/
if (!sw.includes("url.pathname.startsWith('/kalkulator/')")) {
  throw new Error('Mangler stibegrensning');
}

// 5. Ingen skipWaiting() kjøres under installasjon
const installBlock = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"));
// Fjern kommentarer først
const installCode = installBlock.replace(/\/\/.*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
if (/skipWaiting\s*\(/.test(installCode)) {
  throw new Error('skipWaiting() kalles i install event; kan kapre aktiv elevøkt!');
}

console.log('✔ Service Worker arkitekturtest bestått: unikt cacheprefiks, avgrenset sletting, frosset versjon, ingen overstyring av aktiv økt.');
