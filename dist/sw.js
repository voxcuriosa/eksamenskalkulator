// Service Worker for Eksamenskalkulator 2027 (avgrenset til /kalkulator/)
const APP_VERSION = '0.3.0';
const CACHE_PREFIX = 'eksamenskalkulator-';
const CURRENT_CACHE_NAME = `${CACHE_PREFIX}v${APP_VERSION}`;

// Eksakt liste over nødvendige statiske ressurser som utgjør denne utgivelsen
const REQUIRED_RESOURCES = [
  './',
  './index.html',
  './styles.css',
  './app.mjs',
  './engine.mjs',
  './release.mjs',
  './manifest.webmanifest'
];

// Nøyaktig liste over tillatte normaliserte baner under opprinnelsen
const ALLOWED_PATHS = new Set([
  '/kalkulator/',
  '/kalkulator/index.html',
  '/kalkulator/styles.css',
  '/kalkulator/app.mjs',
  '/kalkulator/engine.mjs',
  '/kalkulator/release.mjs',
  '/kalkulator/manifest.webmanifest'
]);

self.addEventListener('install', (event) => {
  // Installer alle ressurser for denne utgivelsen samlet
  // skipWaiting() kalles IKKE her; en pågående elevøkt skal aldri forstyrres
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME).then((cache) => {
      return cache.addAll(REQUIRED_RESOURCES);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Slett kun gamle cacher som tilhører denne kalkulatoren (CACHE_PREFIX)
  // Rører ALDRI andre cacher på samme opprinnelse (f.eks. voxcuriosa-v8)
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith(CACHE_PREFIX) && key !== CURRENT_CACHE_NAME) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Kommunikasjon med MessageChannel eller event.source for verifisering
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'VERIFY_CACHE') {
    const requestId = data.requestId;
    caches.open(CURRENT_CACHE_NAME).then(async (cache) => {
      const verifiedList = [];
      let allPresent = true;
      for (const asset of REQUIRED_RESOURCES) {
        const match = await cache.match(asset);
        if (!match) {
          allPresent = false;
        } else {
          verifiedList.push(asset);
        }
      }

      const responsePayload = {
        type: 'VERIFY_CACHE_RESULT',
        requestId: requestId,
        version: APP_VERSION,
        cacheName: CURRENT_CACHE_NAME,
        verified: allPresent,
        verifiedCount: verifiedList.length,
        requiredCount: REQUIRED_RESOURCES.length
      };

      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(responsePayload);
      } else if (event.source) {
        event.source.postMessage(responsePayload);
      }
    }).catch((err) => {
      const errorPayload = {
        type: 'VERIFY_CACHE_RESULT',
        requestId: requestId,
        version: APP_VERSION,
        verified: false,
        error: err.message
      };
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage(errorPayload);
      } else if (event.source) {
        event.source.postMessage(errorPayload);
      }
    });
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Eksterne forespørsler blokkeres med 403 Forbidden for kontrollerte sider
  if (url.origin !== self.location.origin) {
    event.respondWith(new Response('Ekstern tilgang er blokkert i kalkulatormodus.', {
      status: 403,
      statusText: 'Forbidden',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    }));
    return;
  }

  // 2. Forespørsler utenfor /kalkulator/
  if (!url.pathname.startsWith('/kalkulator/')) {
    // La workeren ignorere forespørsler til andre nettstedsdeler
    return;
  }

  // 3. Kontroller om forespørselen er en av kalkulatorens tillatte ressursadresser
  // info.html, .seb og sjekksumfiler skal IKKE caches eller betjenes som programressurser av denne workeren
  const isAllowedPath = ALLOWED_PATHS.has(url.pathname);

  // Hvis det er en ukjent ressurs eller query på en kontrollert kalkulatorside: avvis uten nettverksfallback!
  if (!isAllowedPath) {
    event.respondWith(new Response('Uautorisert ressursadresse i eksamensmodus.', {
      status: 404,
      statusText: 'Not Found',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    }));
    return;
  }

  // 4. Betjen strengt fra frosset versjonscache
  event.respondWith(
    caches.open(CURRENT_CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Hvis en påkrevd ressurs mangler i ferdig installert cache:
        // Skal IKKE repareres med vilkårlig nettverkshenting inn i gammel versjon!
        return new Response('Ressursen mangler i den frosne utgivelsescachen.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
