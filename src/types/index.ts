/**
 * Domain types for PFAS toxicokinetic modeling.
 */

// Supported Probability Distributions
export type DistributionType = 'fixed' | 'uniform' | 'normal' | 'lognormal' | 'triangular';

export interface BaseDistributionParams {
  type: DistributionType;
}

export interface FixedDistributionParams extends BaseDistributionParams {
  type: 'fixed';
  value: number;
}

export interface UniformDistributionParams extends BaseDistributionParams {
  type: 'uniform';
  min: number;
  max: number;
}

export interface NormalDistributionParams extends BaseDistributionParams {
  type: 'normal';
  mean: number;
  sd: number;
}

export interface LognormalDistributionParams extends BaseDistributionParams {
  type: 'lognormal';
  mean: number;
  sd: number;
}

export interface TriangularDistributionParams extends BaseDistributionParams {
  type: 'triangular';
  min: number;
  mode: number;
  max: number;
}

export type DistributionParams =
  | FixedDistributionParams
  | UniformDistributionParams
  | NormalDistributionParams
  | LognormalDistributionParams
  | TriangularDistributionParams;

// Parameter Config Schema
export interface ExposureParameterConfig {
  id: string;
  name: string;
  unit: string;
  description: string;
  scientificContext: string;
  distribution: DistributionParams;
}

// Complete Input Parameters Set
export interface SimulationParameters {
  dailyIntakePfoa?: ExposureParameterConfig; // µg/day, separate PFOA intake distribution
  dailyIntakePfos?: ExposureParameterConfig;
  dailyIntakePfhxs?: ExposureParameterConfig;
  dailyIntakePfna?: ExposureParameterConfig;
  dailyIntakeGenx?: ExposureParameterConfig;
  waterConcentrationPfoa?: ExposureParameterConfig; // ng/L, compound-specific
  waterConcentrationPfos?: ExposureParameterConfig;
  waterConcentrationPfhxs?: ExposureParameterConfig;
  waterConcentrationPfna?: ExposureParameterConfig;
  waterConcentrationGenx?: ExposureParameterConfig;
  /** Legacy compatibility field; current presets and sampling use the five compound-specific inputs. */
  dailyIntake: ExposureParameterConfig;
  bodyWeight: ExposureParameterConfig; // kg
  age: ExposureParameterConfig; // years
  waterConsumption: ExposureParameterConfig; // L/day
  bioavailability: ExposureParameterConfig; // fraction (0 - 1)
  eliminationHalfLife: ExposureParameterConfig; // years
  exposureDuration: ExposureParameterConfig; // years
}

// Sampling Configuration
export type SamplingMethod = 'monte-carlo' | 'latin-hypercube' | 'monte-carlo-lhs';

export interface SamplingConfig {
  method: SamplingMethod;
  iterations: number;
  seed?: number;
  compoundId: string; // e.g. 'pfoa', 'pfos', 'pfhxs', 'pfna', 'genx'
}

// Single Compound Output within an Iteration
export interface CompoundIterationOutput {
  compoundId: string;
  dietaryIntake: number; // non-water intake, µg/day
  waterConcentration: number; // ng/L
  waterIntake: number; // water-derived intake, µg/day
  dailyIntake: number; // total compound intake, dietary + water, µg/day
  eliminationRate: number; // day^-1
  steadyStateConcentration: number; // ug/L (ng/mL) in blood serum
  peakBodyBurden: number; // ug
  clearanceRate: number; // L/kg/day
  hazardQuotient: number; // HQ = Dose / RfD
  criticalBodyBurden: number; // burden at HQ = 1 for this iteration (ug)
  criticalSerumCss: number; // steady-state serum at HQ = 1 for this iteration (ug/L)
  criticalDailyIntake: number; // intake at HQ = 1 for this iteration (ug/day)
  isExceeded: boolean; // peakBodyBurden > criticalBodyBurden, equivalent to HQ > 1.0
}

// Single Sample Iteration Output
export interface IterationResult {
  iteration: number;
  dailyIntake: number; // total active-compound intake, dietary + water, µg/day
  dietaryIntake?: number;
  waterIntake?: number;
  bodyWeight: number;
  age: number;
  waterConsumption: number;
  bioavailability: number;
  eliminationHalfLife: number;
  exposureDuration: number;

  // Calculated Toxicokinetic Outputs (Primary / Active Compound)
  eliminationRate: number; // day^-1
  steadyStateConcentration: number; // ug/L (ng/mL) in blood serum
  peakBodyBurden: number; // ug
  clearanceRate: number; // L/kg/day
  hazardQuotient: number; // HQ = Dose / RfD
  hazardIndex?: number; // Exploratory sum of modeled compound HQs; not EPA NPDWR mixture HI
  criticalBodyBurden?: number; // active-compound limit at HQ = 1 (ug)
  isExceeded?: boolean; // active-compound exceedance (HQ > 1.0)

  // Multi-Compound Results (PFOA, PFOS, PFHxS, PFNA, GenX)
  compoundOutputs?: Record<string, CompoundIterationOutput>;
}

// Multi-Compound Summary Metrics for Cross-Comparison
export interface CompoundSummary {
  compoundId: string;
  compoundName: string;
  chemicalFormula: string;
  casNumber: string;
  halfLifeYears: number;
  volumeOfDistribution: number;
  epaMCL: number;
  rfdDose: number;

  // Mean & Central Metrics
  meanCss: number; // Average Css (ug/L)
  medianCss: number; // Median Css (ug/L)
  p95Css: number; // 95th Percentile Css (ug/L)
  meanBodyBurden: number; // Average Peak Body Burden (ug)
  medianBodyBurden: number; // Median Body Burden (ug)
  p95BodyBurden: number; // 95th Percentile Body Burden (ug)

  // Critical Limits & Exceedances (cohort-mean limits)
  criticalBodyBurden: number; // Mean critical burden (ug)
  criticalSerumCss: number; // Mean critical steady-state Css (ug/L)
  criticalDailyIntake: number; // Mean critical daily intake (ug/day)
  exceedingIntakeMin: number; // Min intake in exceeding cohort (ug/day)
  exceedingIntakeMax: number; // Max intake in exceeding cohort (ug/day)
  exceedingSerumMin: number; // Min Css in exceeding cohort (ug/L)
  exceedingSerumMax: number; // Max Css in exceeding cohort (ug/L)
  exceedingBodyBurdenMin: number; // Min Body Burden in exceeding cohort (ug)
  exceedingBodyBurdenMax: number; // Max Body Burden in exceeding cohort (ug)

  // Risk Metrics
  meanHazardQuotient: number; // Mean HQ
  medianHazardQuotient: number; // Median HQ (needed for H0 4)
  totalCount: number; // number of simulated iterations
  exceedanceCount: number; // iterations with HQ > 1.0 for this compound
  riskExceedancePercent: number; // % of cohort exceeding HQ > 1.0
  wilcoxonTest?: WilcoxonOneSampleResult; // Formal H0 4 test result against threshold 1.0
  isBurdenExceeded: boolean;
  status: 'safe' | 'borderline' | 'exceeded';
}

// Time-Course Dynamic Bioaccumulation Curve Point
export interface TimeCoursePoint {
  year: number;
  meanConcentration: number;
  p5Concentration: number;
  p95Concentration: number;
}

// Statistical Summary Metrics
export interface SummaryStatistics {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  p5: number;
  p25: number;
  p75: number;
  p95: number;
  p99: number;
  ci95Lower: number;
  ci95Upper: number;
  meanHazardQuotient: number;
  medianHazardQuotient?: number;
  riskExceedancePercent: number; // Percentage of population exceeding HQ > 1.0
  meanHazardIndex?: number; // Mean exploratory sum of modeled compound HQs
  medianHazardIndex?: number;
  mixtureExceedancePercent?: number; // Percentage of population exceeding HI > 1.0
  wilcoxonHQ?: WilcoxonOneSampleResult;
  wilcoxonHI?: WilcoxonOneSampleResult;
}

// Non-Parametric Mann-Whitney U Cohort Comparison Result
export interface MannWhitneyUResult {
  uStat: number;
  u1: number;
  u2: number;
  zScore: number;
  pValue: number;
  rankBiserialCorrelation: number; // Effect size: 1 - 2U / (n1 * n2)
  isSignificant: boolean; // p < 0.05
}

// Partial Rank Correlation Coefficient (PRCC) Result
export interface PRCCResult {
  parameterId: string;
  parameterName: string;
  prcc: number;
  tStatistic: number;
  pValue: number;
  isSignificant: boolean; // |PRCC| >= 0.10 && p < 0.05
  rank: number;
}

// One-Sample Wilcoxon Signed-Rank Test Result (against threshold 1.0)
export interface WilcoxonOneSampleResult {
  medianValue: number;
  wStat: number;
  zScore: number;
  pValue: number;
  exceedancePercent: number;
  isSignificantRisk: boolean; // p < 0.05 && medianValue > 1.0
}

// Parameter Sensitivity Ranking
export interface SensitivityRank {
  parameterId: string;
  parameterName: string;
  correlationCoefficient: number; // Spearman rank rho
  rank: number;
  prcc?: number; // Partial Rank Correlation Coefficient
  tStatistic?: number;
  pValue?: number;
  isSignificant?: boolean;
}

// Head to Head Comparison Result
export interface ComparisonResult {
  mcStats: SummaryStatistics;
  lhsStats: SummaryStatistics;
  mcLhsStats?: SummaryStatistics;
  mcRuntimeMs: number;
  lhsRuntimeMs: number;
  mcLhsRuntimeMs?: number;
  mcConvergence: Array<{ iteration: number; runningMean: number }>;
  lhsConvergence: Array<{ iteration: number; runningMean: number }>;
  mcLhsConvergence?: Array<{ iteration: number; runningMean: number }>;
}

// Analytical Critical Exceedance Thresholds
export interface CriticalThresholds {
  criticalDailyIntake: number; // ug/day (intake where HQ = 1.0 for given body weight)
  criticalDailyDosePerKg: number; // ug/kg/day (= compound RfD)
  criticalSerumConcentration: number; // ug/L (Css where HQ = 1.0)
  criticalBodyBurden: number; // ug (Steady-state peak body burden where HQ = 1.0)
  criticalWaterConsumption: number; // L/day (Water consumption to reach RfD at EPA MCL)
  criticalBioavailability: number; // fraction (0 - 1)
  criticalHalfLife: number; // years
  criticalExposureDurationMin: number; // 25 years (chronic steady-state plateau)
  criticalExposureDurationMax: number; // 30 years (chronic steady-state plateau)
  epaMCLConcentration: number; // ug/L (MCL in ug/L)
}

// Parameter-Level Critical Threshold Breakdown
export interface ParameterCriticalThreshold {
  id: keyof SimulationParameters;
  name: string;
  unit: string;
  criticalValue: number;
  criticalRangeDisplay: string;
  currentValue: number;
  currentRangeDisplay: string;
  isExceeded: boolean;
  status: 'safe' | 'borderline' | 'exceeded';
  direction: 'greater_than' | 'less_than' | 'range';
  explanation: string;
  formula: string;
}

// Detailed Critical Analysis across all 6 key parameters
export interface DetailedCriticalAnalysis {
  thresholds: CriticalThresholds;
  parameterThresholds: ParameterCriticalThreshold[];
  baselineBodyBurden: number; // ug (at current duration)
  steadyStateBodyBurden: number; // ug (at steady-state)
  criticalBodyBurden: number; // ug (critical threshold body burden at current duration)
  criticalSteadyStateBodyBurden: number; // ug (critical threshold body burden at steady-state)
  currentSerumCss: number; // ug/L
  criticalSerumCss: number; // ug/L
  hazardQuotient: number; // HQ = Dose / RfD
  burdenExceedanceRatio: number; // currentBodyBurden / criticalBodyBurden
  isBurdenExceeded: boolean;
  steadyStateFractionAtExposureDuration: number; // % (e.g. 99.2% for 25-30 years)
  timeToExceedanceYears: number | null; // years required to cross critical threshold
  overallStatus: 'safe' | 'borderline' | 'exceeded';
}

// Empirical Cohort Exceedance Range Breakdown
export interface ExceedanceRangeStats {
  totalCount: number;
  exceedanceCount: number;
  exceedancePercent: number;
  safeCount: number;
  safePercent: number;

  // Exceedance Cohort (HQ > 1.0) Ranges
  exceedingDailyIntake: { min: number; median: number; max: number; p5: number; p95: number };
  exceedingSerumCss: { min: number; median: number; max: number; p5: number; p95: number };
  exceedingPeakBodyBurden: { min: number; median: number; max: number; p5: number; p95: number };
  exceedingBodyWeight: { min: number; median: number; max: number };
  exceedingHalfLife: { min: number; median: number; max: number };

  // Safe Cohort (HQ <= 1.0) Ranges
  safeDailyIntake: { min: number; median: number; max: number };
  safeSerumCss: { min: number; median: number; max: number };
  safePeakBodyBurden: { min: number; median: number; max: number };
  safeBodyWeight: { min: number; median: number; max: number };
  safeHalfLife: { min: number; median: number; max: number };

  // Instant Analytical Thresholds
  thresholds: CriticalThresholds;
  detailedAnalysis?: DetailedCriticalAnalysis;
}

// Preset Scenario Profile
export interface DemographicScenario {
  id: string;
  name: string;
  description: string;
  targetGroup: string;
  parameters: SimulationParameters;
}
