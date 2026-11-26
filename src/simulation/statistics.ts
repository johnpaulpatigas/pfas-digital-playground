import type {
  IterationResult,
  MannWhitneyUResult,
  PRCCResult,
  SensitivityRank,
  SimulationParameters,
  SummaryStatistics,
  WilcoxonOneSampleResult,
} from '../types';
import {
  DAILY_INTAKE_PARAMETER_KEYS,
  getSimulationParameter,
  PARAMETER_KEYS,
  WATER_CONCENTRATION_PARAMETER_KEYS,
} from './parameters';

const getSampledParameterValue = (
  result: IterationResult,
  key: keyof SimulationParameters,
): number => {
  const intakeCompoundId = Object.entries(DAILY_INTAKE_PARAMETER_KEYS).find(
    ([, intakeKey]) => intakeKey === key,
  )?.[0];
  if (intakeCompoundId) {
    return (
      result.compoundOutputs?.[intakeCompoundId]?.dietaryIntake ??
      result.dietaryIntake ??
      result.dailyIntake
    );
  }
  const waterCompoundId = Object.entries(WATER_CONCENTRATION_PARAMETER_KEYS).find(
    ([, concentrationKey]) => concentrationKey === key,
  )?.[0];
  if (waterCompoundId) {
    return result.compoundOutputs?.[waterCompoundId]?.waterConcentration ?? 0;
  }
  return result[key as keyof IterationResult] as number;
};

export function quantileSorted(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return 0;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedValues[base + 1] !== undefined) {
    return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
  }
  return sortedValues[base];
}

export interface ConvergencePoint {
  iteration: number;
  runningMean: number;
}

/**
 * Build a downsampled running-mean convergence series for a set of iterations.
 * The final iteration is always included so the series ends at the full sample mean.
 */
export function calculateConvergenceSeries(
  results: IterationResult[],
  maxPoints: number = 100,
): ConvergencePoint[] {
  const total = results.length;
  if (total === 0) return [];

  const step = Math.max(1, Math.floor(total / maxPoints));
  const points: ConvergencePoint[] = [];
  let runningSum = 0;

  for (let i = 0; i < total; i++) {
    runningSum += results[i].steadyStateConcentration;
    if (i % step === 0 || i === total - 1) {
      points.push({
        iteration: i + 1,
        runningMean: parseFloat((runningSum / (i + 1)).toFixed(4)),
      });
    }
  }

  return points;
}

/**
 * Standard Normal Cumulative Distribution Function Φ(z)
 * Uses Abramowitz and Stegun rational approximation 7.1.26 (accuracy ~1.5e-7)
 */
export function normalCdf(z: number): number {
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z) / Math.SQRT2;
  const p = 0.3275911;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const t = 1.0 / (1.0 + p * absZ);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ);
  return 0.5 * (1.0 + sign * erf);
}

/**
 * Student's t Cumulative Distribution Function approximation
 * For df >= 30, converges quickly to the standard normal distribution.
 */
export function studentsTCdf(t: number, df: number): number {
  if (df <= 0) return normalCdf(t);
  if (df >= 100) return normalCdf(t);
  // Wallace / Cornish-Fisher approximation for moderate df
  const z = (t * (1 - 1 / (4 * df))) / Math.sqrt(1 + (t * t) / (2 * df));
  return normalCdf(z);
}

/**
 * Assign ranks with fractional average for tied values
 */
export function getRanks(arr: number[]): number[] {
  const n = arr.length;
  if (n === 0) return [];
  const indexed = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const ranks = new Array<number>(n);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j < n - 1 && indexed[j + 1].v === indexed[i].v) {
      j++;
    }
    const avgRank = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      ranks[indexed[k].i] = avgRank;
    }
    i = j + 1;
  }
  return ranks;
}

export function calculateSummaryStatistics(
  results: IterationResult[],
  targetKey: keyof IterationResult = 'steadyStateConcentration',
): SummaryStatistics {
  const count = results.length;
  if (count === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      min: 0,
      max: 0,
      p5: 0,
      p25: 0,
      p75: 0,
      p95: 0,
      p99: 0,
      ci95Lower: 0,
      ci95Upper: 0,
      meanHazardQuotient: 0,
      medianHazardQuotient: 0,
      riskExceedancePercent: 0,
      meanHazardIndex: 0,
      medianHazardIndex: 0,
      mixtureExceedancePercent: 0,
    };
  }

  const values = results.map((r) => r[targetKey] as number);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / count;

  const sortedValues = [...values].sort((a, b) => a - b);
  const min = sortedValues[0];
  const max = sortedValues[count - 1];
  const median = quantileSorted(sortedValues, 0.5);
  const p5 = quantileSorted(sortedValues, 0.05);
  const p25 = quantileSorted(sortedValues, 0.25);
  const p75 = quantileSorted(sortedValues, 0.75);
  const p95 = quantileSorted(sortedValues, 0.95);
  const p99 = quantileSorted(sortedValues, 0.99);

  const varianceSum = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  const variance = count > 1 ? varianceSum / (count - 1) : 0;
  const stdDev = Math.sqrt(variance);

  const stdError = stdDev / Math.sqrt(count);
  const ci95Lower = Math.max(0, mean - 1.96 * stdError);
  const ci95Upper = mean + 1.96 * stdError;

  // Hazard Quotient & Health Risk Exceedance
  const hqValues = results.map((r) => r.hazardQuotient);
  const meanHazardQuotient = hqValues.reduce((acc, v) => acc + v, 0) / count;
  const sortedHq = [...hqValues].sort((a, b) => a - b);
  const medianHazardQuotient = quantileSorted(sortedHq, 0.5);
  const exceedanceCount = hqValues.filter((hq) => hq > 1.0).length;
  const riskExceedancePercent = (exceedanceCount / count) * 100;
  const wilcoxonHQ = calculateOneSampleWilcoxon(hqValues, 1.0);

  // Exploratory sum of HQs across modeled compounds (not the EPA NPDWR mixture HI).
  const hiValues = results.map((r) =>
    r.hazardIndex !== undefined ? r.hazardIndex : r.hazardQuotient,
  );
  const meanHazardIndex = hiValues.reduce((acc, v) => acc + v, 0) / count;
  const sortedHi = [...hiValues].sort((a, b) => a - b);
  const medianHazardIndex = quantileSorted(sortedHi, 0.5);
  const mixtureExceedanceCount = hiValues.filter((hi) => hi > 1.0).length;
  const mixtureExceedancePercent = (mixtureExceedanceCount / count) * 100;
  const wilcoxonHI = calculateOneSampleWilcoxon(hiValues, 1.0);

  return {
    count,
    mean,
    median,
    stdDev,
    variance,
    min,
    max,
    p5,
    p25,
    p75,
    p95,
    p99,
    ci95Lower,
    ci95Upper,
    meanHazardQuotient,
    medianHazardQuotient,
    riskExceedancePercent,
    meanHazardIndex,
    medianHazardIndex,
    mixtureExceedancePercent,
    wilcoxonHQ,
    wilcoxonHI,
  };
}

export function calculateSpearmanRank(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const rx = getRanks(x);
  const ry = getRanks(y);

  let dSquareSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = rx[i] - ry[i];
    dSquareSum += diff * diff;
  }

  return 1 - (6 * dSquareSum) / (n * (n * n - 1));
}

/**
 * Computes Pearson correlation matrix of rank-transformed vectors
 */
export function computeCorrelationMatrix(rankedArrays: number[][]): number[][] {
  const p = rankedArrays.length;
  if (p === 0) return [];
  const n = rankedArrays[0].length;
  const means = rankedArrays.map((arr) => arr.reduce((acc, v) => acc + v, 0) / n);
  const stds = rankedArrays.map((arr, i) => {
    const m = means[i];
    const sumSq = arr.reduce((acc, v) => acc + (v - m) ** 2, 0);
    return Math.sqrt(sumSq);
  });

  const matrix: number[][] = Array.from({ length: p }, () => new Array(p).fill(0));
  for (let i = 0; i < p; i++) {
    matrix[i][i] = 1.0;
    for (let j = i + 1; j < p; j++) {
      if (stds[i] === 0 || stds[j] === 0) {
        matrix[i][j] = 0;
        matrix[j][i] = 0;
      } else {
        let cov = 0;
        for (let k = 0; k < n; k++) {
          cov += (rankedArrays[i][k] - means[i]) * (rankedArrays[j][k] - means[j]);
        }
        const r = cov / (stds[i] * stds[j]);
        matrix[i][j] = r;
        matrix[j][i] = r;
      }
    }
  }
  return matrix;
}

/**
 * Inverts a square matrix using Gauss-Jordan elimination with partial pivoting.
 * Includes small ridge regularization for collinear rank configurations.
 */
export function invertMatrix(A: number[][]): number[][] {
  const n = A.length;
  const M: number[][] = A.map((row, i) => {
    const r = [...row];
    for (let j = 0; j < n; j++) r.push(i === j ? 1 : 0);
    return r;
  });

  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(M[r][i]) > Math.abs(M[maxRow][i])) maxRow = r;
    }
    if (maxRow !== i) {
      const temp = M[i];
      M[i] = M[maxRow];
      M[maxRow] = temp;
    }
    let pivot = M[i][i];
    if (Math.abs(pivot) < 1e-12) {
      pivot = 1e-12;
      M[i][i] = pivot;
    }
    for (let j = 0; j < 2 * n; j++) M[i][j] /= pivot;
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = M[r][i];
        for (let j = 0; j < 2 * n; j++) M[r][j] -= factor * M[i][j];
      }
    }
  }
  return M.map((row) => row.slice(n));
}

/**
 * Calculates Partial Rank Correlation Coefficients (PRCC)
 * Controls for all other k-1 parameter covariations.
 */
export function calculatePRCC(
  results: IterationResult[],
  parameters: SimulationParameters,
  targetKey: keyof IterationResult = 'steadyStateConcentration',
): PRCCResult[] {
  const paramKeys = PARAMETER_KEYS;

  const n = results.length;
  if (n < 5) return [];

  // Identify which parameters actually vary across iterations
  const varyingParamKeys: Array<keyof SimulationParameters> = [];
  const nonVaryingParamKeys: Array<keyof SimulationParameters> = [];

  for (const key of paramKeys) {
    const vals = results.map((r) => getSampledParameterValue(r, key));
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    if (max - min > 1e-9) {
      varyingParamKeys.push(key);
    } else {
      nonVaryingParamKeys.push(key);
    }
  }

  const resultsPRCC: PRCCResult[] = [];

  // Non-varying parameters have PRCC = 0
  for (const key of nonVaryingParamKeys) {
    resultsPRCC.push({
      parameterId: key,
      parameterName: getSimulationParameter(parameters, key).name,
      prcc: 0,
      tStatistic: 0,
      pValue: 1,
      isSignificant: false,
      rank: 0,
    });
  }

  const k = varyingParamKeys.length;
  if (k === 0) {
    resultsPRCC.forEach((r, idx) => {
      r.rank = idx + 1;
    });
    return resultsPRCC;
  }

  const rankedInputs = varyingParamKeys.map((key) =>
    getRanks(results.map((r) => getSampledParameterValue(r, key))),
  );
  const rankedTarget = getRanks(results.map((r) => r[targetKey] as number));

  const allRanked = [...rankedInputs, rankedTarget];
  const corr = computeCorrelationMatrix(allRanked);

  // Apply ridge regularization on diagonal to ensure numerical stability
  const lambda = 1e-4;
  for (let i = 0; i < corr.length; i++) {
    corr[i][i] += lambda;
  }

  const inv = invertMatrix(corr);
  const targetIdx = k;

  for (let j = 0; j < k; j++) {
    const paramId = varyingParamKeys[j];
    const denominator = Math.sqrt(Math.max(1e-12, inv[j][j] * inv[targetIdx][targetIdx]));
    let prcc = -inv[j][targetIdx] / denominator;
    if (Number.isNaN(prcc)) prcc = 0;
    prcc = Math.max(-1, Math.min(1, prcc));

    const df = Math.max(1, n - 2 - Math.max(0, k - 1));
    const tStat = prcc * Math.sqrt(Math.max(0, df / Math.max(1e-12, 1 - prcc * prcc)));
    const pValue = 2 * (1 - studentsTCdf(Math.abs(tStat), df));

    resultsPRCC.push({
      parameterId: paramId,
      parameterName: getSimulationParameter(parameters, paramId).name,
      prcc: parseFloat(prcc.toFixed(4)),
      tStatistic: parseFloat(tStat.toFixed(3)),
      pValue: Number.isNaN(pValue) ? 1 : pValue,
      isSignificant: Math.abs(prcc) >= 0.1 && pValue < 0.05,
      rank: 0,
    });
  }

  resultsPRCC.sort((a, b) => Math.abs(b.prcc) - Math.abs(a.prcc));
  resultsPRCC.forEach((r, idx) => {
    r.rank = idx + 1;
  });
  return resultsPRCC;
}

export function calculateSensitivityRanks(
  results: IterationResult[],
  parameters: SimulationParameters,
  targetKey: keyof IterationResult = 'steadyStateConcentration',
): SensitivityRank[] {
  const targetValues = results.map((r) => r[targetKey] as number);
  const paramKeys = PARAMETER_KEYS;

  // Also calculate PRCC if results are sufficient
  let prccMap: Map<string, PRCCResult> | null = null;
  if (results.length > paramKeys.length + 2) {
    const prccs = calculatePRCC(results, parameters, targetKey);
    prccMap = new Map(prccs.map((p) => [p.parameterId, p]));
  }

  const ranks: SensitivityRank[] = paramKeys.map((paramId) => {
    const paramValues = results.map((r) => getSampledParameterValue(r, paramId));
    const corr = calculateSpearmanRank(paramValues, targetValues);
    const prccData = prccMap?.get(paramId);

    return {
      parameterId: paramId,
      parameterName: getSimulationParameter(parameters, paramId).name,
      correlationCoefficient: Number.isNaN(corr) ? 0 : corr,
      rank: 0,
      prcc: prccData?.prcc,
      tStatistic: prccData?.tStatistic,
      pValue: prccData?.pValue,
      isSignificant: prccData?.isSignificant,
    };
  });

  ranks.sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient));
  ranks.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return ranks;
}

/**
 * Two-Sided Mann-Whitney U Test (Wilcoxon Rank-Sum Test)
 * Compares two independent cohorts (e.g. Average vs Pregnant Filipino Women).
 */
export function calculateMannWhitneyU(sampleA: number[], sampleB: number[]): MannWhitneyUResult {
  const n1 = sampleA.length;
  const n2 = sampleB.length;
  if (n1 === 0 || n2 === 0) {
    return {
      uStat: 0,
      u1: 0,
      u2: 0,
      zScore: 0,
      pValue: 1,
      rankBiserialCorrelation: 0,
      isSignificant: false,
    };
  }

  const combined = [
    ...sampleA.map((val) => ({ val, group: 1 })),
    ...sampleB.map((val) => ({ val, group: 2 })),
  ].sort((a, b) => a.val - b.val);

  const n = combined.length;
  let rankSum1 = 0;
  let tieSum = 0;
  let i = 0;

  while (i < n) {
    let j = i;
    while (j < n - 1 && combined[j + 1].val === combined[i].val) {
      j++;
    }
    const tieCount = j - i + 1;
    if (tieCount > 1) {
      tieSum += tieCount ** 3 - tieCount;
    }
    const avgRank = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      if (combined[k].group === 1) {
        rankSum1 += avgRank;
      }
    }
    i = j + 1;
  }

  const u1 = rankSum1 - (n1 * (n1 + 1)) / 2;
  const u2 = n1 * n2 - u1;
  const uStat = Math.min(u1, u2);

  const meanU = (n1 * n2) / 2;
  const tieCorrection = n > 1 ? tieSum / (n * (n - 1)) : 0;
  const varU = ((n1 * n2) / 12) * (n + 1 - tieCorrection);
  const stdU = Math.sqrt(Math.max(1e-12, varU));
  const zScore = (u1 - meanU) / stdU;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));
  const rankBiserialCorrelation = n1 * n2 > 0 ? 1 - (2 * uStat) / (n1 * n2) : 0;

  return {
    uStat,
    u1,
    u2,
    zScore: parseFloat(zScore.toFixed(3)),
    pValue,
    rankBiserialCorrelation: parseFloat(rankBiserialCorrelation.toFixed(4)),
    isSignificant: pValue < 0.05,
  };
}

/**
 * One-Sample One-Sided Wilcoxon Signed-Rank Test
 * Tests whether the median Hazard Quotient or Hazard Index exceeds hypothesized threshold (1.0).
 * H0: Median <= 1.0 vs H1: Median > 1.0
 */
export function calculateOneSampleWilcoxon(
  values: number[],
  hypothesizedMedian: number = 1.0,
): WilcoxonOneSampleResult {
  const nTotal = values.length;
  if (nTotal === 0) {
    return {
      medianValue: 0,
      wStat: 0,
      zScore: 0,
      pValue: 1,
      exceedancePercent: 0,
      isSignificantRisk: false,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const medianValue = quantileSorted(sorted, 0.5);
  const exceedanceCount = values.filter((v) => v > hypothesizedMedian).length;
  const exceedancePercent = (exceedanceCount / nTotal) * 100;

  const diffs = values.map((v) => v - hypothesizedMedian).filter((d) => Math.abs(d) > 1e-9);

  const n = diffs.length;
  if (n === 0) {
    return {
      medianValue: parseFloat(medianValue.toFixed(4)),
      wStat: 0,
      zScore: 0,
      pValue: 1,
      exceedancePercent: parseFloat(exceedancePercent.toFixed(2)),
      isSignificantRisk: false,
    };
  }

  const absDiffs = diffs
    .map((d, idx) => ({ absD: Math.abs(d), d, idx }))
    .sort((a, b) => a.absD - b.absD);

  let wPlus = 0;
  let tieSum = 0;
  let i = 0;

  while (i < n) {
    let j = i;
    while (j < n - 1 && absDiffs[j + 1].absD === absDiffs[i].absD) {
      j++;
    }
    const tieCount = j - i + 1;
    if (tieCount > 1) {
      tieSum += tieCount ** 3 - tieCount;
    }
    const avgRank = (i + 1 + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      if (absDiffs[k].d > 0) {
        wPlus += avgRank;
      }
    }
    i = j + 1;
  }

  const meanW = (n * (n + 1)) / 4;
  const varW = (n * (n + 1) * (2 * n + 1)) / 24 - tieSum / 48;
  const stdW = Math.sqrt(Math.max(1e-12, varW));
  const zScore = (wPlus - meanW - 0.5) / stdW;
  // One-sided p-value for H1: Median > 1.0
  const pValue = 1 - normalCdf(zScore);

  return {
    medianValue: parseFloat(medianValue.toFixed(4)),
    wStat: wPlus,
    zScore: parseFloat(zScore.toFixed(3)),
    pValue: Number.isNaN(pValue) ? 1 : pValue,
    exceedancePercent: parseFloat(exceedancePercent.toFixed(2)),
    isSignificantRisk: pValue < 0.05 && medianValue > hypothesizedMedian,
  };
}
