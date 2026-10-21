import assert from 'node:assert/strict';
import {calculate as c, statistics as stats, parseScalar, format} from './dist/engine.mjs';

console.log('--- Kjører spesifikke beregningstester fra kravlisten ---');

// 1. 2+3*4 = 14
assert.equal(c('2+3*4').value, 14);
console.log('✔ 2+3*4 = 14');

// 2. -2^2 = -4
assert.equal(c('-2^2').value, -4);
console.log('✔ -2^2 = -4');

// 3. (-2)^2 = 4
assert.equal(c('(-2)^2').value, 4);
console.log('✔ (-2)^2 = 4');

// 4. 2^3^2 = 512
assert.equal(c('2^3^2').value, 512);
console.log('✔ 2^3^2 = 512');

// 5. sqrt(81) = 9
assert.equal(c('sqrt(81)').value, 9);
console.log('✔ sqrt(81) = 9');

// 6. root(3;-27) = -3
assert.equal(c('root(3;-27)').value, -3);
console.log('✔ root(3;-27) = -3');

// 7. log(100) = 2
assert.equal(c('log(100)').value, 2);
console.log('✔ log(100) = 2');

// 8. ln(e) ≈ 1
assert.ok(Math.abs(c('ln(e)').value - 1) < 1e-12);
console.log('✔ ln(e) ≈ 1');

// 9. sin(30) ≈ 0,5 i DEG
assert.ok(Math.abs(c('sin(30)', 'DEG').value - 0.5) < 1e-12);
console.log('✔ sin(30) ≈ 0,5 (DEG)');

// 10. sin(pi/2) ≈ 1 i RAD
assert.ok(Math.abs(c('sin(pi/2)', 'RAD').value - 1) < 1e-12);
console.log('✔ sin(pi/2) ≈ 1 (RAD)');

// 11. Videre regning med et negativt svar, inkludert kvadrering
const ans1 = c('-5').value;
assert.equal(ans1, -5);
assert.equal(c('(-5)^2').value, 25);
assert.equal(c('(-5)+10').value, 5);
console.log('✔ Videre regning med negativt svar og kvadrering');

// 12. Begge standardavvik, med og uten frekvenser
const utenFrekvens = stats([
  {value: 2, frequency: 1},
  {value: 4, frequency: 1},
  {value: 4, frequency: 1},
  {value: 4, frequency: 1},
  {value: 5, frequency: 1},
  {value: 5, frequency: 1},
  {value: 7, frequency: 1},
  {value: 9, frequency: 1}
]);
assert.equal(utenFrekvens.population, 2);
assert.ok(Math.abs(utenFrekvens.sample - Math.sqrt(32/7)) < 1e-12);
console.log('✔ Standardavvik populasjon og utvalg uten frekvenser');

const medFrekvens = stats([
  {value: 2, frequency: 1},
  {value: 4, frequency: 3},
  {value: 5, frequency: 2},
  {value: 7, frequency: 1},
  {value: 9, frequency: 1}
]);
assert.equal(medFrekvens.population, 2);
assert.ok(Math.abs(medFrekvens.sample - Math.sqrt(32/7)) < 1e-12);
console.log('✔ Standardavvik populasjon og utvalg med frekvenser');

// 13. Ugyldige uttrykk, deling på null og ressursgrenser
assert.throws(() => c('1/0'), /Kan ikke dele på 0/);
assert.throws(() => c('root(0;5)'), /Rotgraden kan ikke være 0/);
assert.throws(() => c('0^0'), /0 opphøyd i 0 er ikke definert/);
assert.throws(() => c('1'.repeat(2049)), /Uttrykket er for langt/);
console.log('✔ Deling på null, rotgrad 0, 0^0 og lengdegrense avvist');

// 14. Avvisning av JavaScript, HTML, variabler og ukjente funksjoner
const attackStrings = [
  'eval(1)', 'fetch("/")', 'alert(1)', 'document.cookie', 'window.location',
  'Function("return 1")()', 'x+2', 'a*b', '<script>alert(1)</script>',
  'Object.keys()', 'constructor', 'require("fs")'
];
for (const s of attackStrings) {
  assert.throws(() => c(s), /Bare tall og kalkulatorens regnefunksjoner er tillatt|Bruk tall eller en av kalkulatorens funksjoner|Uidentifisert navn/);
}
console.log('✔ Alle 12 forsøk på JavaScript, HTML, variabler og ukjente funksjoner avvist');

console.log('--- Alle spesifikke kravkontroller er bestått! ---');
