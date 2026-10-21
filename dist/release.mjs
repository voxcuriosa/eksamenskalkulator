export const RELEASE = Object.freeze({
  version: '0.4.0',
  cachePrefix: 'eksamenskalkulator-',
  cacheName: 'eksamenskalkulator-v0.4.0',
  resources: [
    './',
    './index.html',
    './styles.css',
    './app.mjs',
    './engine.mjs',
    './rational.mjs',
    './combinatorics.mjs',
    './release.mjs',
    './manifest.webmanifest'
  ],
  allowedPaths: [
    '/kalkulator/',
    '/kalkulator/index.html',
    '/kalkulator/styles.css',
    '/kalkulator/app.mjs',
    '/kalkulator/engine.mjs',
    '/kalkulator/rational.mjs',
    '/kalkulator/combinatorics.mjs',
    '/kalkulator/release.mjs',
    '/kalkulator/manifest.webmanifest'
  ]
});
