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
import { PFAS_COMPOUNDS, type PFASCompound } from './pfasCompounds';
import { calculateOneSampleWilcoxon, quantileSorted } from './statistics';

export interface ToxicokineticInput {
  dailyIntake: number; // µg/day
  bodyWeight: number; // kg
  age: number; // years
  waterConsumption: number; // L/day
  bioavailability: number; // fraction (0 to 1)
  eliminationHalfLife: number; // years
  exposureDuration: number; // years
  compoundId?: string;
}

/**
 * 1-Compartment Pharmacokinetic Model for PFAS (Research Grade)
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

  // Daily absorbed dose (µg/day)
  const absorbedDose = dailyIntake * bioavailability;

  // Cumulative exposure window (days)
  const exposureDays = exposureDuration * 365.25;

  // Daily intake per kg body mass (ug/kg/day)
  const dailyDosePerKg = dailyIntake / Math.max(10, bodyWeight);

  // Multi-compound evaluations for all 5 PFAS compounds and mixture Hazard Index (HI).
  // The active compound uses the sampled half-life; the others use their reference value.
  const compoundOutputs: Record<string, CompoundIterationOutput> = {};
  let hazardIndex = 0;
  for (let i = 0; i < PFAS_COMPOUNDS.length; i++) {
    const c = PFAS_COMPOUNDS[i];
    const cHalfLife = compoundId === c.id ? eliminationHalfLife : c.halfLifeYears;
    const cEliminationRate = Math.LN2 / Math.max(1, cHalfLife * 365.25);
    const cVdTotal = Math.max(1, bodyWeight * c.volumeOfDistribution);
    const cCss = absorbedDose / (cVdTotal * cEliminationRate);
    const cBodyBurden =
      (absorbedDose / cEliminationRate) * (1 - Math.exp(-cEliminationRate * exposureDays));
    const cClearance = cEliminationRate * c.volumeOfDistribution;
    const cHQ = c.rfdDose > 0 ? dailyDosePerKg / c.rfdDose : 0;
    hazardIndex += cHQ;

    compoundOutputs[c.id] = {
      compoundId: c.id,
      eliminationRate: cEliminationRate,
      steadyStateConcentration: Math.max(0, cCss),
      peakBodyBurden: Math.max(0, cBodyBurden),
      clearanceRate: cClearance,
      hazardQuotient: Math.max(0, cHQ),
    };
  }

  // The active compound's output is already part of the multi-compound evaluation.
  const activeOutput = compoundOutputs[compound.id];

  return {
    iteration: iterationIndex,
    dailyIntake,
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
  const criticalSerumConcentration =
    criticalAbsorbedDose / (volumeOfDistributionTotal * eliminationRate);

  // Critical steady-state body burden (ug)
  const criticalBodyBurden = criticalAbsorbedDose / eliminationRate;

  // US EPA Maximum Contaminant Level converted to ug/L (ng/L / 1000)
  const epaMCLConcentration = compound.epaMCL / 1000;

  // Critical drinking water consumption volume (L/day) to reach RfD when water is at EPA MCL
  const criticalWaterConsumption =
    epaMCLConcentration > 0 ? criticalDailyIntake / epaMCLConcentration : 2.0;

  return {
    criticalDailyIntake,
    criticalDailyDosePerKg: compound.rfdDose,
    criticalSerumConcentration,
    criticalBodyBurden,
    criticalWaterConsumption,
    criticalBioavailability: Math.min(
      1.0,
      (bodyWeight * compound.rfdDose) / Math.max(0.00001, criticalDailyIntake),
    ),
    criticalHalfLife: halfLife,
    criticalExposureDurationMin: 25,
    criticalExposureDurationMax: 30,
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
  const intakeStats = extractDistributionCentralValue(parameters.dailyIntake.distribution);
  const waterStats = extractDistributionCentralValue(parameters.waterConsumption.distribution);
  const bioStats = extractDistributionCentralValue(parameters.bioavailability.distribution);
  const halfLifeStats = extractDistributionCentralValue(
    parameters.eliminationHalfLife.distribution,
  );
  const durationStats = extractDistributionCentralValue(parameters.exposureDuration.distribution);

  const meanBW = bwStats.mean;
  const meanIntake = intakeStats.mean;
  const meanWater = waterStats.mean;
  const meanBio = Math.min(1.0, Math.max(0.01, bioStats.mean));
  const meanHalfLife = Math.max(0.01, halfLifeStats.mean);
  const meanDuration = Math.max(0.1, durationStats.mean);

  const halfLifeDays = meanHalfLife * 365.25;
  const eliminationRate = Math.LN2 / Math.max(1, halfLifeDays);
  const exposureDays = meanDuration * 365.25;

  const thresholds = calculateCriticalThresholds(compound, meanBW, meanBio, meanHalfLife);

  // Toxicokinetic body burden calculations
  const currentAbsorbedDose = meanIntake * meanBio;
  const criticalAbsorbedDose = thresholds.criticalDailyIntake * meanBio;

  const steadyStateFraction = 1 - Math.exp(-eliminationRate * exposureDays);
  const steadyStateFractionPercent = steadyStateFraction * 100;

  // Dynamic body burden at current exposure duration
  const currentBodyBurden = (currentAbsorbedDose / eliminationRate) * steadyStateFraction;
  const steadyStateBodyBurden = currentAbsorbedDose / eliminationRate;

  // Critical body burden at current exposure duration & steady state
  const criticalBodyBurden = (criticalAbsorbedDose / eliminationRate) * steadyStateFraction;
  const criticalSteadyStateBodyBurden = thresholds.criticalBodyBurden;

  // Serum Css
  const volumeOfDistributionTotal = Math.max(1, meanBW * compound.volumeOfDistribution);
  const currentSerumCss = currentAbsorbedDose / (volumeOfDistributionTotal * eliminationRate);
  const criticalSerumCss = thresholds.criticalSerumConcentration;

  // Hazard Quotient
  const dailyDosePerKg = meanIntake / Math.max(1, meanBW);
  const hazardQuotient = compound.rfdDose > 0 ? dailyDosePerKg / compound.rfdDose : 0;

  const burdenExceedanceRatio =
    criticalBodyBurden > 0 ? currentBodyBurden / criticalBodyBurden : hazardQuotient;
  const isBurdenExceeded = currentBodyBurden > criticalBodyBurden || hazardQuotient > 1.0;

  // Time to reach critical body burden threshold (years)
  let timeToExceedanceYears: number | null = null;
  if (steadyStateBodyBurden > criticalBodyBurden && currentAbsorbedDose > criticalAbsorbedDose) {
    const fraction = (criticalBodyBurden * eliminationRate) / currentAbsorbedDose;
    if (fraction < 1 && fraction > 0) {
      const days = -Math.log(1 - fraction) / eliminationRate;
      timeToExceedanceYears = parseFloat((days / 365.25).toFixed(2));
    }
  }

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
  const epaMCLugL = compound.epaMCL / 1000;
  const criticalWaterVal = epaMCLugL > 0 ? criticalIntakeVal / epaMCLugL : 2.0;
  const waterExceeded = meanWater > criticalWaterVal;
  const waterStatus: 'safe' | 'borderline' | 'exceeded' =
    meanWater > criticalWaterVal * 1.05
      ? 'exceeded'
      : meanWater >= criticalWaterVal * 0.9
        ? 'borderline'
        : 'safe';

  // --- Parameter 4: Gastrointestinal Bioavailability ---
  const criticalBioVal = Math.min(
    1.0,
    meanIntake > 0 ? (meanBW * compound.rfdDose) / meanIntake : 1.0,
  );
  const bioExceeded = meanBio >= criticalBioVal;
  const bioStatus: 'safe' | 'borderline' | 'exceeded' =
    meanBio >= criticalBioVal * 1.02
      ? 'exceeded'
      : meanBio >= criticalBioVal * 0.92
        ? 'borderline'
        : 'safe';

  // --- Parameter 5: Elimination Half-Life ---
  const criticalHalfLifeVal =
    meanIntake > 0
      ? ((meanBW * compound.rfdDose) / meanIntake) * compound.halfLifeYears
      : compound.halfLifeYears;
  const halfLifeExceeded = meanHalfLife > criticalHalfLifeVal;
  const halfLifeStatus: 'safe' | 'borderline' | 'exceeded' =
    meanHalfLife > criticalHalfLifeVal * 1.05
      ? 'exceeded'
      : meanHalfLife >= criticalHalfLifeVal * 0.9
        ? 'borderline'
        : 'safe';

  // --- Parameter 6: Exposure Duration ---
  // 25-30 years represents chronic steady-state equilibrium plateau (>99% accumulation)
  const isDurationInChronicRange = meanDuration >= 25;
  const durationExceeded =
    (isBurdenExceeded && isDurationInChronicRange) ||
    (timeToExceedanceYears !== null && meanDuration >= timeToExceedanceYears);
  const durationStatus: 'safe' | 'borderline' | 'exceeded' = durationExceeded
    ? 'exceeded'
    : meanDuration >= 20
      ? 'borderline'
      : 'safe';

  const parameterThresholds: ParameterCriticalThreshold[] = [
    {
      id: 'dailyIntake',
      name: 'Estimated PFAS Intake',
      unit: 'µg/day',
      criticalValue: criticalIntakeVal,
      criticalRangeDisplay:
        criticalIntakeVal < 0.001
          ? `> ${(criticalIntakeVal * 1000).toFixed(3)} ng/d`
          : `> ${criticalIntakeVal.toFixed(4)} µg/d`,
      currentValue: meanIntake,
      currentRangeDisplay: intakeStats.displayRange,
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
      criticalRangeDisplay: `≥ ${(criticalBioVal * 100).toFixed(1)}%`,
      currentValue: meanBio,
      currentRangeDisplay: `${(meanBio * 100).toFixed(0)}%`,
      isExceeded: bioExceeded,
      status: bioStatus,
      direction: 'greater_than',
      explanation:
        'Fraction of GI absorption required for systemic absorbed dose to breach the toxicological reference threshold.',
      formula: 'f_{\\text{abs, crit}} = \\min\\left(1.0, \\frac{BW \\times \\text{RfD}}{I}\\right)',
    },
    {
      id: 'eliminationHalfLife',
      name: 'Elimination Half-Life',
      unit: 'years',
      criticalValue: criticalHalfLifeVal,
      criticalRangeDisplay: `> ${criticalHalfLifeVal.toFixed(2)} yrs`,
      currentValue: meanHalfLife,
      currentRangeDisplay: halfLifeStats.displayRange,
      isExceeded: halfLifeExceeded,
      status: halfLifeStatus,
      direction: 'greater_than',
      explanation:
        'Serum elimination half-life threshold above which slower clearance retains chemical mass, elevating equilibrium body burden above safe limits.',
      formula: 'T_{1/2, \\text{crit}} = \\frac{BW \\times \\text{RfD}}{I} \\times T_{1/2}',
    },
    {
      id: 'exposureDuration',
      name: 'Exposure Duration',
      unit: 'years',
      criticalValue: timeToExceedanceYears !== null ? timeToExceedanceYears : 25,
      criticalRangeDisplay:
        timeToExceedanceYears !== null
          ? `≥ ${timeToExceedanceYears.toFixed(1)} yrs (25 to 30 yr Chronic Range)`
          : '25 to 30 years (Equilibrium Plateau)',
      currentValue: meanDuration,
      currentRangeDisplay: durationStats.displayRange,
      isExceeded: durationExceeded,
      status: durationStatus,
      direction: 'range',
      explanation:
        'Chronic exposure duration (25 to 30 years) achieving 99%+ of steady-state equilibrium capacity for PFOA/PFNA (5 to 8 biological half-lives), and 87% to 91% for longer-lived PFHxS.',
      formula:
        't_{\\text{crit}} = -\\frac{T_{1/2}}{\\ln(2)} \\ln\\left(1 - \\frac{BW \\times \\text{RfD}}{I}\\right)',
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
 * Multi-Compound Summary Calculator
 * Computes average Css, average Body Burden, critical boundaries, and exceedance ranges across all 5 PFAS compounds.
 */
export function calculateCompoundSummaries(
  results: IterationResult[],
  parameters: SimulationParameters,
): CompoundSummary[] {
  if (!results || results.length === 0) return [];

  const bwStats = extractDistributionCentralValue(parameters.bodyWeight.distribution);
  const bioStats = extractDistributionCentralValue(parameters.bioavailability.distribution);
  const meanBW = bwStats.mean;
  const meanBio = Math.min(1.0, Math.max(0.01, bioStats.mean));

  return PFAS_COMPOUNDS.map((compound) => {
    const totalCount = results.length;
    const cssVals: number[] = new Array(totalCount);
    const bbVals: number[] = new Array(totalCount);
    const hqVals: number[] = new Array(totalCount);
    const exceedingCss: number[] = [];
    const exceedingBb: number[] = [];

    for (let i = 0; i < totalCount; i++) {
      const out = results[i].compoundOutputs?.[compound.id] || {
        steadyStateConcentration: results[i].steadyStateConcentration,
        peakBodyBurden: results[i].peakBodyBurden,
        hazardQuotient: results[i].hazardQuotient,
      };
      cssVals[i] = out.steadyStateConcentration;
      bbVals[i] = out.peakBodyBurden;
      hqVals[i] = out.hazardQuotient;

      if (out.hazardQuotient > 1.0) {
        exceedingCss.push(out.steadyStateConcentration);
        exceedingBb.push(out.peakBodyBurden);
      }
    }

    cssVals.sort((a, b) => a - b);
    bbVals.sort((a, b) => a - b);

    const sumCss = cssVals.reduce((acc, v) => acc + v, 0);
    const meanCss = sumCss / totalCount;
    const medianCss = quantileSorted(cssVals, 0.5);
    const p95Css = quantileSorted(cssVals, 0.95);

    const sumBb = bbVals.reduce((acc, v) => acc + v, 0);
    const meanBodyBurden = sumBb / totalCount;
    const medianBodyBurden = quantileSorted(bbVals, 0.5);
    const p95BodyBurden = quantileSorted(bbVals, 0.95);

    const sumHq = hqVals.reduce((acc, v) => acc + v, 0);
    const meanHazardQuotient = sumHq / totalCount;
    const sortedHq = [...hqVals].sort((a, b) => a - b);
    const medianHazardQuotient = quantileSorted(sortedHq, 0.5);
    const riskExceedancePercent = (exceedingCss.length / totalCount) * 100;
    const wilcoxonTest = calculateOneSampleWilcoxon(hqVals, 1.0);

    const thresholds = calculateCriticalThresholds(
      compound,
      meanBW,
      meanBio,
      compound.halfLifeYears,
    );

    let exceedingSerumMin = 0;
    let exceedingSerumMax = 0;
    if (exceedingCss.length > 0) {
      exceedingCss.sort((a, b) => a - b);
      exceedingSerumMin = exceedingCss[0];
      exceedingSerumMax = exceedingCss[exceedingCss.length - 1];
    }

    let exceedingBodyBurdenMin = 0;
    let exceedingBodyBurdenMax = 0;
    if (exceedingBb.length > 0) {
      exceedingBb.sort((a, b) => a - b);
      exceedingBodyBurdenMin = exceedingBb[0];
      exceedingBodyBurdenMax = exceedingBb[exceedingBb.length - 1];
    }

    const isBurdenExceeded =
      meanBodyBurden > thresholds.criticalBodyBurden || meanHazardQuotient > 1.0;
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
      criticalBodyBurden: parseFloat(thresholds.criticalBodyBurden.toFixed(3)),
      criticalSerumCss: parseFloat(thresholds.criticalSerumConcentration.toFixed(4)),
      criticalDailyIntake: thresholds.criticalDailyIntake,
      exceedingSerumMin: parseFloat(exceedingSerumMin.toFixed(4)),
      exceedingSerumMax: parseFloat(exceedingSerumMax.toFixed(4)),
      exceedingBodyBurdenMin: parseFloat(exceedingBodyBurdenMin.toFixed(3)),
      exceedingBodyBurdenMax: parseFloat(exceedingBodyBurdenMax.toFixed(3)),
      meanHazardQuotient: parseFloat(meanHazardQuotient.toFixed(2)),
      medianHazardQuotient: parseFloat(medianHazardQuotient.toFixed(2)),
      riskExceedancePercent: parseFloat(riskExceedancePercent.toFixed(1)),
      wilcoxonTest,
      isBurdenExceeded,
      status,
    };
  });
}
