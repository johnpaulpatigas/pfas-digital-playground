import { describe, it, expect } from 'vitest';
import {
  createPRNG,
  sampleStandardNormal,
  normalInverseCDF,
  sampleDistribution,
  quantileDistribution,
} from '../distributions';

describe('Distributions Engine', () => {
  it('createPRNG produces deterministic pseudo-random numbers in [0, 1)', () => {
    const prng1 = createPRNG(42);
    const prng2 = createPRNG(42);

    const val1_a = prng1();
    const val1_b = prng1();

    const val2_a = prng2();
    const val2_b = prng2();

    expect(val1_a).toBe(val2_a);
    expect(val1_b).toBe(val2_b);

    expect(val1_a).toBeGreaterThanOrEqual(0);
    expect(val1_a).toBeLessThan(1);
  });

  it('normalInverseCDF computes accurate quantiles for standard normal distribution', () => {
    // Median (p = 0.5) should be 0
    expect(normalInverseCDF(0.5)).toBeCloseTo(0, 5);

    // p = 0.975 -> z ≈ 1.96
    expect(normalInverseCDF(0.975)).toBeCloseTo(1.95996, 3);

    // p = 0.025 -> z ≈ -1.96
    expect(normalInverseCDF(0.025)).toBeCloseTo(-1.95996, 3);
  });

  it('sampleStandardNormal generates numbers around zero mean', () => {
    const prng = createPRNG(12345);
    const samples: number[] = [];
    for (let i = 0; i < 5000; i++) {
      samples.push(sampleStandardNormal(prng));
    }

    const mean = samples.reduce((acc, v) => acc + v, 0) / samples.length;
    expect(mean).toBeCloseTo(0, 1);
  });

  it('sampleDistribution correctly handles fixed distribution', () => {
    const prng = createPRNG(42);
    const result = sampleDistribution({ type: 'fixed', value: 15.5 }, prng);
    expect(result).toBe(15.5);
  });

  it('sampleDistribution correctly handles uniform distribution bounds', () => {
    const prng = createPRNG(42);
    const min = 10;
    const max = 20;

    for (let i = 0; i < 100; i++) {
      const val = sampleDistribution({ type: 'uniform', min, max }, prng);
      expect(val).toBeGreaterThanOrEqual(min);
      expect(val).toBeLessThanOrEqual(max);
    }
  });

  it('quantileDistribution returns correct values across distribution types', () => {
    expect(quantileDistribution({ type: 'fixed', value: 50 }, 0.5)).toBe(50);

    const uniformVal = quantileDistribution({ type: 'uniform', min: 10, max: 20 }, 0.5);
    expect(uniformVal).toBeCloseTo(15, 4);

    const normalVal = quantileDistribution({ type: 'normal', mean: 100, sd: 15 }, 0.5);
    expect(normalVal).toBeCloseTo(100, 4);

    const triangularVal = quantileDistribution({ type: 'triangular', min: 0, mode: 5, max: 10 }, 0.5);
    expect(triangularVal).toBeGreaterThan(0);
    expect(triangularVal).toBeLessThan(10);
  });
});
