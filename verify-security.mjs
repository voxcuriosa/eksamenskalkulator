import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const sourceFiles=['app.mjs','engine.mjs'];
for(const file of sourceFiles){const source=fs.readFileSync('dist/'+file,'utf8');assert.doesNotMatch(source,/\b(?:eval|fetch|XMLHttpRequest|WebSocket|EventSource|Worker|SharedWorker|Function)\s*\(/);assert.doesNotMatch(source,/\b(?:sendBeacon|serviceWorker|localStorage|sessionStorage|indexedDB|innerHTML|outerHTML|document\.write)\b/);assert.doesNotMatch(source,/https?:\/\//);}
const html=fs.readFileSync('dist/index.html','utf8');assert.match(html,/connect-src 'none'/);assert.match(html,/worker-src 'none'/);assert.doesNotMatch(html,/\son[a-z]+=|javascript:|<iframe|<form|<object|<embed/i);assert.deepEqual([...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]).sort(),['app.mjs','styles.css']);
const hashes={};for(const file of fs.readdirSync('dist').sort())hashes[file]=crypto.createHash('sha256').update(fs.readFileSync('dist/'+file)).digest('hex');fs.writeFileSync('SHA256SUMS.json',JSON.stringify(hashes,null,2)+'\n');
console.log('Statisk sikkerhetskontroll bestått. SHA-256-oversikt skrevet. Dette er ingen ekstern sikkerhetsrevisjon.');
