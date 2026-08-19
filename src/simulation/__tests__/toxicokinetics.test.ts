import { describe, it, expect } from 'vitest';
import {
  calculateToxicokinetics,
  calculateTimeCourseTrajectory,
  calculateCriticalThresholds,
  calculateExceedanceRangeStats,
} from '../toxicokinetics';
import { PFAS_COMPOUNDS } from '../pfasCompounds';
import type { IterationResult } from '../../types';

describe('Toxicokinetics Engine', () => {
  it('calculateToxicokinetics computes valid 1-compartment pharmacokinetic parameters', () => {
    const input = {
      dailyIntake: 0.1,        // ug/day
      bodyWeight: 55,          // kg
      age: 30,                 // years
      waterConsumption: 1.5,   // L/day
      bioavailability: 0.95,   // 95%
      eliminationHalfLife: 3.8, // years (PFOA half-life)
      exposureDuration: 20,    // years
      compoundId: 'pfoa',
    };

    const result = calculateToxicokinetics(input, 1);

    expect(result.iteration).toBe(1);
    expect(result.steadyStateConcentration).toBeGreaterThan(0);
    expect(result.peakBodyBurden).toBeGreaterThan(0);
    expect(result.clearanceRate).toBeGreaterThan(0);
    expect(result.hazardQuotient).toBeGreaterThanOrEqual(0);
  });

  it('calculateTimeCourseTrajectory generates valid time-course data series', () => {
    const mockResults: IterationResult[] = Array.from({ length: 50 }, (_, i) => ({
      iteration: i + 1,
      dailyIntake: 0.1,
      bodyWeight: 55,
      age: 30,
      waterConsumption: 1.5,
      bioavailability: 0.95,
      eliminationHalfLife: 3.8,
      exposureDuration: 20,
      eliminationRate: 0.0005,
      steadyStateConcentration: 2.5 + (i % 5) * 0.1,
      peakBodyBurden: 50,
      clearanceRate: 0.001,
      hazardQuotient: 0.5,
    }));

    const trajectory = calculateTimeCourseTrajectory(mockResults, 40);

    expect(trajectory.length).toBe(41); // points count
    expect(trajectory[0].year).toBe(0);
    expect(trajectory[0].meanConcentration).toBe(0);

    const lastPoint = trajectory[trajectory.length - 1];
    expect(lastPoint.year).toBe(40);
    expect(lastPoint.meanConcentration).toBeGreaterThan(0);
    expect(lastPoint.p95Concentration).toBeGreaterThanOrEqual(lastPoint.meanConcentration);
    expect(lastPoint.p5Concentration).toBeLessThanOrEqual(lastPoint.meanConcentration);
  });

  it('calculateCriticalThresholds computes exact analytical thresholds in O(1) time', () => {
    const pfoa = PFAS_COMPOUNDS.find((c) => c.id === 'pfoa')!;
    const thresholds = calculateCriticalThresholds(pfoa, 55, 0.9, 3.8);

    // Critical daily intake = BW * RfD = 55 * 1.5e-6 = 8.25e-5 ug/day
    expect(thresholds.criticalDailyIntake).toBeCloseTo(55 * 1.5e-6, 8);
    expect(thresholds.criticalDailyDosePerKg).toBe(1.5e-6);
    expect(thresholds.criticalSerumConcentration).toBeGreaterThan(0);
    expect(thresholds.criticalBodyBurden).toBeGreaterThan(0);
    expect(thresholds.epaMCLConcentration).toBe(0.004); // 4 ng/L = 0.004 ug/L
  });

  it('calculateExceedanceRangeStats calculates correct exceedance ranges', () => {
    const pfoa = PFAS_COMPOUNDS.find((c) => c.id === 'pfoa')!;
    const mockResults: IterationResult[] = [
      {
        iteration: 1,
        dailyIntake: 0.00005,
        bodyWeight: 55,
        age: 30,
        waterConsumption: 1.5,
        bioavailability: 0.9,
        eliminationHalfLife: 3.8,
        exposureDuration: 20,
        eliminationRate: 0.0005,
        steadyStateConcentration: 0.1,
        peakBodyBurden: 2.0,
        clearanceRate: 0.001,
        hazardQuotient: 0.6, // Safe
      },
      {
        iteration: 2,
        dailyIntake: 0.0002,
        bodyWeight: 55,
        age: 30,
        waterConsumption: 1.5,
        bioavailability: 0.9,
        eliminationHalfLife: 3.8,
        exposureDuration: 20,
        eliminationRate: 0.0005,
        steadyStateConcentration: 0.5,
        peakBodyBurden: 10.0,
        clearanceRate: 0.001,
        hazardQuotient: 2.4, // Exceeding
      },
      {
        iteration: 3,
        dailyIntake: 0.0005,
        bodyWeight: 55,
        age: 30,
        waterConsumption: 1.5,
        bioavailability: 0.9,
        eliminationHalfLife: 3.8,
        exposureDuration: 20,
        eliminationRate: 0.0005,
        steadyStateConcentration: 1.2,
        peakBodyBurden: 25.0,
        clearanceRate: 0.001,
        hazardQuotient: 6.0, // Exceeding
      },
    ];

    const stats = calculateExceedanceRangeStats(mockResults, pfoa, 55, 0.9, 3.8);

    expect(stats.totalCount).toBe(3);
    expect(stats.exceedanceCount).toBe(2);
    expect(stats.safeCount).toBe(1);
    expect(stats.exceedancePercent).toBeCloseTo((2 / 3) * 100, 2);

    // Range among exceeding iterations
    expect(stats.exceedingDailyIntake.min).toBe(0.0002);
    expect(stats.exceedingDailyIntake.max).toBe(0.0005);
    expect(stats.exceedingPeakBodyBurden.min).toBe(10.0);
    expect(stats.exceedingPeakBodyBurden.max).toBe(25.0);
    expect(stats.exceedingSerumCss.min).toBe(0.5);
    expect(stats.exceedingSerumCss.max).toBe(1.2);
  });
});

