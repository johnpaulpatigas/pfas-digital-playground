import { describe, it, expect } from 'vitest';
import {
  calculateToxicokinetics,
  calculateTimeCourseTrajectory,
  calculateMultiCompoundTimeCourse,
  calculateCriticalThresholds,
  calculateDetailedCriticalAnalysis,
  calculateExceedanceRangeStats,
  calculateCompoundSummaries,
  deriveAutomatedParameters,
} from '../toxicokinetics';
import { PFAS_COMPOUNDS } from '../pfasCompounds';
import type { IterationResult, SimulationParameters, ParameterCriticalThreshold } from '../../types';

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

  it('calculateDetailedCriticalAnalysis accurately evaluates all 6 critical parameters and detects body burden exceedance', () => {
    const pfoa = PFAS_COMPOUNDS.find((c) => c.id === 'pfoa')!;

    // Scenario 1: Safe baseline below critical thresholds
    const safeParams: SimulationParameters = {
      dailyIntake: { id: 'dailyIntake', name: 'Daily Intake', unit: 'µg/d', description: '', scientificContext: '', distribution: { type: 'fixed', value: 0.00005 } },
      bodyWeight: { id: 'bodyWeight', name: 'Body Weight', unit: 'kg', description: '', scientificContext: '', distribution: { type: 'fixed', value: 55.4 } },
      age: { id: 'age', name: 'Age', unit: 'years', description: '', scientificContext: '', distribution: { type: 'fixed', value: 30 } },
      waterConsumption: { id: 'waterConsumption', name: 'Water', unit: 'L/d', description: '', scientificContext: '', distribution: { type: 'fixed', value: 2.0 } },
      bioavailability: { id: 'bioavailability', name: 'Bioavailability', unit: 'fraction', description: '', scientificContext: '', distribution: { type: 'fixed', value: 0.95 } },
      eliminationHalfLife: { id: 'eliminationHalfLife', name: 'Half-Life', unit: 'years', description: '', scientificContext: '', distribution: { type: 'fixed', value: 3.8 } },
      exposureDuration: { id: 'exposureDuration', name: 'Duration', unit: 'years', description: '', scientificContext: '', distribution: { type: 'uniform', min: 25, max: 30 } },
    };

    const safeAnalysis = calculateDetailedCriticalAnalysis(pfoa, safeParams);

    expect(safeAnalysis.parameterThresholds.length).toBe(6);
    expect(safeAnalysis.isBurdenExceeded).toBe(false);
    expect(safeAnalysis.hazardQuotient).toBeLessThan(1.0);
    expect(safeAnalysis.steadyStateFractionAtExposureDuration).toBeGreaterThan(99.0); // 25-30 yrs achieves >99%
    expect(safeAnalysis.baselineBodyBurden).toBeLessThanOrEqual(safeAnalysis.criticalBodyBurden);

    // Scenario 2: Exceeding critical threshold (e.g. Daily intake = 0.09 ug/d > RfD limit for 55.4kg = 0.0831 ug/d)
    const exceedParams: SimulationParameters = {
      ...safeParams,
      dailyIntake: { ...safeParams.dailyIntake, distribution: { type: 'fixed', value: 0.09 } },
    };

    const exceedAnalysis = calculateDetailedCriticalAnalysis(pfoa, exceedParams);
    expect(exceedAnalysis.isBurdenExceeded).toBe(true);
    expect(exceedAnalysis.hazardQuotient).toBeGreaterThan(1.0);
    expect(exceedAnalysis.burdenExceedanceRatio).toBeGreaterThan(1.0);
    expect(exceedAnalysis.parameterThresholds.find((p: ParameterCriticalThreshold) => p.id === 'dailyIntake')?.isExceeded).toBe(true);
  });

  it('calculateToxicokinetics populates compoundOutputs for all 5 PFAS chemicals', () => {
    const input = {
      dailyIntake: 0.05,
      bodyWeight: 60,
      age: 28,
      waterConsumption: 2.0,
      bioavailability: 0.9,
      eliminationHalfLife: 3.8,
      exposureDuration: 15,
      compoundId: 'pfoa',
    };

    const result = calculateToxicokinetics(input, 1);
    expect(result.compoundOutputs).toBeDefined();
    expect(Object.keys(result.compoundOutputs!)).toEqual(['pfoa', 'pfos', 'pfhxs', 'pfna', 'genx']);

    // Half-lives and Vd differences should reflect in Css and peakBodyBurden
    const pfoaOut = result.compoundOutputs!.pfoa;
    const pfhxsOut = result.compoundOutputs!.pfhxs;
    const genxOut = result.compoundOutputs!.genx;

    expect(pfoaOut.steadyStateConcentration).toBeGreaterThan(0);
    // PFHxS has higher half-life (8.5 yrs vs 3.8 yrs) -> slower elimination
    expect(pfhxsOut.eliminationRate).toBeLessThan(pfoaOut.eliminationRate);
    // GenX has short half-life (0.2 yrs) -> fast elimination
    expect(genxOut.eliminationRate).toBeGreaterThan(pfoaOut.eliminationRate);
  });

  it('calculateMultiCompoundTimeCourse generates trajectories for all 5 PFAS compounds', () => {
    const mockResults: IterationResult[] = Array.from({ length: 20 }, (_, i) => {
      return calculateToxicokinetics({
        dailyIntake: 0.0001 * (i + 1),
        bodyWeight: 60,
        age: 30,
        waterConsumption: 2.0,
        bioavailability: 0.9,
        eliminationHalfLife: 3.8,
        exposureDuration: 20,
        compoundId: 'pfoa',
      }, i + 1);
    });

    const trajectory = calculateMultiCompoundTimeCourse(mockResults, 40);
    expect(trajectory.length).toBe(41);
    expect(trajectory[0].year).toBe(0);
    expect(trajectory[0].pfoa).toBe(0);
    expect(trajectory[0].pfos).toBe(0);
    expect(trajectory[0].pfhxs).toBe(0);
    expect(trajectory[0].pfna).toBe(0);
    expect(trajectory[0].genx).toBe(0);

    const lastPoint = trajectory[trajectory.length - 1];
    expect(lastPoint.year).toBe(40);
    expect(lastPoint.pfoa).toBeGreaterThan(0);
    expect(lastPoint.pfos).toBeGreaterThan(0);
    expect(lastPoint.pfhxs).toBeGreaterThan(0);
    expect(lastPoint.pfna).toBeGreaterThan(0);
    expect(lastPoint.genx).toBeGreaterThan(0);
  });

  it('calculateCompoundSummaries calculates statistics for all 5 PFAS compounds', () => {
    const safeParams: SimulationParameters = {
      dailyIntake: { id: 'dailyIntake', name: 'Daily Intake', unit: 'µg/d', description: '', scientificContext: '', distribution: { type: 'fixed', value: 0.0001 } },
      bodyWeight: { id: 'bodyWeight', name: 'Body Weight', unit: 'kg', description: '', scientificContext: '', distribution: { type: 'fixed', value: 60 } },
      age: { id: 'age', name: 'Age', unit: 'years', description: '', scientificContext: '', distribution: { type: 'fixed', value: 30 } },
      waterConsumption: { id: 'waterConsumption', name: 'Water', unit: 'L/d', description: '', scientificContext: '', distribution: { type: 'fixed', value: 2.0 } },
      bioavailability: { id: 'bioavailability', name: 'Bioavailability', unit: 'fraction', description: '', scientificContext: '', distribution: { type: 'fixed', value: 0.9 } },
      eliminationHalfLife: { id: 'eliminationHalfLife', name: 'Half-Life', unit: 'years', description: '', scientificContext: '', distribution: { type: 'fixed', value: 3.8 } },
      exposureDuration: { id: 'exposureDuration', name: 'Duration', unit: 'years', description: '', scientificContext: '', distribution: { type: 'fixed', value: 20 } },
    };

    const mockResults: IterationResult[] = Array.from({ length: 20 }, (_, i) => {
      return calculateToxicokinetics({
        dailyIntake: 0.0001 * (i + 1),
        bodyWeight: 60,
        age: 30,
        waterConsumption: 2.0,
        bioavailability: 0.9,
        eliminationHalfLife: 3.8,
        exposureDuration: 20,
        compoundId: 'pfoa',
      }, i + 1);
    });

    const summaries = calculateCompoundSummaries(mockResults, safeParams);

    expect(summaries.length).toBe(5);
    const compoundIds = summaries.map((s) => s.compoundId);
    expect(compoundIds).toEqual(['pfoa', 'pfos', 'pfhxs', 'pfna', 'genx']);

    summaries.forEach((s) => {
      expect(s.meanCss).toBeGreaterThan(0);
      expect(s.meanBodyBurden).toBeGreaterThan(0);
      expect(s.criticalBodyBurden).toBeGreaterThan(0);
      expect(s.status).toBeDefined();
    });

    // Verify identification of the compound with highest Css
    const highestCompound = summaries.reduce((highest, current) => {
      return current.meanCss > highest.meanCss ? current : highest;
    }, summaries[0]);
    expect(highestCompound.compoundId).toBe('pfhxs');
    expect(highestCompound.meanCss).toBeGreaterThan(summaries.find((s) => s.compoundId === 'pfoa')!.meanCss);
  });

  it('deriveAutomatedParameters accurately computes aggregate daily intake, exposure duration, and physiological distributions from 3 user inputs', () => {
    const profile = {
      bodyWeight: 55.4,
      age: 30,
      waterConsumption: 2.0,
      waterConcentrationNgL: 20, // 20 ng/L = 0.020 µg/L
    };

    const derived = deriveAutomatedParameters(profile);

    // Water intake = 2.0 L * 0.020 µg/L = 0.040 µg/day
    expect(derived.derivedIntakeWaterUg).toBeCloseTo(0.040, 4);
    // Dietary intake = 55.4 kg * 0.0005 µg/kg/d = 0.0277 µg/day
    expect(derived.derivedIntakeDietaryUg).toBeCloseTo(0.0277, 4);
    // Total intake = 0.040 + 0.0277 = 0.0677 µg/day
    expect(derived.derivedTotalIntakeUg).toBeCloseTo(0.0677, 4);
    // Exposure duration = clamp(30 - 10, 1, 40) = 20 years
    expect(derived.derivedExposureYears).toBe(20);
    expect(derived.derivedBioavailability).toBe(0.92);

    expect(derived.parameters.dailyIntake.distribution.type).toBe('lognormal');
    expect(derived.parameters.bodyWeight.distribution.type).toBe('normal');
    expect(derived.parameters.age.distribution.type).toBe('fixed');
    expect(derived.parameters.waterConsumption.distribution.type).toBe('lognormal');
    expect(derived.parameters.bioavailability.distribution.type).toBe('fixed');
  });
});


