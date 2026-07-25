import { describe, it, expect } from 'vitest';
import { calculateToxicokinetics, calculateTimeCourseTrajectory } from '../toxicokinetics';
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
});
