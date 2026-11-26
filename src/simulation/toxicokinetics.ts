import type {
  CompoundIterationOutput,
  CompoundSummary,
  CriticalThresholds,
  DetailedCriticalAnalysis,
  DistributionParams,
  ExceedanceRangeStats,
  IterationResult,
  ParameterCriticalThreshold,
  SimulationParameters,
} from '../types';
import { getDistributionMean } from './distributions';
import {
  DAILY_INTAKE_PARAMETER_KEYS,
  getSimulationParameter,
  WATER_CONCENTRATION_PARAMETER_KEYS,
} from './parameters';
import { PFAS_COMPOUNDS, type PFASCompound } from './pfasCompounds';
import { calculateOneSampleWilcoxon, quantileSorted } from './statistics';

export interface ToxicokineticInput {
  dailyIntake: number; // dietary/non-water µg/day for the active compound
  compoundDailyIntakes?: Record<string, number>; // dietary/non-water µg/day
  compoundWaterConcentrations?: Record<string, number>; // ng/L
  bodyWeight: number; // kg
  age: number; // years
  waterConsumption: number; // L/day
  bioavailability: number; // fraction (0 to 1)
  eliminationHalfLife: number; // years
  exposureDuration: number; // years
  compoundId?: string;
}

/**
 * Canonical toxicokinetic helpers.
 * Every panel derives its limits, HQ and exceedance flag from these formulas so
 * the same quantity never has two different values.
 */

/** Body weight floor used by the dose model. */
const getEffectiveBodyWeight = (bodyWeight: number) => Math.max(10, bodyWeight);

/** First-order serum elimination rate (day^-1) for a half-life in years. */
export const getEliminationRate = (halfLifeYears: number) =>
  Math.LN2 / Math.max(1, halfLifeYears * 365.25);

/** Solve for the half-life where finite-window body burden reaches its threshold. */
export function calculateCriticalHalfLife(
  compound: PFASCompound,
  bodyWeight: number,
  dailyIntake: number,
  bioavailability: number,
  exposureDurationYears: number,
): number | null {
  if (dailyIntake <= 0 || bioavailability <= 0 || exposureDurationYears <= 0) return null;

  const criticalIntake = calculateCriticalIntake(compound, bodyWeight);
  const targetBurden = calculateCriticalBodyBurden(
    compound,
    bodyWeight,
    bioavailability,
    compound.halfLifeYears,
    exposureDurationYears,
  );
  const burdenAtHalfLife = (halfLifeYears: number) => {
    const k = getEliminationRate(halfLifeYears);
    return (
      ((dailyIntake * bioavailability) / k) * (1 - Math.exp(-k * exposureDurationYears * 365.25))
    );
  };

  const lower = 0.1;
  const upper = 1000;
  if (dailyIntake <= criticalIntake) return null;
  if (burdenAtHalfLife(lower) >= targetBurden) return lower;
  if (burdenAtHalfLife(upper) < targetBurden) return null;

  let low = lower;
  let high = upper;
  for (let iteration = 0; iteration < 80; iteration++) {
    const midpoint = (low + high) / 2;
    if (burdenAtHalfLife(midpoint) >= targetBurden) high = midpoint;
    else low = midpoint;
  }
  return high;
}

/** Time for current intake to reach the HQ=1 burden under the active kinetics. */
export function calculateCriticalExposureDuration(
  compound: PFASCompound,
  bodyWeight: number,
  dailyIntake: number,
  bioavailability: number,
  halfLifeYears: number,
): number | null {
  if (dailyIntake <= 0 || bioavailability <= 0 || halfLifeYears <= 0) return null;
  const criticalIntake = calculateCriticalIntake(compound, bodyWeight);
  if (dailyIntake <= criticalIntake) return null;

  const k = getEliminationRate(halfLifeYears);
  const maxDurationDays = 100_000 * 365.25;
  const maxBurden = (dailyIntake * bioavailability) / k;
  const targetBurden = calculateCriticalBodyBurden(
    compound,
    bodyWeight,
    bioavailability,
    halfLifeYears,
    100_000,
  );
  if (maxBurden < targetBurden) return null;

  const ratio = targetBurden / maxBurden;
  if (ratio >= 1) return null;
  const durationDays = -Math.log1p(-ratio) / k;
  return durationDays <= maxDurationDays ? durationDays / 365.25 : null;
}

/** Intake (ug/day) at which the dose per kg equals the compound RfD. */
export const calculateCriticalIntake = (compound: PFASCompound, bodyWeight: number): number =>
  getEffectiveBodyWeight(bodyWeight) * compound.rfdDose;

/** Single definition of the hazard quotient used across the app. */
export const calculateHazardQuotient = (
  compound: PFASCompound,
  dailyIntake: number,
  bodyWeight: number,
): number =>
  compound.rfdDose > 0 ? dailyIntake / (getEffectiveBodyWeight(bodyWeight) * compound.rfdDose) : 0;

/** Burden at HQ = 1.0, accumulated over the same exposure window as the sample. */
export const calculateCriticalBodyBurden = (
  compound: PFASCompound,
  bodyWeight: number,
  bioavailability: number,
  halfLifeYears: number,
  exposureDurationYears: number,
): number => {
  const k = getEliminationRate(halfLifeYears);
  const criticalAbsorbedDose = calculateCriticalIntake(compound, bodyWeight) * bioavailability;
  return (criticalAbsorbedDose / k) * (1 - Math.exp(-k * exposureDurationYears * 365.25));
};

/** Steady-state serum concentration at HQ = 1.0 (Css has no duration term). */
export const calculateCriticalSerumCss = (
  compound: PFASCompound,
  bodyWeight: number,
  bioavailability: number,
  halfLifeYears: number,
): number => {
  const k = getEliminationRate(halfLifeYears);
  const volumeOfDistribution = Math.max(1, bodyWeight * compound.volumeOfDistribution);
  return (
    (calculateCriticalIntake(compound, bodyWeight) * bioavailability) / (volumeOfDistribution * k)
  );
};

/**
 * One-compartment toxicokinetic model for PFAS.
 * Computes outputs for the active compound and populates compoundOutputs for all 5 PFAS types.
 */
export function calculateToxicokinetics(
  input: ToxicokineticInput,
  iterationIndex: number,
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

  // Cumulative exposure window (days)
  const exposureDays = exposureDuration * 365.25;

  // Exploratory sum of HQs across the 5 modeled compounds; this is not the EPA
  // NPDWR drinking-water mixture HI (which uses water concentrations/HBWCs and includes PFBS).
  // The active compound uses the sampled half-life; the others use their reference value.
  const compoundOutputs: Record<string, CompoundIterationOutput> = {};
  let hazardIndex = 0;
  for (let i = 0; i < PFAS_COMPOUNDS.length; i++) {
    const c = PFAS_COMPOUNDS[i];
    const cDietaryIntake = input.compoundDailyIntakes?.[c.id] ?? dailyIntake;
    const cWaterConcentration = input.compoundWaterConcentrations?.[c.id] ?? 0;
    const cWaterIntake = (cWaterConcentration / 1000) * waterConsumption;
    const cIntake = cDietaryIntake + cWaterIntake;
    const cAbsorbedDose = cIntake * bioavailability;
    const cHalfLife = compoundId === c.id ? eliminationHalfLife : c.halfLifeYears;
    const cEliminationRate = getEliminationRate(cHalfLife);
    const cVdTotal = Math.max(1, bodyWeight * c.volumeOfDistribution);
    const cCss = cAbsorbedDose / (cVdTotal * cEliminationRate);
    const cBodyBurden =
      (cAbsorbedDose / cEliminationRate) * (1 - Math.exp(-cEliminationRate * exposureDays));
    const cClearance = cEliminationRate * c.volumeOfDistribution;
    const cHQ = calculateHazardQuotient(c, cIntake, bodyWeight);
    const cCriticalBodyBurden = calculateCriticalBodyBurden(
      c,
      bodyWeight,
      bioavailability,
      cHalfLife,
      exposureDuration,
    );
    hazardIndex += cHQ;

    compoundOutputs[c.id] = {
      compoundId: c.id,
      dietaryIntake: cDietaryIntake,
      waterConcentration: cWaterConcentration,
      waterIntake: cWaterIntake,
      dailyIntake: cIntake,
      eliminationRate: cEliminationRate,
      steadyStateConcentration: Math.max(0, cCss),
      peakBodyBurden: Math.max(0, cBodyBurden),
      clearanceRate: cClearance,
      hazardQuotient: Math.max(0, cHQ),
      criticalBodyBurden: cCriticalBodyBurden,
      criticalSerumCss: calculateCriticalSerumCss(c, bodyWeight, bioavailability, cHalfLife),
      criticalDailyIntake: calculateCriticalIntake(c, bodyWeight),
      isExceeded: cBodyBurden > cCriticalBodyBurden,
    };
  }

  // The active compound's output is already part of the multi-compound evaluation.
  const activeOutput = compoundOutputs[compound.id];

  return {
    iteration: iterationIndex,
    dailyIntake: activeOutput.dailyIntake,
    dietaryIntake: activeOutput.dietaryIntake,
    waterIntake: activeOutput.waterIntake,
    bodyWeight,
    age,
    waterConsumption,
    bioavailability,
    eliminationHalfLife,
    exposureDuration,
    eliminationRate: activeOutput.eliminationRate,
    steadyStateConcentration: activeOutput.steadyStateConcentration,
    peakBodyBurden: activeOutput.peakBodyBurden,
    clearanceRate: activeOutput.clearanceRate,
    hazardQuotient: activeOutput.hazardQuotient,
    hazardIndex: Math.max(0, hazardIndex),
    criticalBodyBurden: activeOutput.criticalBodyBurden,
    isExceeded: activeOutput.isExceeded,
    compoundOutputs,
  };
}

/**
 * Generate Time-Course Serum Concentration Trajectory C(t) from year 0 to 50
 */
export function calculateTimeCourseTrajectory(results: IterationResult[], maxYears: number = 40) {
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
 * Extract central tendency and range from any distribution configuration
 */
export function extractDistributionCentralValue(distribution: DistributionParams): {
  mean: number;
  min: number;
  max: number;
  displayRange: string;
} {
  const mean = getDistributionMean(distribution);

  switch (distribution.type) {
    case 'fixed':
      return {
        mean,
        min: distribution.value,
        max: distribution.value,
        displayRange: `${distribution.value}`,
      };
    case 'uniform':
      return {
        mean,
        min: distribution.min,
        max: distribution.max,
        displayRange: `[${distribution.min} to ${distribution.max}]`,
      };
    case 'normal':
      return {
        mean,
        min: Math.max(0, distribution.mean - 2 * distribution.sd),
        max: distribution.mean + 2 * distribution.sd,
        displayRange: `${distribution.mean} (±${distribution.sd})`,
      };
    case 'lognormal':
      return {
        mean,
        min: Math.max(0, distribution.mean - 2 * distribution.sd),
        max: distribution.mean + 2 * distribution.sd,
        displayRange: `${distribution.mean} (σ: ${distribution.sd})`,
      };
    case 'triangular':
      return {
        mean,
        min: distribution.min,
        max: distribution.max,
        displayRange: `Mode ${distribution.mode} [${distribution.min} to ${distribution.max}]`,
      };
    default:
      return {
        mean: 0,
        min: 0,
        max: 0,
        displayRange: '0',
      };
  }
}

/**
 * Closed-Form Analytical Critical Threshold Calculator (O(1) Instant Computation)
 * Solves the critical parameter values at which Hazard Quotient HQ = 1.0
 */
export function calculateCriticalThresholds(
  compound: PFASCompound,
  bodyWeight: number = 55,
  bioavailability: number = 0.9,
  halfLifeYears?: number,
  dietaryIntake: number = 0,
): CriticalThresholds {
  const halfLife = halfLifeYears && halfLifeYears > 0 ? halfLifeYears : compound.halfLifeYears;
  const halfLifeDays = halfLife * 365.25;
  const eliminationRate = Math.LN2 / Math.max(1, halfLifeDays);

  // Critical daily intake (ug/day) where Dose/BW = RfD => Intake = BW * RfD
  const criticalDailyIntake = calculateCriticalIntake(compound, bodyWeight);

  // Critical daily absorbed dose (ug/day)
  const criticalAbsorbedDose = criticalDailyIntake * bioavailability;

  // Total volume of distribution (L)
  const volumeOfDistributionTotal = Math.max(1, bodyWeight * compound.volumeOfDistribution);

  // Steady-state serum concentration at critical intake (ug/L)
  const criticalSerumConcentration =
    criticalAbsorbedDose / (volumeOfDistributionTotal * eliminationRate);

  // Critical steady-state body burden (ug)
  const criticalBodyBurden = criticalAbsorbedDose / eliminationRate;

  // US EPA Maximum Contaminant Level converted to ug/L (ng/L / 1000)
  const epaMCLConcentration = compound.epaMCL / 1000;

  // Critical drinking water consumption volume (L/day) to reach RfD when water is at EPA MCL
  const criticalWaterConsumption =
    epaMCLConcentration > 0
      ? Math.max(0, criticalDailyIntake - dietaryIntake) / epaMCLConcentration
      : 2.0;

  return {
    criticalDailyIntake,
    criticalDailyDosePerKg: compound.rfdDose,
    criticalSerumConcentration,
    criticalBodyBurden,
    criticalWaterConsumption,
    // HQ uses total ingested intake directly; absorption affects burden, not HQ.
    criticalBioavailability: bioavailability,
    criticalHalfLife:
      calculateCriticalHalfLife(compound, bodyWeight, criticalDailyIntake, bioavailability, 25) ??
      halfLife,
    criticalExposureDurationMin: 0,
    criticalExposureDurationMax: 0,
    epaMCLConcentration,
  };
}

/**
 * Detailed 6-Parameter Critical Threshold & Baseline Body Burden Analyzer
 * Evaluates individual parameter critical limits and detects automatic exceedance of PFAS body burden.
 */
export function calculateDetailedCriticalAnalysis(
  compound: PFASCompound,
  parameters: SimulationParameters,
): DetailedCriticalAnalysis {
  const bwStats = extractDistributionCentralValue(parameters.bodyWeight.distribution);
  const intakeKey =
    DAILY_INTAKE_PARAMETER_KEYS[compound.id as keyof typeof DAILY_INTAKE_PARAMETER_KEYS];
  const intakeStats = extractDistributionCentralValue(
    getSimulationParameter(parameters, intakeKey).distribution,
  );
  const waterConcentrationKey =
    WATER_CONCENTRATION_PARAMETER_KEYS[
      compound.id as keyof typeof WATER_CONCENTRATION_PARAMETER_KEYS
    ];
  const waterConcentrationStats = extractDistributionCentralValue(
    getSimulationParameter(parameters, waterConcentrationKey).distribution,
  );
  const waterStats = extractDistributionCentralValue(parameters.waterConsumption.distribution);
  const bioStats = extractDistributionCentralValue(parameters.bioavailability.distribution);
  const halfLifeStats = extractDistributionCentralValue(
    parameters.eliminationHalfLife.distribution,
  );
  const durationStats = extractDistributionCentralValue(parameters.exposureDuration.distribution);

  const meanBW = bwStats.mean;
  const meanDietaryIntake = intakeStats.mean;
  const meanWater = waterStats.mean;
  const meanWaterConcentration = waterConcentrationStats.mean;
  const meanWaterIntake = (meanWaterConcentration / 1000) * meanWater;
  const meanIntake = meanDietaryIntake + meanWaterIntake;
  const totalIntakeMin = intakeStats.min + (waterConcentrationStats.min / 1000) * waterStats.min;
  const totalIntakeMax = intakeStats.max + (waterConcentrationStats.max / 1000) * waterStats.max;
  const meanBio = Math.min(1.0, Math.max(0.01, bioStats.mean));
  const meanHalfLife = Math.max(0.01, halfLifeStats.mean);
  const meanDuration = Math.max(0.1, durationStats.mean);

  const halfLifeDays = meanHalfLife * 365.25;
  const eliminationRate = Math.LN2 / Math.max(1, halfLifeDays);
  const exposureDays = meanDuration * 365.25;

  const thresholds = calculateCriticalThresholds(
    compound,
    meanBW,
    meanBio,
    meanHalfLife,
    meanDietaryIntake,
  );

  // Toxicokinetic body burden calculations
  const currentAbsorbedDose = meanIntake * meanBio;
  const steadyStateFraction = 1 - Math.exp(-eliminationRate * exposureDays);
  const steadyStateFractionPercent = steadyStateFraction * 100;

  // Dynamic body burden at current exposure duration
  const currentBodyBurden = (currentAbsorbedDose / eliminationRate) * steadyStateFraction;
  const steadyStateBodyBurden = currentAbsorbedDose / eliminationRate;

  // Critical body burden at current exposure duration & steady state
  const criticalBodyBurden = calculateCriticalBodyBurden(
    compound,
    meanBW,
    meanBio,
    meanHalfLife,
    meanDuration,
  );
  const criticalSteadyStateBodyBurden = thresholds.criticalBodyBurden;

  // Serum Css
  const volumeOfDistributionTotal = Math.max(1, meanBW * compound.volumeOfDistribution);
  const currentSerumCss = currentAbsorbedDose / (volumeOfDistributionTotal * eliminationRate);
  const criticalSerumCss = thresholds.criticalSerumConcentration;

  // Hazard Quotient
  const hazardQuotient = calculateHazardQuotient(compound, meanIntake, meanBW);

  const burdenExceedanceRatio =
    criticalBodyBurden > 0 ? currentBodyBurden / criticalBodyBurden : hazardQuotient;
  const isBurdenExceeded = currentBodyBurden > criticalBodyBurden || hazardQuotient > 1.0;

  const timeToExceedanceYears = calculateCriticalExposureDuration(
    compound,
    meanBW,
    meanIntake,
    meanBio,
    meanHalfLife,
  );

  // --- Parameter 1: Estimated PFAS Intake ---
  const criticalIntakeVal = thresholds.criticalDailyIntake;
  const intakeExceeded = meanIntake > criticalIntakeVal;
  const intakeStatus: 'safe' | 'borderline' | 'exceeded' =
    meanIntake > criticalIntakeVal * 1.05
      ? 'exceeded'
      : meanIntake >= criticalIntakeVal * 0.9
        ? 'borderline'
        : 'safe';

  // --- Parameter 2: Body Weight ---
  const criticalBWVal = compound.rfdDose > 0 ? meanIntake / compound.rfdDose : meanBW;
  const bwExceeded = meanBW < criticalBWVal;
  const bwStatus: 'safe' | 'borderline' | 'exceeded' =
    meanBW < criticalBWVal * 0.95
      ? 'exceeded'
      : meanBW <= criticalBWVal * 1.1
        ? 'borderline'
        : 'safe';

  // --- Parameter 3: Daily Drinking Water Intake ---
  const criticalWaterVal =
    meanWaterConcentration > 0
      ? Math.max(0, criticalIntakeVal - meanDietaryIntake) / (meanWaterConcentration / 1000)
      : Number.POSITIVE_INFINITY;
  const waterExceeded = meanWater > criticalWaterVal;
  const waterStatus: 'safe' | 'borderline' | 'exceeded' =
    meanWater > criticalWaterVal * 1.05
      ? 'exceeded'
      : meanWater >= criticalWaterVal * 0.9
        ? 'borderline'
        : 'safe';

  // --- Parameter 4: Gastrointestinal Bioavailability ---
  // HQ is based on ingested dose; bioavailability does not change this benchmark.
  const criticalBioVal = 1;
  const bioExceeded = false;
  const bioStatus: 'safe' | 'borderline' | 'exceeded' = 'safe';

  // --- Parameter 5: Elimination Half-Life ---
  const criticalHalfLifeVal = calculateCriticalHalfLife(
    compound,
    meanBW,
    meanIntake,
    meanBio,
    meanDuration,
  );
  const halfLifeExceeded = criticalHalfLifeVal !== null && meanHalfLife >= criticalHalfLifeVal;
  const halfLifeStatus: 'safe' | 'borderline' | 'exceeded' =
    criticalHalfLifeVal === null
      ? 'safe'
      : meanHalfLife >= criticalHalfLifeVal * 1.02
        ? 'exceeded'
        : meanHalfLife >= criticalHalfLifeVal * 0.92
          ? 'borderline'
          : 'safe';

  // --- Parameter 6: Exposure Duration ---
  const durationExceeded = timeToExceedanceYears !== null && meanDuration >= timeToExceedanceYears;
  const durationStatus: 'safe' | 'borderline' | 'exceeded' =
    timeToExceedanceYears === null
      ? 'safe'
      : meanDuration >= timeToExceedanceYears
        ? 'exceeded'
        : meanDuration >= timeToExceedanceYears * 0.9
          ? 'borderline'
          : 'safe';

  const parameterThresholds: ParameterCriticalThreshold[] = [
    {
      id: intakeKey,
      name: `Estimated ${compound.id.toUpperCase()} Intake`,
      unit: 'µg/day',
      criticalValue: criticalIntakeVal,
      criticalRangeDisplay:
        criticalIntakeVal < 0.001
          ? `> ${(criticalIntakeVal * 1000).toFixed(3)} ng/d`
          : `> ${criticalIntakeVal.toFixed(4)} µg/d`,
      currentValue: meanIntake,
      currentRangeDisplay: `${totalIntakeMin.toFixed(5)} to ${totalIntakeMax.toFixed(5)} µg/day`,
      isExceeded: intakeExceeded,
      status: intakeStatus,
      direction: 'greater_than',
      explanation:
        'Daily ingestion intake above which dose per kg body weight exceeds Reference Dose (RfD), causing body burden to exceed safe capacity.',
      formula: 'I_{\\text{crit}} = BW \\times \\text{RfD}',
    },
    {
      id: 'bodyWeight',
      name: 'Body Weight',
      unit: 'kg',
      criticalValue: criticalBWVal,
      criticalRangeDisplay: `< ${Math.min(999, criticalBWVal).toFixed(1)} kg`,
      currentValue: meanBW,
      currentRangeDisplay: bwStats.displayRange,
      isExceeded: bwExceeded,
      status: bwStatus,
      direction: 'less_than',
      explanation:
        'Body weight below which internal dose concentration is concentrated, shrinking distribution volume and driving HQ > 1.0.',
      formula: 'BW_{\\text{crit}} = \\frac{I}{\\text{RfD}}',
    },
    {
      id: 'waterConsumption',
      name: 'Daily Drinking Water Intake',
      unit: 'L/day',
      criticalValue: criticalWaterVal,
      criticalRangeDisplay: `> ${criticalWaterVal.toFixed(2)} L/d`,
      currentValue: meanWater,
      currentRangeDisplay: waterStats.displayRange,
      isExceeded: waterExceeded,
      status: waterStatus,
      direction: 'greater_than',
      explanation: `Drinking volume threshold where water consumption at the EPA MCL (${compound.epaMCL} ng/L) alone exhausts 100% of the acceptable daily intake.`,
      formula: 'W_{\\text{crit}} = \\frac{BW \\times \\text{RfD}}{\\text{EPA MCL}}',
    },
    {
      id: 'bioavailability',
      name: 'Gastrointestinal Bioavailability',
      unit: 'fraction',
      criticalValue: criticalBioVal,
      criticalRangeDisplay: 'Not applicable to the intake-based HQ',
      currentValue: meanBio,
      currentRangeDisplay: `${(meanBio * 100).toFixed(0)}%`,
      isExceeded: bioExceeded,
      status: bioStatus,
      direction: 'greater_than',
      explanation:
        'Bioavailability changes estimated absorbed dose and body burden, but the selected HQ is based on ingested dose and does not vary with this parameter.',
      formula: '\\text{HQ} = \\frac{I / BW}{\\text{RfD}} \\quad (\\text{independent of } f_{abs})',
    },
    {
      id: 'eliminationHalfLife',
      name: 'Elimination Half-Life',
      unit: 'years',
      criticalValue: criticalHalfLifeVal ?? Number.POSITIVE_INFINITY,
      criticalRangeDisplay:
        criticalHalfLifeVal === null
          ? 'No body-burden crossing'
          : `≥ ${criticalHalfLifeVal.toFixed(2)} yrs`,
      currentValue: meanHalfLife,
      currentRangeDisplay: halfLifeStats.displayRange,
      isExceeded: halfLifeExceeded,
      status: halfLifeStatus,
      direction: 'greater_than',
      explanation:
        'Half-life at which modeled body burden reaches the HQ = 1 body-burden threshold for the current intake, bioavailability, body weight, and exposure duration. Calculated numerically from the finite-window model.',
      formula: 'B(T_{1/2,\\text{crit}}) = B_{\\text{crit}}',
    },
    {
      id: 'exposureDuration',
      name: 'Exposure Duration',
      unit: 'years',
      criticalValue: timeToExceedanceYears ?? Number.POSITIVE_INFINITY,
      criticalRangeDisplay:
        timeToExceedanceYears !== null
          ? `≥ ${timeToExceedanceYears.toFixed(2)} years`
          : 'No body-burden crossing',
      currentValue: meanDuration,
      currentRangeDisplay: durationStats.displayRange,
      isExceeded: durationExceeded,
      status: durationStatus,
      direction: 'range',
      explanation:
        'Time for current total intake to reach the HQ = 1 body-burden threshold under the selected half-life and bioavailability. A crossing is shown only when the current intake exceeds the RfD intake threshold.',
      formula:
        't_{\\text{crit}} = -\\frac{1}{k_e}\\ln\\left(1 - \\frac{B_{\\text{crit}} k_e}{I f_{abs}}\\right)',
    },
  ];

  const overallStatus: 'safe' | 'borderline' | 'exceeded' = isBurdenExceeded
    ? 'exceeded'
    : parameterThresholds.some((p) => p.status === 'borderline')
      ? 'borderline'
      : 'safe';

  return {
    thresholds,
    parameterThresholds,
    baselineBodyBurden: currentBodyBurden,
    steadyStateBodyBurden,
    criticalBodyBurden,
    criticalSteadyStateBodyBurden,
    currentSerumCss,
    criticalSerumCss,
    hazardQuotient,
    burdenExceedanceRatio,
    isBurdenExceeded,
    steadyStateFractionAtExposureDuration: parseFloat(steadyStateFractionPercent.toFixed(1)),
    timeToExceedanceYears,
    overallStatus,
  };
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
  meanHalfLife?: number,
  parameters?: SimulationParameters,
  precomputedAnalysis?: DetailedCriticalAnalysis,
): ExceedanceRangeStats {
  const totalCount = results.length;
  const detailedAnalysis =
    precomputedAnalysis ??
    (parameters ? calculateDetailedCriticalAnalysis(compound, parameters) : undefined);
  const thresholds =
    detailedAnalysis?.thresholds ??
    calculateCriticalThresholds(compound, meanBodyWeight, meanBioavailability, meanHalfLife);

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
      detailedAnalysis,
    };
  }

  // Use the same per-iteration exceedance flag that the compound summaries use.
  const isExceeded = (r: IterationResult) =>
    r.compoundOutputs?.[compound.id]?.isExceeded ?? r.isExceeded ?? r.hazardQuotient > 1.0;
  const exceeding = results.filter(isExceeded);
  const safe = results.filter((r) => !isExceeded(r));

  const getStats = (arr: IterationResult[], key: keyof IterationResult) => {
    if (arr.length === 0) return { min: 0, median: 0, max: 0, p5: 0, p95: 0 };
    const vals = arr
      .map((r) =>
        key === 'dailyIntake'
          ? (r.compoundOutputs?.[compound.id]?.dailyIntake ?? r.dailyIntake)
          : (r[key] as number),
      )
      .sort((a, b) => a - b);
    return {
      min: vals[0],
      median: quantileSorted(vals, 0.5),
      max: vals[vals.length - 1],
      p5: quantileSorted(vals, 0.05),
      p95: quantileSorted(vals, 0.95),
    };
  };

  const getBasicStats = (arr: IterationResult[], key: keyof IterationResult) => {
    const { min, median, max } = getStats(arr, key);
    return { min, median, max };
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
    detailedAnalysis,
  };
}

/**
 * Canonical multi-compound analysis. Both the summary panel and the exceedance
 * analyzer read these numbers, so a label means the same thing in both places.
 * Limits use the sampled exposure window and are averaged over the same
 * iterations as the exposures they are compared with.
 */
export function calculateCompoundSummaries(
  results: IterationResult[],
  _parameters: SimulationParameters,
): CompoundSummary[] {
  if (!results || results.length === 0) return [];

  return PFAS_COMPOUNDS.map((compound) => {
    const totalCount = results.length;
    const cssVals: number[] = new Array(totalCount);
    const bbVals: number[] = new Array(totalCount);
    const hqVals: number[] = new Array(totalCount);
    const criticalBbVals: number[] = new Array(totalCount);
    const criticalCssVals: number[] = new Array(totalCount);
    const criticalIntakeVals: number[] = new Array(totalCount);
    const exceedingCss: number[] = [];
    const exceedingBb: number[] = [];
    const exceedingIntake: number[] = [];
    let exceedanceCount = 0;

    for (let i = 0; i < totalCount; i++) {
      const iteration = results[i];
      const sampledOut = iteration.compoundOutputs?.[compound.id];
      // Derive the half-life from the rate when only legacy fixtures are available.
      const eliminationRate = sampledOut?.eliminationRate ?? iteration.eliminationRate;
      const halfLifeYears = eliminationRate
        ? Math.LN2 / eliminationRate / 365.25
        : compound.halfLifeYears;
      const criticalBb =
        sampledOut?.criticalBodyBurden ??
        calculateCriticalBodyBurden(
          compound,
          iteration.bodyWeight,
          iteration.bioavailability,
          halfLifeYears,
          iteration.exposureDuration,
        );
      const criticalCss =
        sampledOut?.criticalSerumCss ??
        calculateCriticalSerumCss(
          compound,
          iteration.bodyWeight,
          iteration.bioavailability,
          halfLifeYears,
        );
      const criticalIntake =
        sampledOut?.criticalDailyIntake ?? calculateCriticalIntake(compound, iteration.bodyWeight);
      const css = sampledOut?.steadyStateConcentration ?? iteration.steadyStateConcentration;
      const bb = sampledOut?.peakBodyBurden ?? iteration.peakBodyBurden;
      const hq = sampledOut?.hazardQuotient ?? iteration.hazardQuotient;
      const isExceeded = sampledOut?.isExceeded ?? bb > criticalBb;

      cssVals[i] = css;
      bbVals[i] = bb;
      hqVals[i] = hq;
      criticalBbVals[i] = criticalBb;
      criticalCssVals[i] = criticalCss;
      criticalIntakeVals[i] = criticalIntake;

      if (isExceeded) {
        exceedanceCount++;
        exceedingCss.push(css);
        exceedingBb.push(bb);
        exceedingIntake.push(sampledOut?.dailyIntake ?? iteration.dailyIntake);
      }
    }

    const mean = (values: number[]) => values.reduce((acc, v) => acc + v, 0) / totalCount;
    const meanCss = mean(cssVals);
    const meanBodyBurden = mean(bbVals);
    const meanHazardQuotient = mean(hqVals);
    const criticalBodyBurden = mean(criticalBbVals);
    const criticalSerumCss = mean(criticalCssVals);
    const criticalDailyIntake = mean(criticalIntakeVals);
    const medianCss = quantileSorted(
      [...cssVals].sort((a, b) => a - b),
      0.5,
    );
    const p95Css = quantileSorted(
      [...cssVals].sort((a, b) => a - b),
      0.95,
    );
    const medianBodyBurden = quantileSorted(
      [...bbVals].sort((a, b) => a - b),
      0.5,
    );
    const p95BodyBurden = quantileSorted(
      [...bbVals].sort((a, b) => a - b),
      0.95,
    );
    const medianHazardQuotient = quantileSorted(
      [...hqVals].sort((a, b) => a - b),
      0.5,
    );
    const riskExceedancePercent = (exceedanceCount / totalCount) * 100;
    const wilcoxonTest = calculateOneSampleWilcoxon(hqVals, 1.0);

    const range = (values: number[]) =>
      values.length > 0
        ? { min: Math.min(...values), max: Math.max(...values) }
        : { min: 0, max: 0 };
    const intakeRange = range(exceedingIntake);
    const serumRange = range(exceedingCss);
    const burdenRange = range(exceedingBb);

    const isBurdenExceeded = meanBodyBurden > criticalBodyBurden || meanHazardQuotient > 1.0;
    const status: 'safe' | 'borderline' | 'exceeded' = isBurdenExceeded
      ? 'exceeded'
      : meanHazardQuotient >= 0.85
        ? 'borderline'
        : 'safe';

    return {
      compoundId: compound.id,
      compoundName: compound.name,
      chemicalFormula: compound.chemicalFormula,
      casNumber: compound.casNumber,
      halfLifeYears: compound.halfLifeYears,
      volumeOfDistribution: compound.volumeOfDistribution,
      epaMCL: compound.epaMCL,
      rfdDose: compound.rfdDose,
      meanCss: parseFloat(meanCss.toFixed(4)),
      medianCss: parseFloat(medianCss.toFixed(4)),
      p95Css: parseFloat(p95Css.toFixed(4)),
      meanBodyBurden: parseFloat(meanBodyBurden.toFixed(3)),
      medianBodyBurden: parseFloat(medianBodyBurden.toFixed(3)),
      p95BodyBurden: parseFloat(p95BodyBurden.toFixed(3)),
      criticalBodyBurden: parseFloat(criticalBodyBurden.toFixed(3)),
      criticalSerumCss: parseFloat(criticalSerumCss.toFixed(4)),
      criticalDailyIntake: parseFloat(criticalDailyIntake.toFixed(5)),
      exceedingIntakeMin: parseFloat(intakeRange.min.toFixed(4)),
      exceedingIntakeMax: parseFloat(intakeRange.max.toFixed(4)),
      exceedingSerumMin: parseFloat(serumRange.min.toFixed(4)),
      exceedingSerumMax: parseFloat(serumRange.max.toFixed(4)),
      exceedingBodyBurdenMin: parseFloat(burdenRange.min.toFixed(3)),
      exceedingBodyBurdenMax: parseFloat(burdenRange.max.toFixed(3)),
      meanHazardQuotient: parseFloat(meanHazardQuotient.toFixed(2)),
      medianHazardQuotient: parseFloat(medianHazardQuotient.toFixed(2)),
      totalCount,
      exceedanceCount,
      riskExceedancePercent: parseFloat(riskExceedancePercent.toFixed(1)),
      wilcoxonTest,
      isBurdenExceeded,
      status,
    };
  });
}
