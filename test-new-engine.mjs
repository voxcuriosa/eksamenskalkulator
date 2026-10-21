import assert from 'node:assert/strict';
import { calculate, statistics, parseScalar, format } from './dist/engine.mjs';
import { Rational } from './dist/rational.mjs';

console.log('--- Tester ny motor med brøker, kombinatorikk, Ans og minner ---');

// 1. Brøker
const r1 = calculate('1/2 + 1/3');
assert.equal(r1.rational.formatFraction(), '5/6');
assert.ok(Math.abs(r1.value - 5/6) < 1e-15);
console.log('✔ 1/2 + 1/3 = 5/6');

const r2 = calculate('2/3 * 9/4');
assert.equal(r2.rational.formatFraction(), '3/2');
assert.equal(r2.rational.formatMixed(), '1 1/2');
console.log('✔ 2/3 * 9/4 = 3/2 (1 1/2)');

const r3 = calculate('0.1 + 0.2');
assert.equal(r3.rational.formatFraction(), '3/10');
console.log('✔ 0.1 + 0.2 = 3/10');

// 2. Kombinatorikk
assert.equal(calculate('0!').value, 1);
assert.equal(calculate('5!').value, 120);
assert.equal(calculate('5 nPr 2').value, 20);
assert.equal(calculate('5 nCr 2').value, 10);
assert.equal(calculate('5 nCr 0').value, 1);
assert.equal(calculate('5 nCr 5').value, 1);
console.log('✔ Kombinatorikk (0!, 5!, 5 nPr 2, 5 nCr 2, nCr(5,0), nCr(5,5))');

// 3. Ans og minner
const memories = { A: 10, B: 5, E: 3, M: 7 };
const rAns = calculate('Ans * 2', 'DEG', { ans: 21 });
assert.equal(rAns.value, 42);

const rMem = calculate('A + B + E + M', 'DEG', { memories });
assert.equal(rMem.value, 25);
console.log('✔ Ans og minner (A, B, E, M)');

// 4. Statistikk med min, max, sumX, sumX2
const st = statistics([
  { value: 2, frequency: 1 },
  { value: 4, frequency: 2 },
  { value: 6, frequency: 1 }
]);
assert.equal(st.n, 4);
assert.equal(st.min, 2);
assert.equal(st.max, 6);
assert.equal(st.sumX, 16);
assert.equal(st.sumX2, 72);
assert.equal(st.mean, 4);
console.log('✔ Statistikk (n, min, max, sumX, sumX2, mean)');

// 5. Visningsformater: FIX og SCI
assert.equal(format(3.14159, { displayMode: 'FIX', digits: 2 }), '3,14');
assert.equal(format(12345, { displayMode: 'SCI', digits: 3 }), '1,23E+4');
console.log('✔ FIX og SCI formatering');

console.log('--- Grunnleggende nye tester bestått! ---');
