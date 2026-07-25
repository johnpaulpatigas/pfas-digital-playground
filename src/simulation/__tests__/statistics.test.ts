import { describe, it, expect } from 'vitest';
import { calculateSummaryStatistics, calculateSensitivityRanks } from '../statistics';
import type { IterationResult, SimulationParameters, DistributionParams, ExposureParameterConfig } from '../../types';

const mockResults: IterationResult[] = Array.from({ length: 100 }, (_, i) => ({
  iteration: i + 1,
  dailyIntake: 0.05 + i * 0.001,
  bodyWeight: 50 + (i % 10),
  age: 30,
  waterConsumption: 1.5,
  bioavailability: 0.95,
  eliminationHalfLife: 3.5,
  exposureDuration: 20,
  eliminationRate: 0.0005,
  steadyStateConcentration: 1.0 + i * 0.05,
  peakBodyBurden: 20 + i,
  clearanceRate: 0.001,
  hazardQuotient: (1.0 + i * 0.05) > 4.0 ? 1.2 : 0.5,
}));

const createMockConfig = (id: string, name: string, dist: DistributionParams): ExposureParameterConfig => ({
  id,
  name,
  unit: 'unit',
  description: '',
  scientificContext: '',
  distribution: dist,
});

const mockParameters: SimulationParameters = {
  dailyIntake: createMockConfig('dailyIntake', 'Daily Intake', { type: 'normal', mean: 0.1, sd: 0.02 }),
  bodyWeight: createMockConfig('bodyWeight', 'Body Weight', { type: 'normal', mean: 55, sd: 8 }),
  age: createMockConfig('age', 'Age', { type: 'fixed', value: 30 }),
  waterConsumption: createMockConfig('waterConsumption', 'Water Consumption', { type: 'lognormal', mean: 1.5, sd: 0.3 }),
  bioavailability: createMockConfig('bioavailability', 'Bioavailability', { type: 'fixed', value: 0.95 }),
  eliminationHalfLife: createMockConfig('eliminationHalfLife', 'Half-Life', { type: 'uniform', min: 2.0, max: 4.5 }),
  exposureDuration: createMockConfig('exposureDuration', 'Exposure Duration', { type: 'triangular', min: 5, mode: 20, max: 40 }),
};

describe('Statistics Engine', () => {
  it('calculateSummaryStatistics calculates correct descriptive statistics', () => {
    const stats = calculateSummaryStatistics(mockResults);

    expect(stats.count).toBe(100);
    expect(stats.mean).toBeGreaterThan(0);
    expect(stats.median).toBeGreaterThan(0);
    expect(stats.p5).toBeLessThanOrEqual(stats.median);
    expect(stats.p95).toBeGreaterThanOrEqual(stats.median);
    expect(stats.p99).toBeGreaterThanOrEqual(stats.p95);
    expect(stats.riskExceedancePercent).toBeGreaterThanOrEqual(0);
    expect(stats.riskExceedancePercent).toBeLessThanOrEqual(100);
  });

  it('calculateSensitivityRanks computes Spearman correlation ranks', () => {
    const ranks = calculateSensitivityRanks(mockResults, mockParameters);

    expect(ranks.length).toBeGreaterThan(0);
    const dailyIntakeRank = ranks.find((r) => r.parameterId === 'dailyIntake');
    expect(dailyIntakeRank).toBeDefined();
    // Daily intake is positively correlated with steady state concentration
    expect(dailyIntakeRank?.correlationCoefficient).toBeGreaterThan(0.9);
  });
});
