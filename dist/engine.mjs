import { Rational, decimalStringToRational } from './rational.mjs';
import { factorial, nPr, nCr } from './combinatorics.mjs';

export const LIMITS = Object.freeze({
  length: 2048,
  tokens: 512,
  depth: 48,
  rows: 200,
  count: 1000000
});

export function finite(x) {
  if (!Number.isFinite(x)) throw new Error('Resultatet er utenfor tallområdet.');
  return Object.is(x, -0) ? 0 : x;
}

// Result container representing either an exact rational or a float
export class CalcResult {
  constructor(value, rational = null) {
    this.value = finite(value);
    this.rational = rational; // instance of Rational or null
  }

  isExact() {
    return this.rational !== null;
  }
}

export const MEMORY_NAMES = ['A', 'B', 'C', 'D', 'E', 'F', 'M', 'X', 'Y'];

export function createMemoryStore() {
  const store = {};
  for (const k of MEMORY_NAMES) store[k] = 0;
  return store;
}

// Global runtime variables for calculation session:
// memories: { A..Y: number | CalcResult }
// ans: CalcResult | number
export function calculate(source, mode = 'DEG', options = {}) {
  if (!['DEG', 'RAD'].includes(mode)) throw new Error('Ugyldig vinkelmodus.');
  if (typeof source !== 'string' || source.length > LIMITS.length) {
    throw new Error('Uttrykket er for langt.');
  }

  const memories = options.memories || {};
  const ansValue = options.ans !== undefined ? options.ans : 0;

  // Pre-process special symbols
  // Keep case for memory variables A..Y and Ans, while operators and numbers normalized
  let s = source
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('–', '-')
    .replaceAll(',', '.')
    .replaceAll('π', 'pi');

  // Tokenize
  const tokens = [];
  let i = 0;
  while (i < s.length) {
    if (/\s/.test(s[i])) {
      i++;
      continue;
    }

    const tail = s.slice(i);

    // Number with optional scientific notation (e.g. 1.5e-3)
    const numMatch = tail.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (numMatch) {
      const raw = numMatch[0];
      const val = finite(Number(raw));
      const rat = decimalStringToRational(raw);
      tokens.push({ type: 'number', value: val, rational: rat, raw });
      i += raw.length;
      continue;
    }

    // Identifiers: functions, Ans, pi, e, memory variables (A..Y), nPr, nCr
    const idMatch = tail.match(/^[A-Za-z]+/);
    if (idMatch) {
      const id = idMatch[0];
      const lower = id.toLowerCase();

      if (id === 'Ans' || lower === 'ans') {
        let val = typeof ansValue === 'number' ? ansValue : ansValue.value;
        let rat = (ansValue instanceof CalcResult) ? ansValue.rational : null;
        tokens.push({ type: 'number', value: finite(val), rational: rat, raw: 'Ans' });
        i += id.length;
        continue;
      }

      if (id === 'nPr' || id === 'nCr') {
        tokens.push({ type: id });
        i += id.length;
        continue;
      }

      if (id.length === 1 && MEMORY_NAMES.includes(id)) {
        // Memory variable A..Y (case-sensitive single uppercase letter)
        const memVal = memories[id] !== undefined ? memories[id] : 0;
        let val = typeof memVal === 'number' ? memVal : memVal.value;
        let rat = (memVal instanceof CalcResult) ? memVal.rational : null;
        tokens.push({ type: 'number', value: finite(val), rational: rat, raw: id });
        i += 1;
        continue;
      }

      // Check known math functions and constants in lowercase
      if (['sqrt', 'ln', 'log', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'root', 'pi', 'e', 'fact'].includes(lower)) {
        tokens.push({ type: lower });
        i += id.length;
        continue;
      }

      throw new Error(`Uidentifisert navn: "${id}". Bruk tall eller kalkulatorens funksjoner.`);
    }

    // Single character operators and punctuation
    const char = s[i];
    if ('+-*/^();%!'.includes(char)) {
      tokens.push({ type: char });
      i++;
      continue;
    }

    throw new Error('Bare tall og kalkulatorens regnefunksjoner er tillatt.');
  }

  if (tokens.length > LIMITS.tokens) throw new Error('Uttrykket har for mange ledd.');
  tokens.push({ type: 'end' });

  let p = 0;
  let depth = 0;

  const peek = () => tokens[p].type;
  const take = (t) => {
    if (peek() !== t) {
      throw new Error(t === ')' ? 'Mangler en avsluttende parentes.' : 'Kontroller uttrykket og parentesene.');
    }
    return tokens[p++];
  };

  const enter = (fn) => {
    if (++depth > LIMITS.depth) throw new Error('For mange nestede uttrykk.');
    try {
      return fn();
    } finally {
      depth--;
    }
  };

  const angle = (x) => (mode === 'DEG' ? (x * Math.PI) / 180 : x);
  const inverse = (x) => (mode === 'DEG' ? (x * 180) / Math.PI : x);

  const functions = {
    sqrt: (arg) => {
      if (arg.value < 0) throw new Error('Kvadratroten krever et tall større enn eller lik 0.');
      // Check if perfect rational square
      if (arg.rational && arg.rational.num >= 0n) {
        const nSqrt = integerSqrt(arg.rational.num);
        const dSqrt = integerSqrt(arg.rational.den);
        if (nSqrt !== null && dSqrt !== null) {
          const rat = new Rational(nSqrt, dSqrt);
          return new CalcResult(rat.toNumber(), rat);
        }
      }
      return new CalcResult(Math.sqrt(arg.value), null);
    },
    ln: (arg) => {
      if (arg.value <= 0) throw new Error('Logaritmer krever positive tall.');
      return new CalcResult(Math.log(arg.value), null);
    },
    log: (arg) => {
      if (arg.value <= 0) throw new Error('Logaritmer krever positive tall.');
      return new CalcResult(Math.log10(arg.value), null);
    },
    sin: (arg) => new CalcResult(Math.sin(angle(arg.value)), null),
    cos: (arg) => new CalcResult(Math.cos(angle(arg.value)), null),
    tan: (arg) => {
      const a = angle(arg.value);
      if (Math.abs(Math.cos(a)) < 1e-15) throw new Error('Tangens er ikke definert for denne vinkelen.');
      return new CalcResult(Math.tan(a), null);
    },
    asin: (arg) => new CalcResult(inverse(Math.asin(arg.value)), null),
    acos: (arg) => new CalcResult(inverse(Math.acos(arg.value)), null),
    atan: (arg) => new CalcResult(inverse(Math.atan(arg.value)), null)
  };

  function integerSqrt(n) {
    if (n < 0n) return null;
    if (n === 0n) return 0n;
    let x0 = n / 2n;
    if (x0 === 0n) x0 = 1n;
    let x1 = (x0 + n / x0) / 2n;
    while (x1 < x0) {
      x0 = x1;
      x1 = (x0 + n / x0) / 2n;
    }
    return x0 * x0 === n ? x0 : null;
  }

  // Expression grammar:
  // sum -> product (('+' | '-') product)*
  // product -> unary (('*' | '/') unary | 'nPr' unary | 'nCr' unary)*
  // unary -> ('+' | '-') unary | postfix
  // postfix -> power ('%' | '!')*
  // power -> primary ('^' unary)?
  // primary -> number | pi | e | '(' sum ')' | func '(' sum (';' sum)* ')'

  function primary() {
    return enter(() => {
      const t = tokens[p];
      if (t.type === 'number') {
        p++;
        return new CalcResult(t.value, t.rational);
      }
      if (t.type === 'pi') {
        p++;
        return new CalcResult(Math.PI, null);
      }
      if (t.type === 'e') {
        p++;
        return new CalcResult(Math.E, null);
      }
      if (t.type === '(') {
        p++;
        const res = sum();
        take(')');
        return res;
      }

      // Functions: sqrt, sin, cos, tan, asin, acos, atan, log, ln, root
      const name = t.type;
      if (Object.hasOwn(functions, name) || name === 'root') {
        p++;
        take('(');
        const a = sum();
        if (name === 'root') {
          take(';');
          const b = sum();
          if (a.value === 0) throw new Error('Rotgraden kan ikke være 0.');
          if (b.value < 0 && (!Number.isInteger(a.value) || Math.abs(a.value % 2) !== 1)) {
            throw new Error('Negativt radikand krever en odde heltallig rotgrad.');
          }
          const rootVal = b.value < 0 ? -Math.pow(-b.value, 1 / a.value) : Math.pow(b.value, 1 / a.value);
          take(')');
          return new CalcResult(rootVal, null);
        }
        const res = functions[name](a);
        take(')');
        return res;
      }

      throw new Error('Bruk tall eller en av kalkulatorens funksjoner.');
    });
  }

  function power() {
    const a = primary();
    if (peek() === '^') {
      p++;
      const b = unary();
      if (a.value === 0 && b.value === 0) {
        throw new Error('0 opphøyd i 0 er ikke definert her.');
      }

      // Check exact rational power with integer exponent
      if (a.rational && Number.isInteger(b.value) && Math.abs(b.value) <= 100) {
        try {
          const rat = a.rational.pow(b.value);
          return new CalcResult(rat.toNumber(), rat);
        } catch (_) {
          // Fall through to float calculation
        }
      }

      // Negative base with rational exponent check (e.g. root check)
      if (a.value < 0 && b.rational) {
        const den = Number(b.rational.den);
        const num = Number(b.rational.num);
        if (den % 2 === 1) {
          // Odd denominator allows negative base
          const root = -Math.pow(-a.value, 1 / den);
          const powVal = Math.pow(root, num);
          return new CalcResult(powVal, null);
        }
        throw new Error('Potens med negativt grunntall og partallsnevner er ikke reelt.');
      }

      const val = Math.pow(a.value, b.value);
      return new CalcResult(val, null);
    }
    return a;
  }

  function postfix() {
    let a = power();
    while (peek() === '%' || peek() === '!') {
      const op = tokens[p++].type;
      if (op === '%') {
        const val = a.value / 100;
        const rat = a.rational ? a.rational.div(new Rational(100n, 1n)) : null;
        a = new CalcResult(val, rat);
      } else if (op === '!') {
        const val = factorial(a.value);
        const rat = new Rational(BigInt(val), 1n);
        a = new CalcResult(val, rat);
      }
    }
    return a;
  }

  function unary() {
    return enter(() => {
      if (peek() === '+') {
        p++;
        return unary();
      }
      if (peek() === '-') {
        p++;
        const res = unary();
        const rat = res.rational ? res.rational.neg() : null;
        return new CalcResult(-res.value, rat);
      }
      return postfix();
    });
  }

  function product() {
    let a = unary();
    while (['*', '/', 'nPr', 'nCr'].includes(peek())) {
      const op = tokens[p++].type;
      const b = unary();
      if (op === '*') {
        const val = a.value * b.value;
        const rat = (a.rational && b.rational) ? a.rational.mul(b.rational) : null;
        a = new CalcResult(val, rat);
      } else if (op === '/') {
        if (b.value === 0) throw new Error('Kan ikke dele på 0.');
        const val = a.value / b.value;
        const rat = (a.rational && b.rational) ? a.rational.div(b.rational) : null;
        a = new CalcResult(val, rat);
      } else if (op === 'nPr') {
        const val = nPr(a.value, b.value);
        const rat = new Rational(BigInt(val), 1n);
        a = new CalcResult(val, rat);
      } else if (op === 'nCr') {
        const val = nCr(a.value, b.value);
        const rat = new Rational(BigInt(val), 1n);
        a = new CalcResult(val, rat);
      }
    }
    return a;
  }

  function sum() {
    let a = product();
    while (peek() === '+' || peek() === '-') {
      const op = tokens[p++].type;
      const b = product();
      if (op === '+') {
        const val = a.value + b.value;
        const rat = (a.rational && b.rational) ? a.rational.add(b.rational) : null;
        a = new CalcResult(val, rat);
      } else {
        const val = a.value - b.value;
        const rat = (a.rational && b.rational) ? a.rational.sub(b.rational) : null;
        a = new CalcResult(val, rat);
      }
    }
    return a;
  }

  if (peek() === 'end') throw new Error('Skriv et regneuttrykk først.');
  const result = sum();
  if (peek() !== 'end') {
    throw new Error('Bruk × mellom faktorer. Kontroller parenteser og skilletegn.');
  }
  return result;
}

export function parseScalar(text) {
  if (typeof text !== 'string' || !/^[-+]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:[eE][-+]?\d+)?$/.test(text.trim())) {
    throw new Error('Skriv én tallverdi per rad.');
  }
  return finite(Number(text.trim().replace(',', '.')));
}

export function statistics(rows) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > LIMITS.rows) {
    throw new Error('Legg inn mellom 1 og 200 verdier.');
  }
  let n = 0;
  let sumX = 0;
  let sumX2 = 0;
  let min = Infinity;
  let max = -Infinity;
  let mean = 0;
  let m2 = 0;

  for (const row of rows) {
    const x = finite(row.value);
    const w = row.frequency;
    if (!Number.isInteger(w) || w < 1 || n + w > LIMITS.count) {
      throw new Error('Frekvens må være et positivt heltall. Maksimalt 1 000 000 observasjoner.');
    }
    const total = n + w;
    const delta = x - mean;
    mean = finite(mean + delta * (w / total));
    m2 = finite(m2 + delta * (x - mean) * w);
    n = total;

    sumX = finite(sumX + x * w);
    sumX2 = finite(sumX2 + x * x * w);
    if (x < min) min = x;
    if (x > max) max = x;
  }

  return {
    n,
    sumX,
    sumX2,
    min: isFinite(min) ? min : null,
    max: isFinite(max) ? max : null,
    mean,
    population: finite(Math.sqrt(Math.max(0, m2 / n))),
    sample: n > 1 ? finite(Math.sqrt(Math.max(0, m2 / (n - 1)))) : null
  };
}

// Display format options:
// displayMode: 'NORM' | 'FIX' | 'SCI'
// digits: 0..9 (for FIX/SCI)
export function format(value, options = {}) {
  const num = (value instanceof CalcResult) ? value.value : (typeof value === 'number' ? value : Number(value));
  if (num === null || isNaN(num)) return '—';

  const displayMode = options.displayMode || 'NORM';
  const digits = typeof options.digits === 'number' ? options.digits : 2;

  if (displayMode === 'FIX') {
    // FIX 0..9 decimal places
    const fixed = num.toFixed(Math.max(0, Math.min(9, digits)));
    return fixed.replace('.', ',');
  }

  if (displayMode === 'SCI') {
    // SCI 1..9 significant figures
    const sig = Math.max(1, Math.min(9, digits));
    const sci = num.toExponential(sig - 1);
    const [m, e] = sci.split('e');
    const expNum = parseInt(e, 10);
    return `${m.replace('.', ',')}E${expNum >= 0 ? '+' : ''}${expNum}`;
  }

  // NORM default: up to 12 significant digits
  const rounded = Number(num.toPrecision(12));
  const abs = Math.abs(rounded);
  if (abs !== 0 && (abs >= 1e12 || abs < 1e-9)) {
    const [m, e] = rounded.toExponential(11).split('e');
    return String(Number(m)).replace('.', ',') + 'E' + String(Number(e));
  }
  return rounded.toLocaleString('nb-NO', { maximumSignificantDigits: 12, useGrouping: false });
}
