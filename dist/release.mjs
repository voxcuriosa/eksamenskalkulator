export const RELEASE = Object.freeze({
  version: '0.3.0',
  cachePrefix: 'eksamenskalkulator-',
  cacheName: 'eksamenskalkulator-v0.3.0',
  // Liste over nøyaktige relative adresser som inngår i utgivelsen
  resources: [
    './',
    './index.html',
    './styles.css',
    './app.mjs',
    './engine.mjs',
    './release.mjs',
    './manifest.webmanifest'
  ],
  // Nøyaktige normaliserte URL-stier som kalkulatoren støtter
  allowedPaths: [
    '/kalkulator/',
    '/kalkulator/index.html',
    '/kalkulator/styles.css',
    '/kalkulator/app.mjs',
    '/kalkulator/engine.mjs',
    '/kalkulator/release.mjs',
    '/kalkulator/manifest.webmanifest'
  ]
});
