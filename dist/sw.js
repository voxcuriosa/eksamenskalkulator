// Service Worker for Eksamenskalkulator 2027 (avgrenset til /kalkulator/)
const APP_VERSION = 'v0.2.0';
const CACHE_PREFIX = 'eksamenskalkulator-';
const CURRENT_CACHE_NAME = `${CACHE_PREFIX}${APP_VERSION}`;

// Eksakt liste over nødvendige statiske ressurser for denne versjonen
const REQUIRED_RESOURCES = [
  './',
  './index.html',
  './styles.css',
  './app.mjs',
  './engine.mjs',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  // Installer alle ressurser for denne utgivelsen samlet
  // skipWaiting() kalles IKKE ubetinget her; unngår at en ufullstendig eller ny versjon kaprer en aktiv elev-økt
  event.waitUntil(
    caches.open(CURRENT_CACHE_NAME).then((cache) => {
      return cache.addAll(REQUIRED_RESOURCES);
    })
  );
});

self.addEventListener('activate', (event) => {
  // Slett kun gamle cacher som tilhører denne kalkulatoren (CACHE_PREFIX)
  // Rører ALDRI andre cacher på voxcuriosa.no
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

// Meldinger mellom siden og service worker for verifisering og kontrollert oppdatering
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || !data.type) return;

  if (data.type === 'VERIFY_CACHE') {
    // Verifiser eksplisitt at alle påkrevde filer faktisk ligger i gjeldende cache
    caches.open(CURRENT_CACHE_NAME).then(async (cache) => {
      let allFound = true;
      for (const asset of REQUIRED_RESOURCES) {
        const match = await cache.match(asset);
        if (!match) {
          allFound = false;
          break;
        }
      }
      if (event.source) {
        event.source.postMessage({
          type: 'VERIFY_CACHE_RESULT',
          version: APP_VERSION,
          cacheName: CURRENT_CACHE_NAME,
          verified: allFound
        });
      }
    }).catch((err) => {
      if (event.source) {
        event.source.postMessage({
          type: 'VERIFY_CACHE_RESULT',
          version: APP_VERSION,
          verified: false,
          error: err.message
        });
      }
    });
  }

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Avgrens strengt til samme opprinnelse og understien /kalkulator/
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith('/kalkulator/')) return;

  // Ikke bruk nettverket som generell reserve for ukjente ressurser; kun håndter de definerte kalkulatorressursene
  event.respondWith(
    caches.open(CURRENT_CACHE_NAME).then((cache) => {
      // Søk i gjeldende versjonerte cache
      return cache.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Frys programversjonen under bruk: returner fra frosset versjonscache
          return cachedResponse;
        }

        // Hent fra nettverk kun hvis ressursen ikke var i cache
        return fetch(event.request).then((networkResponse) => {
          // Ikke legg ukjente eller feilende responser inn i cachen
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          return networkResponse;
        }).catch(() => {
          // Begrens navigasjonsfallback til kalkulatorens egne innganger
          if (event.request.mode === 'navigate') {
            if (url.pathname === '/kalkulator/' || url.pathname === '/kalkulator/index.html') {
              return cache.match('./index.html');
            }
          }
          return new Response('Ressursen er ikke tilgjengelig offline.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        });
      });
    })
  );
});
