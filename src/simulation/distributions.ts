import type {
  DistributionParams,
  LognormalDistributionParams,
  TriangularDistributionParams,
} from '../types';

/**
 * Seedable Mulberry32 Pseudo-Random Number Generator
 */
export function createPRNG(seed: number = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Box-Muller transform for standard Normal distribution N(0, 1)
 */
export function sampleStandardNormal(prng: () => number): number {
  let u1 = prng();
  const u2 = prng();
  while (u1 <= Number.EPSILON) u1 = prng();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Standard Normal Inverse CDF (Erf-based approximation)
 */
export function normalInverseCDF(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;

  // Peter J. Acklam's inverse normal cumulative distribution function approximation
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2,
    -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1,
    -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734,
    4.374664141464968, 2.938163982698783,
  ];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];

  const p_low = 0.02425;
  const p_high = 1 - p_low;

  let q: number, r: number;

  if (p < p_low) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  } else if (p <= p_high) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
}

/**
 * Convert arithmetic mean/SD lognormal parameters into log-space (mu, sigma).
 */
function getLognormalParameters(dist: LognormalDistributionParams): {
  mu: number;
  sigma: number;
} {
  const m = Math.max(1e-9, dist.mean);
  const s = Math.max(0, dist.sd);
  const varianceRatio = (s * s) / (m * m);
  const sigma = Math.sqrt(Math.log(1 + varianceRatio));
  const mu = Math.log(m) - (sigma * sigma) / 2;
  return { mu, sigma };
}

/**
 * Inverse-CDF transform for a triangular distribution at probability u.
 */
function sampleTriangular(dist: TriangularDistributionParams, u: number): number {
  const F = (dist.mode - dist.min) / (dist.max - dist.min);
  if (u < F) {
    return dist.min + Math.sqrt(u * (dist.max - dist.min) * (dist.mode - dist.min));
  }
  return dist.max - Math.sqrt((1 - u) * (dist.max - dist.min) * (dist.max - dist.mode));
}

/**
 * Sample a value from a parameter distribution using pseudo-random PRNG
 */
export function sampleDistribution(dist: DistributionParams, prng: () => number): number {
  switch (dist.type) {
    case 'fixed':
      return dist.value;

    case 'uniform':
      return dist.min + prng() * (dist.max - dist.min);

    case 'normal': {
      const z = sampleStandardNormal(prng);
      return dist.mean + z * dist.sd;
    }

    case 'lognormal': {
      const z = sampleStandardNormal(prng);
      if (Math.max(0, dist.sd) === 0) return Math.max(1e-9, dist.mean);
      const { mu, sigma } = getLognormalParameters(dist);
      return Math.exp(mu + z * sigma);
    }

    case 'triangular':
      return sampleTriangular(dist, prng());
  }
}

/**
 * Inverse Cumulative Distribution Function (Quantile function) for LHS Stratification
 */
export function quantileDistribution(dist: DistributionParams, p: number): number {
  // Clamp p to valid probability bounds
  const prob = Math.max(1e-6, Math.min(1 - 1e-6, p));

  switch (dist.type) {
    case 'fixed':
      return dist.value;

    case 'uniform':
      return dist.min + prob * (dist.max - dist.min);

    case 'normal': {
      const z = normalInverseCDF(prob);
      return dist.mean + z * dist.sd;
    }

    case 'lognormal': {
      const z = normalInverseCDF(prob);
      if (Math.max(0, dist.sd) === 0) return Math.max(1e-9, dist.mean);
      const { mu, sigma } = getLognormalParameters(dist);
      return Math.exp(mu + z * sigma);
    }

    case 'triangular':
      return sampleTriangular(dist, prob);
  }
}

/**
 * Compute the analytical expected value (mean) of any parameter distribution
 */
export function getDistributionMean(dist: DistributionParams, fallback: number = 0): number {
  switch (dist.type) {
    case 'fixed':
      return dist.value;
    case 'uniform':
      return (dist.min + dist.max) / 2;
    case 'normal':
    case 'lognormal':
      return dist.mean;
    case 'triangular':
      return (dist.min + dist.mode + dist.max) / 3;
    default:
      return fallback;
  }
}
