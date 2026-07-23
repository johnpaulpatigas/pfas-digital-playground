import type { IterationResult, SummaryStatistics, SensitivityRank, SimulationParameters } from '../types';

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

export function calculateSummaryStatistics(
  results: IterationResult[],
  targetKey: keyof IterationResult = 'steadyStateConcentration'
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
      riskExceedancePercent: 0,
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

  const varianceSum = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
  const variance = count > 1 ? varianceSum / (count - 1) : 0;
  const stdDev = Math.sqrt(variance);

  const stdError = stdDev / Math.sqrt(count);
  const ci95Lower = Math.max(0, mean - 1.96 * stdError);
  const ci95Upper = mean + 1.96 * stdError;

  // Hazard Quotient & Health Risk Exceedance
  const hqValues = results.map((r) => r.hazardQuotient);
  const meanHazardQuotient = hqValues.reduce((acc, v) => acc + v, 0) / count;
  const exceedanceCount = hqValues.filter((hq) => hq > 1.0).length;
  const riskExceedancePercent = (exceedanceCount / count) * 100;

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
    riskExceedancePercent,
  };
}

export function calculateSpearmanRank(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const getRanks = (arr: number[]) => {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array<number>(n);
    for (let i = 0; i < n; i++) {
      ranks[sorted[i].i] = i + 1;
    }
    return ranks;
  };

  const rx = getRanks(x);
  const ry = getRanks(y);

  let dSquareSum = 0;
  for (let i = 0; i < n; i++) {
    const diff = rx[i] - ry[i];
    dSquareSum += diff * diff;
  }

  return 1 - (6 * dSquareSum) / (n * (n * n - 1));
}

export function calculateSensitivityRanks(
  results: IterationResult[],
  parameters: SimulationParameters,
  targetKey: keyof IterationResult = 'steadyStateConcentration'
): SensitivityRank[] {
  const targetValues = results.map((r) => r[targetKey] as number);
  const paramKeys: Array<keyof SimulationParameters> = [
    'dailyIntake',
    'bodyWeight',
    'age',
    'waterConsumption',
    'bioavailability',
    'eliminationHalfLife',
    'exposureDuration',
  ];

  const ranks: SensitivityRank[] = paramKeys.map((paramId) => {
    const paramValues = results.map((r) => r[paramId] as number);
    const corr = calculateSpearmanRank(paramValues, targetValues);
    return {
      parameterId: paramId,
      parameterName: parameters[paramId].name,
      correlationCoefficient: isNaN(corr) ? 0 : corr,
      rank: 0,
    };
  });

  ranks.sort((a, b) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient));
  ranks.forEach((r, idx) => {
    r.rank = idx + 1;
  });

  return ranks;
}
