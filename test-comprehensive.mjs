import assert from 'node:assert/strict';
import { calculate as c, format } from './dist/engine.mjs';

console.log('--- Omfattende testsuite for nye funksjoner ---');

// 1. Brøker og rasjonal aritmetikk
const f1 = c('1/2 + 1/3');
assert.equal(f1.rational.formatFraction(), '5/6');
assert.equal(f1.rational.formatMixed(), '5/6');

const f2 = c('2/3 * 9/4');
assert.equal(f2.rational.formatFraction(), '3/2');
assert.equal(f2.rational.formatMixed(), '1 1/2');

const f3 = c('0,1 + 0,2');
assert.equal(f3.rational.formatFraction(), '3/10');

// Videre regning med eksakt brøk
const f4 = c('(1/2 + 1/3) * 6/5');
assert.equal(f4.rational.formatFraction(), '1');

// Desimal- og formatveksling uten tap av intern verdi
assert.equal(format(f1), '0,833333333333');
assert.equal(format(f1, { displayMode: 'FIX', digits: 2 }), '0,83');
assert.equal(f1.rational.formatFraction(), '5/6'); // Intern verdi intakt

// 2. Kombinatorikk
assert.equal(c('0!').value, 1);
assert.equal(c('1!').value, 1);
assert.equal(c('5!').value, 120);
assert.equal(c('69!').value > 1e90, true);
assert.throws(() => c('70!'), /tallområdet/);
assert.throws(() => c('(-1)!'), /ikke-negativt heltall/);
assert.throws(() => c('1,5!'), /ikke-negativt heltall/);

assert.equal(c('5 nPr 2').value, 20);
assert.equal(c('5 nPr 0').value, 1);
assert.equal(c('5 nPr 5').value, 120);
assert.throws(() => c('5 nPr 6'), /r ≤ n/);

assert.equal(c('5 nCr 2').value, 10);
assert.equal(c('5 nCr 0').value, 1);
assert.equal(c('5 nCr 5').value, 1);
assert.throws(() => c('5 nCr 6'), /r ≤ n/);

// 3. Ans og minner
const mems = { A: 10, B: 20, C: 30, D: 40, E: 50, F: 60, M: 70, X: 80, Y: 90 };
assert.equal(c('A + B + C + D + E + F + M + X + Y', 'DEG', { memories: mems }).value, 450);

// Konfliktkontroll: E vs e vs 1E3
// E alene er minne (50)
assert.equal(c('E', 'DEG', { memories: mems }).value, 50);
// e er Eulers tall (2.718...)
assert.ok(Math.abs(c('e').value - Math.E) < 1e-12);
// 1E3 eller 2E2 er vitenskapelig notasjon
assert.equal(c('2E2').value, 200);
assert.equal(c('1,5E-2').value, 0.015);
assert.equal(c('E + e', 'DEG', { memories: mems }).value, 50 + Math.E);
console.log('✔ Minnet E vs konstanten e vs vitenskapelig eksponent 1E3 er entydig skilt');

// Ans bevares
assert.equal(c('Ans + 10', 'DEG', { ans: 5 }).value, 15);

// 4. Potenser med negative grunntall
assert.equal(c('root(3;-8)').value, -2);
assert.equal(c('(-8)^(1/3)').value, -2);
assert.throws(() => c('(-4)^(1/2)'), /ikke reelt/);
console.log('✔ Negative grunntall med odde rot og brøkpotens virker');

// 5. Deling på null for brøk
assert.throws(() => c('1/0'), /Kan ikke dele på 0/);
assert.throws(() => c('5/(2-2)'), /Kan ikke dele på 0/);

console.log('--- Alle omfattende tester for nye funksjoner er bestått! ---');
