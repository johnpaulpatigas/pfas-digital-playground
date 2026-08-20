/**
 * PFAS Toxicokinetic Modeling Domain Types (Research Grade)
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
  dailyIntake: ExposureParameterConfig;        // ug/day
  bodyWeight: ExposureParameterConfig;         // kg
  age: ExposureParameterConfig;                // years
  waterConsumption: ExposureParameterConfig;   // L/day
  bioavailability: ExposureParameterConfig;    // fraction (0 - 1)
  eliminationHalfLife: ExposureParameterConfig; // years
  exposureDuration: ExposureParameterConfig;   // years
}

// Sampling Configuration
export type SamplingMethod = 'monte-carlo' | 'latin-hypercube' | 'monte-carlo-lhs';

export interface SamplingConfig {
  method: SamplingMethod;
  iterations: number;
  seed?: number;
  compoundId: string; // e.g. 'pfoa', 'pfos', 'pfhxs', 'pfna', 'genx'
}

// Single Sample Iteration Output
export interface IterationResult {
  iteration: number;
  dailyIntake: number;
  bodyWeight: number;
  age: number;
  waterConsumption: number;
  bioavailability: number;
  eliminationHalfLife: number;
  exposureDuration: number;
  
  // Calculated Toxicokinetic Outputs
  eliminationRate: number;          // day^-1
  steadyStateConcentration: number; // ug/L (ng/mL) in blood serum
  peakBodyBurden: number;           // ug
  clearanceRate: number;            // L/kg/day
  hazardQuotient: number;           // HQ = Dose / RfD
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
  riskExceedancePercent: number; // Percentage of population exceeding HQ > 1.0
}

// Parameter Sensitivity Ranking
export interface SensitivityRank {
  parameterId: string;
  parameterName: string;
  correlationCoefficient: number; // Spearman rank rho
  rank: number;
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
  criticalDailyIntake: number;        // ug/day (intake where HQ = 1.0 for given body weight)
  criticalDailyDosePerKg: number;     // ug/kg/day (= compound RfD)
  criticalSerumConcentration: number; // ug/L (Css where HQ = 1.0)
  criticalBodyBurden: number;         // ug (Steady-state peak body burden where HQ = 1.0)
  criticalWaterConsumption: number;   // L/day (Water consumption to reach RfD at EPA MCL)
  criticalBioavailability: number;    // fraction (0 - 1)
  criticalHalfLife: number;           // years
  criticalExposureDurationMin: number; // 25 years (chronic steady-state plateau)
  criticalExposureDurationMax: number; // 30 years (chronic steady-state plateau)
  epaMCLConcentration: number;        // ug/L (MCL in ug/L)
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
  baselineBodyBurden: number;            // ug (at current duration)
  steadyStateBodyBurden: number;         // ug (at steady-state)
  criticalBodyBurden: number;            // ug (critical threshold body burden at current duration)
  criticalSteadyStateBodyBurden: number; // ug (critical threshold body burden at steady-state)
  currentSerumCss: number;               // ug/L
  criticalSerumCss: number;              // ug/L
  hazardQuotient: number;                // HQ = Dose / RfD
  burdenExceedanceRatio: number;         // currentBodyBurden / criticalBodyBurden
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

