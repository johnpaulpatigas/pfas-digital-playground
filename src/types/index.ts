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
export type SamplingMethod = 'monte-carlo' | 'latin-hypercube';

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
  mcRuntimeMs: number;
  lhsRuntimeMs: number;
  mcConvergence: Array<{ iteration: number; runningMean: number }>;
  lhsConvergence: Array<{ iteration: number; runningMean: number }>;
}

// Preset Scenario Profile
export interface DemographicScenario {
  id: string;
  name: string;
  description: string;
  targetGroup: string;
  parameters: SimulationParameters;
}
