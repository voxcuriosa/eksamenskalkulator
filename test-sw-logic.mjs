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

// 5. Ingen skipWaiting() under installasjon
const installBlock = sw.slice(sw.indexOf("addEventListener('install'"), sw.indexOf("addEventListener('activate'"));
const installCode = installBlock.replace(/\/\/.*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
if (/skipWaiting\s*\(/.test(installCode)) {
  throw new Error('skipWaiting() kalles i install event; kan kapre aktiv elevøkt!');
}

// 6. Ingen generell nettverksfallback i fetch
if (sw.includes('return fetch(event.request)')) {
  throw new Error('sw.js inneholder fortsatt generell nettverksfallback!');
}

// 7. Avvisning av ukjente baner
if (!sw.includes('ALLOWED_PATHS.has(url.pathname)')) {
  throw new Error('sw.js mangler kontroll mot ALLOWED_PATHS!');
}

console.log('✔ Service Worker arkitekturtest v0.4.0 bestått: frosset versjon, ingen nettverksfallback, avgrenset scope og cacher.');
