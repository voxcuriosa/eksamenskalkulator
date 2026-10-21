// Combinatorics: factorial, nPr, nCr
export function factorial(n) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
    throw new Error('Fakultet krever et ikke-negativt heltall.');
  }
  if (n > 69) {
    throw new Error('Matematisk feil: n! overskrider tallområdet (maks 69).');
  }
  let res = 1n;
  for (let i = 2n; i <= BigInt(n); i++) {
    res *= i;
  }
  return Number(res);
}

export function nPr(n, r) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
    throw new Error('nPr krever at n er et ikke-negativt heltall.');
  }
  if (typeof r !== 'number' || !Number.isInteger(r) || r < 0) {
    throw new Error('nPr krever at r er et ikke-negativt heltall.');
  }
  if (r > n) {
    throw new Error('nPr krever at r ≤ n.');
  }
  if (n > 1000) {
    throw new Error('nPr: n er for stor.');
  }
  let res = 1n;
  const bigN = BigInt(n);
  const bigR = BigInt(r);
  for (let i = 0n; i < bigR; i++) {
    res *= (bigN - i);
  }
  const num = Number(res);
  if (!Number.isFinite(num)) {
    throw new Error('Resultatet overskrider tallområdet.');
  }
  return num;
}

export function nCr(n, r) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0) {
    throw new Error('nCr krever at n er et ikke-negativt heltall.');
  }
  if (typeof r !== 'number' || !Number.isInteger(r) || r < 0) {
    throw new Error('nCr krever at r er et ikke-negativt heltall.');
  }
  if (r > n) {
    throw new Error('nCr krever at r ≤ n.');
  }
  const k = Math.min(r, n - r);
  if (k === 0) return 1;
  let res = 1n;
  const bigN = BigInt(n);
  for (let i = 1n; i <= BigInt(k); i++) {
    res = (res * (bigN - i + 1n)) / i;
  }
  const num = Number(res);
  if (!Number.isFinite(num)) {
    throw new Error('Resultatet overskrider tallområdet.');
  }
  return num;
}
