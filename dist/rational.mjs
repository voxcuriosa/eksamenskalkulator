// Rational number representation: num / den (BigInt), den > 0n, gcd(num, den) === 1n
function gcd(a, b) {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

export class Rational {
  constructor(num, den = 1n) {
    if (den === 0n) throw new Error('Kan ikke dele på 0.');
    if (den < 0n) {
      num = -num;
      den = -den;
    }
    const g = gcd(num, den);
    this.num = num / g;
    this.den = den / g;
    // Guard against unreasonable memory consumption
    if (this.num > 10n**120n || this.num < -(10n**120n) || this.den > 10n**120n) {
      throw new Error('Resultatet er utenfor tillatt heltallsområde.');
    }
  }

  add(other) {
    return new Rational(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other) {
    return new Rational(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other) {
    return new Rational(this.num * other.num, this.den * other.den);
  }

  div(other) {
    if (other.num === 0n) throw new Error('Kan ikke dele på 0.');
    return new Rational(this.num * other.den, this.den * other.num);
  }

  neg() {
    return new Rational(-this.num, this.den);
  }

  pow(expInt) {
    if (typeof expInt !== 'number' || !Number.isInteger(expInt)) {
      throw new Error('Eksponent må være et heltall for eksakt brøkpotens.');
    }
    if (expInt === 0) {
      if (this.num === 0n) throw new Error('0 opphøyd i 0 er ikke definert her.');
      return new Rational(1n, 1n);
    }
    if (expInt > 100 || expInt < -100) {
      throw new Error('Eksponenten er for stor for eksakt brøkpotens.');
    }
    const e = BigInt(Math.abs(expInt));
    if (expInt > 0) {
      return new Rational(this.num ** e, this.den ** e);
    } else {
      if (this.num === 0n) throw new Error('Kan ikke dele på 0.');
      return new Rational(this.den ** e, this.num ** e);
    }
  }

  toNumber() {
    return Number(this.num) / Number(this.den);
  }

  toMixed() {
    const whole = this.num / this.den;
    const rem = this.num % this.den;
    const absRem = rem < 0n ? -rem : rem;
    return { whole, rem: absRem, den: this.den };
  }

  formatFraction() {
    if (this.den === 1n) return this.num.toString();
    return `${this.num}/${this.den}`;
  }

  formatMixed() {
    if (this.den === 1n) return this.num.toString();
    const { whole, rem, den } = this.toMixed();
    if (whole === 0n) {
      return `${this.num}/${this.den}`;
    }
    return `${whole} ${rem}/${den}`;
  }
}

// Convert a decimal string representation (e.g. "0.1", "1,5", "-12.34", "1.5e-3") to exact Rational
export function decimalStringToRational(str) {
  const s = str.trim().replace(',', '.');
  const expMatch = s.match(/^([-+]?\d*(?:\.\d+)?)[eE]([-+]?\d+)$/);
  if (expMatch) {
    const base = decimalStringToRational(expMatch[1]);
    const exp = parseInt(expMatch[2], 10);
    if (Math.abs(exp) > 30) return null; // Fall back to float for extreme exponents
    if (exp >= 0) {
      return base.mul(new Rational(10n ** BigInt(exp), 1n));
    } else {
      return base.div(new Rational(10n ** BigInt(-exp), 1n));
    }
  }

  const parts = s.match(/^([-+]?)(\d*)(?:\.(\d+))?$/);
  if (!parts) return null;
  const sign = parts[1] === '-' ? -1n : 1n;
  const intPart = parts[2] ? BigInt(parts[2]) : 0n;
  const fracPart = parts[3] || '';
  if (!fracPart) {
    return new Rational(sign * intPart, 1n);
  }
  const den = 10n ** BigInt(fracPart.length);
  const num = intPart * den + BigInt(fracPart);
  return new Rational(sign * num, den);
}
