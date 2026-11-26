import { describe, expect, it } from 'vitest';
import type {
  DistributionParams,
  ExposureParameterConfig,
  IterationResult,
  SimulationParameters,
} from '../../types';
import {
  calculateMannWhitneyU,
  calculateOneSampleWilcoxon,
  calculatePRCC,
  calculateSensitivityRanks,
  calculateSummaryStatistics,
  normalCdf,
} from '../statistics';

const mockResults: IterationResult[] = Array.from({ length: 100 }, (_, i) => ({
  iteration: i + 1,
  dailyIntake: 0.05 + i * 0.001,
  dailyIntakePfoa: 0.05 + i * 0.001,
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
  hazardQuotient: 1.0 + i * 0.05 > 4.0 ? 1.2 : 0.5,
}));

const createMockConfig = (
  id: string,
  name: string,
  dist: DistributionParams,
): ExposureParameterConfig => ({
  id,
  name,
  unit: 'unit',
  description: '',
  scientificContext: '',
  distribution: dist,
});

const mockParameters: SimulationParameters = {
  dailyIntake: createMockConfig('dailyIntake', 'Daily Intake', {
    type: 'normal',
    mean: 0.1,
    sd: 0.02,
  }),
  bodyWeight: createMockConfig('bodyWeight', 'Body Weight', { type: 'normal', mean: 55, sd: 8 }),
  age: createMockConfig('age', 'Age', { type: 'fixed', value: 30 }),
  waterConsumption: createMockConfig('waterConsumption', 'Water Consumption', {
    type: 'lognormal',
    mean: 1.5,
    sd: 0.3,
  }),
  bioavailability: createMockConfig('bioavailability', 'Bioavailability', {
    type: 'fixed',
    value: 0.95,
  }),
  eliminationHalfLife: createMockConfig('eliminationHalfLife', 'Half-Life', {
    type: 'uniform',
    min: 2.0,
    max: 4.5,
  }),
  exposureDuration: createMockConfig('exposureDuration', 'Exposure Duration', {
    type: 'triangular',
    min: 5,
    mode: 20,
    max: 40,
  }),
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
    expect(stats.meanHazardIndex).toBeDefined();
    expect(stats.mixtureExceedancePercent).toBeDefined();
  });

  it('calculateSensitivityRanks computes Spearman correlation ranks', () => {
    const ranks = calculateSensitivityRanks(mockResults, mockParameters);

    expect(ranks.length).toBeGreaterThan(0);
    const dailyIntakeRank = ranks.find((r) => r.parameterId === 'dailyIntakePfoa');
    expect(dailyIntakeRank).toBeDefined();
    // Daily intake is positively correlated with steady state concentration
    expect(dailyIntakeRank?.correlationCoefficient).toBeGreaterThan(0.9);
    // PRCC is also computed
    expect(dailyIntakeRank?.prcc).toBeDefined();
    expect(dailyIntakeRank?.isSignificant).toBeDefined();
  });

  it('normalCdf computes accurate standard normal probabilities', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 4);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 2);
    expect(normalCdf(-1.96)).toBeCloseTo(0.025, 2);
  });

  it('calculateMannWhitneyU detects significant differences between distinct samples', () => {
    const sampleLow = [1.2, 1.4, 1.5, 1.8, 2.0, 2.1, 2.2, 2.3, 2.4, 2.5];
    const sampleHigh = [10.1, 10.5, 11.2, 11.4, 12.0, 12.3, 13.0, 13.5, 14.1, 15.0];

    const result = calculateMannWhitneyU(sampleLow, sampleHigh);
    expect(result.uStat).toBe(0);
    expect(result.pValue).toBeLessThan(0.001);
    expect(result.isSignificant).toBe(true);
    expect(Math.abs(result.rankBiserialCorrelation)).toBe(1);

    // Identical distributions
    const resultSame = calculateMannWhitneyU(sampleLow, sampleLow);
    expect(resultSame.pValue).toBeGreaterThan(0.9);
    expect(resultSame.isSignificant).toBe(false);
  });

  it('calculatePRCC computes partial rank correlations with significance', () => {
    const prccs = calculatePRCC(mockResults, mockParameters);
    expect(prccs.length).toBe(16);
    const dailyIntake = prccs.find((p) => p.parameterId === 'dailyIntakePfoa');
    expect(dailyIntake).toBeDefined();
    expect(dailyIntake?.prcc).toBeGreaterThan(0);
    expect(dailyIntake?.pValue).toBeDefined();
    expect(dailyIntake?.isSignificant).toBeDefined();
  });

  it('calculateOneSampleWilcoxon tests against threshold 1.0 correctly', () => {
    const highHqCohort = [1.5, 1.8, 2.2, 2.5, 3.0, 3.2, 4.0, 4.5];
    const testHigh = calculateOneSampleWilcoxon(highHqCohort, 1.0);
    expect(testHigh.medianValue).toBeGreaterThan(1.0);
    expect(testHigh.exceedancePercent).toBe(100);
    expect(testHigh.pValue).toBeLessThan(0.05);
    expect(testHigh.isSignificantRisk).toBe(true);

    const safeCohort = [0.1, 0.2, 0.25, 0.3, 0.4, 0.5];
    const testSafe = calculateOneSampleWilcoxon(safeCohort, 1.0);
    expect(testSafe.medianValue).toBeLessThan(1.0);
    expect(testSafe.exceedancePercent).toBe(0);
    expect(testSafe.pValue).toBeGreaterThan(0.5);
    expect(testSafe.isSignificantRisk).toBe(false);
  });

  it('evaluates SOP Question 4: multi-compound HQs and combined Hazard Index exceedance', () => {
    // 5 PFAS compounds simulated across a cohort of N=15
    const pfoaHQ = [0.2, 0.4, 0.6, 0.8, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8, 3.0];
    const pfosHQ = [0.3, 0.5, 0.7, 0.9, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0, 2.1, 2.3, 2.4, 2.6, 2.8];
    const pfhxsHQ = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8, 0.8, 0.9, 1.0, 1.1, 1.2];
    const pfnaHQ = [
      0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.3, 0.35, 0.4, 0.4, 0.45, 0.5, 0.5, 0.55, 0.6,
    ];
    const genxHQ = [
      0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.1, 0.12, 0.15, 0.18, 0.2,
    ];

    // Sum for Mixture Hazard Index
    const hazardIndex = pfoaHQ.map((v, i) => v + pfosHQ[i] + pfhxsHQ[i] + pfnaHQ[i] + genxHQ[i]);

    const resPfoa = calculateOneSampleWilcoxon(pfoaHQ, 1.0);
    const resHI = calculateOneSampleWilcoxon(hazardIndex, 1.0);

    expect(resPfoa.exceedancePercent).toBeGreaterThan(60);
    expect(resHI.exceedancePercent).toBeGreaterThan(90);
    expect(resHI.medianValue).toBeGreaterThan(1.0);
    expect(resHI.pValue).toBeLessThan(0.05);
    expect(resHI.isSignificantRisk).toBe(true);
  });

  it('evaluates SOP Question 1 & 2: cohort difference via Mann-Whitney U for 22 yrs vs 19 yrs horizons', () => {
    // Average cohort (22 yrs exposure) vs Pregnant cohort (19 yrs exposure with hemodilution)
    const avgCohortCss = [1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9];
    const pregCohortCss = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5]; // Lower due to plasma expansion

    const mwResult = calculateMannWhitneyU(avgCohortCss, pregCohortCss);
    expect(mwResult.pValue).toBeLessThan(0.01);
    expect(mwResult.isSignificant).toBe(true);
    expect(mwResult.rankBiserialCorrelation).toBeGreaterThan(0.8);
  });
});
