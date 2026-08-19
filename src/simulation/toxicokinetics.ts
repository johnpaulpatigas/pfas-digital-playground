import type { IterationResult, CriticalThresholds, ExceedanceRangeStats } from '../types';
import { PFAS_COMPOUNDS, type PFASCompound } from './pfasCompounds';


export interface ToxicokineticInput {
  dailyIntake: number;        // µg/day
  bodyWeight: number;         // kg
  age: number;                // years
  waterConsumption: number;   // L/day
  bioavailability: number;    // fraction (0 to 1)
  eliminationHalfLife: number; // years
  exposureDuration: number;   // years
  compoundId?: string;
}

/**
 * 1-Compartment Pharmacokinetic Model for PFAS (Research Grade)
 */
export function calculateToxicokinetics(
  input: ToxicokineticInput,
  iterationIndex: number
): IterationResult {
  const {
    dailyIntake,
    bodyWeight,
    age,
    waterConsumption,
    bioavailability,
    eliminationHalfLife,
    exposureDuration,
    compoundId = 'pfoa',
  } = input;

  const compound = PFAS_COMPOUNDS.find((c) => c.id === compoundId) || PFAS_COMPOUNDS[0];

  // Half-life in days = T_1/2 (years) * 365.25
  const halfLifeDays = eliminationHalfLife * 365.25;

  // Elimination rate constant k_e (day^-1)
  const eliminationRate = Math.LN2 / Math.max(1, halfLifeDays);

  // Volume of Distribution total (L)
  const volumeOfDistributionTotal = Math.max(1, bodyWeight * compound.volumeOfDistribution);

  // Daily absorbed dose (µg/day)
  const absorbedDose = dailyIntake * bioavailability;

  // Steady State Blood Serum Concentration C_ss (µg/L)
  const steadyStateConcentration = absorbedDose / (volumeOfDistributionTotal * eliminationRate);

  // Cumulative Body Burden B(t) after exposureDuration (µg)
  const exposureDays = exposureDuration * 365.25;
  const peakBodyBurden = (absorbedDose / eliminationRate) * (1 - Math.exp(-eliminationRate * exposureDays));

  // Whole Body Clearance Rate CL (L/kg/day)
  const clearanceRate = eliminationRate * compound.volumeOfDistribution;

  // Daily intake per kg body mass (ug/kg/day)
  const dailyDosePerKg = dailyIntake / Math.max(10, bodyWeight);

  // Hazard Quotient HQ = Dose / Reference Dose (RfD)
  const hazardQuotient = compound.rfdDose > 0 ? dailyDosePerKg / compound.rfdDose : 0;

  return {
    iteration: iterationIndex,
    dailyIntake,
    bodyWeight,
    age,
    waterConsumption,
    bioavailability,
    eliminationHalfLife,
    exposureDuration,
    eliminationRate,
    steadyStateConcentration: Math.max(0, steadyStateConcentration),
    peakBodyBurden: Math.max(0, peakBodyBurden),
    clearanceRate,
    hazardQuotient: Math.max(0, hazardQuotient),
  };
}

/**
 * Generate Time-Course Serum Concentration Trajectory C(t) from year 0 to 50
 */
export function calculateTimeCourseTrajectory(
  results: IterationResult[],
  maxYears: number = 40
) {
  if (!results || results.length === 0) return [];

  const pointsCount = 41;
  const yearStep = maxYears / (pointsCount - 1);

  const timeSeries = [];

  for (let i = 0; i < pointsCount; i++) {
    const tYears = i * yearStep;
    const tDays = tYears * 365.25;

    const concentrations = results.map((r) => {
      // C(t) = C_ss * (1 - exp(-k_e * t_days))
      return r.steadyStateConcentration * (1 - Math.exp(-r.eliminationRate * tDays));
    });

    concentrations.sort((a, b) => a - b);

    const sum = concentrations.reduce((acc, v) => acc + v, 0);
    const mean = sum / concentrations.length;
    const p5 = concentrations[Math.floor(concentrations.length * 0.05)];
    const p95 = concentrations[Math.floor(concentrations.length * 0.95)];

    timeSeries.push({
      year: parseFloat(tYears.toFixed(1)),
      meanConcentration: parseFloat(mean.toFixed(4)),
      p5Concentration: parseFloat(p5.toFixed(4)),
      p95Concentration: parseFloat(p95.toFixed(4)),
    });
  }

  return timeSeries;
}

/**
 * Closed-Form Analytical Critical Threshold Calculator (O(1) Instant Computation)
 * Solves the critical parameter values at which Hazard Quotient HQ = 1.0
 */
export function calculateCriticalThresholds(
  compound: PFASCompound,
  bodyWeight: number = 55,
  bioavailability: number = 0.9,
  halfLifeYears?: number
): CriticalThresholds {
  const halfLife = halfLifeYears && halfLifeYears > 0 ? halfLifeYears : compound.halfLifeYears;
  const halfLifeDays = halfLife * 365.25;
  const eliminationRate = Math.LN2 / Math.max(1, halfLifeDays);

  // Critical daily intake (ug/day) where Dose/BW = RfD => Intake = BW * RfD
  const criticalDailyIntake = bodyWeight * compound.rfdDose;

  // Critical daily absorbed dose (ug/day)
  const criticalAbsorbedDose = criticalDailyIntake * bioavailability;

  // Total volume of distribution (L)
  const volumeOfDistributionTotal = Math.max(1, bodyWeight * compound.volumeOfDistribution);

  // Steady-state serum concentration at critical intake (ug/L)
  const criticalSerumConcentration = criticalAbsorbedDose / (volumeOfDistributionTotal * eliminationRate);

  // Critical steady-state body burden (ug)
  const criticalBodyBurden = criticalAbsorbedDose / eliminationRate;

  // US EPA Maximum Contaminant Level converted to ug/L (ng/L / 1000)
  const epaMCLConcentration = compound.epaMCL / 1000;

  return {
    criticalDailyIntake,
    criticalDailyDosePerKg: compound.rfdDose,
    criticalSerumConcentration,
    criticalBodyBurden,
    epaMCLConcentration,
  };
}

function quantileSorted(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return 0;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedValues[base + 1] !== undefined) {
    return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
  }
  return sortedValues[base];
}

/**
 * Empirical Exceedance Range Breakdown
 * Calculates statistical ranges (min, median, max, P95) for iterations exceeding HQ > 1.0 vs safe
 */
export function calculateExceedanceRangeStats(
  results: IterationResult[],
  compound: PFASCompound,
  meanBodyWeight: number = 55,
  meanBioavailability: number = 0.9,
  meanHalfLife?: number
): ExceedanceRangeStats {
  const totalCount = results.length;
  const thresholds = calculateCriticalThresholds(compound, meanBodyWeight, meanBioavailability, meanHalfLife);

  if (totalCount === 0) {
    return {
      totalCount: 0,
      exceedanceCount: 0,
      exceedancePercent: 0,
      safeCount: 0,
      safePercent: 0,
      exceedingDailyIntake: { min: 0, median: 0, max: 0, p5: 0, p95: 0 },
      exceedingSerumCss: { min: 0, median: 0, max: 0, p5: 0, p95: 0 },
      exceedingPeakBodyBurden: { min: 0, median: 0, max: 0, p5: 0, p95: 0 },
      exceedingBodyWeight: { min: 0, median: 0, max: 0 },
      exceedingHalfLife: { min: 0, median: 0, max: 0 },
      safeDailyIntake: { min: 0, median: 0, max: 0 },
      safeSerumCss: { min: 0, median: 0, max: 0 },
      safePeakBodyBurden: { min: 0, median: 0, max: 0 },
      safeBodyWeight: { min: 0, median: 0, max: 0 },
      safeHalfLife: { min: 0, median: 0, max: 0 },
      thresholds,
    };
  }

  const exceeding = results.filter((r) => r.hazardQuotient > 1.0);
  const safe = results.filter((r) => r.hazardQuotient <= 1.0);

  const getStats = (arr: IterationResult[], key: keyof IterationResult) => {
    if (arr.length === 0) return { min: 0, median: 0, max: 0, p5: 0, p95: 0 };
    const vals = arr.map((r) => r[key] as number).sort((a, b) => a - b);
    return {
      min: vals[0],
      median: quantileSorted(vals, 0.5),
      max: vals[vals.length - 1],
      p5: quantileSorted(vals, 0.05),
      p95: quantileSorted(vals, 0.95),
    };
  };

  const getBasicStats = (arr: IterationResult[], key: keyof IterationResult) => {
    if (arr.length === 0) return { min: 0, median: 0, max: 0 };
    const vals = arr.map((r) => r[key] as number).sort((a, b) => a - b);
    return {
      min: vals[0],
      median: quantileSorted(vals, 0.5),
      max: vals[vals.length - 1],
    };
  };

  return {
    totalCount,
    exceedanceCount: exceeding.length,
    exceedancePercent: (exceeding.length / totalCount) * 100,
    safeCount: safe.length,
    safePercent: (safe.length / totalCount) * 100,
    exceedingDailyIntake: getStats(exceeding, 'dailyIntake'),
    exceedingSerumCss: getStats(exceeding, 'steadyStateConcentration'),
    exceedingPeakBodyBurden: getStats(exceeding, 'peakBodyBurden'),
    exceedingBodyWeight: getBasicStats(exceeding, 'bodyWeight'),
    exceedingHalfLife: getBasicStats(exceeding, 'eliminationHalfLife'),
    safeDailyIntake: getBasicStats(safe, 'dailyIntake'),
    safeSerumCss: getBasicStats(safe, 'steadyStateConcentration'),
    safePeakBodyBurden: getBasicStats(safe, 'peakBodyBurden'),
    safeBodyWeight: getBasicStats(safe, 'bodyWeight'),
    safeHalfLife: getBasicStats(safe, 'eliminationHalfLife'),
    thresholds,
  };
}


