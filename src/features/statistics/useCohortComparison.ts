import { useEffect, useMemo, useState } from 'react';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';
import { executeSimulationAsync } from '../../simulation/runSimulationAsync';
import {
  calculateMannWhitneyU,
  calculateOneSampleWilcoxon,
  quantileSorted,
} from '../../simulation/statistics';
import type { IterationResult, SamplingConfig } from '../../types';
import { DEMOGRAPHIC_PRESETS } from '../scenarios/presets';

export interface WilcoxonTableRow {
  id: string;
  label: string;
  mean: number;
  median: number;
  exceedancePercent: number;
  wStat: number;
  pValue: number;
  isSignificantRisk: boolean;
  decision: string;
}

export interface MannWhitneyTableRow {
  compoundId: string;
  label: string;
  avgMedian: number;
  pregMedian: number;
  medianRatio: number;
  uStat: number;
  pValue: number;
  isSignificant: boolean;
  avgValues: number[];
  pregValues: number[];
}

const AVG_PRESET_ID = 'average-filipino-woman';
const PREG_PRESET_ID = 'pregnant-woman';
const COHORT_IDS = [AVG_PRESET_ID, PREG_PRESET_ID];

const counterpartCache = new Map<string, Promise<IterationResult[]>>();

/**
 * Preset cohorts are deterministic for a given sampling config. Caching the
 * pending run keeps remounts (page navigation) from starting the same work
 * again, and the worker keeps that work off the main thread.
 */
function loadCohortResults(presetId: string, samplingConfig: SamplingConfig) {
  const preset = DEMOGRAPHIC_PRESETS.find((item) => item.id === presetId);
  if (!preset) return Promise.resolve([]);

  const { method, iterations, seed, compoundId } = samplingConfig;
  const key = `${presetId}|${method}|${iterations}|${seed}|${compoundId}`;
  const cached = counterpartCache.get(key);
  if (cached) return cached;

  const pending = executeSimulationAsync(preset.parameters, samplingConfig).then(
    (result) => result.simResults,
  );
  counterpartCache.set(key, pending);
  pending.catch(() => counterpartCache.delete(key));

  if (counterpartCache.size > 6) {
    const oldestKey = counterpartCache.keys().next().value;
    if (oldestKey) counterpartCache.delete(oldestKey);
  }

  return pending;
}

export function useCohortComparison(
  results: IterationResult[] | null,
  activeScenarioId: string,
  samplingConfig: SamplingConfig,
) {
  const [counterparts, setCounterparts] = useState<Record<string, IterationResult[]>>({});

  const neededPresetIds = useMemo(
    () =>
      !results || results.length === 0 || activeScenarioId === 'custom'
        ? []
        : COHORT_IDS.filter((id) => id !== activeScenarioId),
    [results, activeScenarioId],
  );

  useEffect(() => {
    if (neededPresetIds.length === 0) return;

    let cancelled = false;
    void Promise.all(
      neededPresetIds.map(async (id) => [id, await loadCohortResults(id, samplingConfig)] as const),
    )
      .then((entries) => {
        if (!cancelled) setCounterparts(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setCounterparts({});
      });

    return () => {
      cancelled = true;
    };
  }, [neededPresetIds, samplingConfig]);

  const wilcoxonRows = useMemo<WilcoxonTableRow[]>(() => {
    if (!results || results.length === 0) return [];

    const rows: WilcoxonTableRow[] = PFAS_COMPOUNDS.map((compound) => {
      const hqValues = results.map(
        (r) => r.compoundOutputs?.[compound.id]?.hazardQuotient ?? r.hazardQuotient,
      );
      const mean = hqValues.reduce((acc, v) => acc + v, 0) / hqValues.length;
      const res = calculateOneSampleWilcoxon(hqValues, 1.0);
      return {
        id: compound.id,
        label: compound.id.toUpperCase(),
        mean,
        median: res.medianValue,
        exceedancePercent: res.exceedancePercent,
        wStat: res.wStat,
        pValue: res.pValue,
        isSignificantRisk: res.isSignificantRisk,
        decision: res.isSignificantRisk ? 'Significant Risk (HQ > 1)' : 'No Significant Risk',
      };
    });

    // Hazard Index (HI) = sum of HQ across all 5 compounds
    const hiValues = results.map((r) => {
      if (!r.compoundOutputs) return r.hazardQuotient;
      return PFAS_COMPOUNDS.reduce(
        (sum, c) => sum + (r.compoundOutputs?.[c.id]?.hazardQuotient ?? 0),
        0,
      );
    });
    const hiMean = hiValues.reduce((acc, v) => acc + v, 0) / hiValues.length;
    const hiRes = calculateOneSampleWilcoxon(hiValues, 1.0);
    rows.push({
      id: 'hi',
      label: 'Hazard Index (HI)',
      mean: hiMean,
      median: hiRes.medianValue,
      exceedancePercent: hiRes.exceedancePercent,
      wStat: hiRes.wStat,
      pValue: hiRes.pValue,
      isSignificantRisk: hiRes.isSignificantRisk,
      decision: hiRes.isSignificantRisk ? 'Significant Risk (HI > 1)' : 'No Significant Risk',
    });

    return rows;
  }, [results]);

  const { mannWhitneyCssRows, mannWhitneyBurdenRows } = useMemo<{
    mannWhitneyCssRows: MannWhitneyTableRow[];
    mannWhitneyBurdenRows: MannWhitneyTableRow[];
  }>(() => {
    if (!results || results.length === 0 || activeScenarioId === 'custom') {
      return { mannWhitneyCssRows: [], mannWhitneyBurdenRows: [] };
    }

    // Use existing results for the active preset and wait for the worker-run
    // counterpart before comparing the two cohorts.
    const avgResults = activeScenarioId === AVG_PRESET_ID ? results : counterparts[AVG_PRESET_ID];
    const pregResults =
      activeScenarioId === PREG_PRESET_ID ? results : counterparts[PREG_PRESET_ID];
    if (!avgResults || !pregResults) {
      return { mannWhitneyCssRows: [], mannWhitneyBurdenRows: [] };
    }

    const cssRows: MannWhitneyTableRow[] = [];
    const burdenRows: MannWhitneyTableRow[] = [];

    for (const compound of PFAS_COMPOUNDS) {
      const avgCss = avgResults.map(
        (r) =>
          r.compoundOutputs?.[compound.id]?.steadyStateConcentration ?? r.steadyStateConcentration,
      );
      const pregCss = pregResults.map(
        (r) =>
          r.compoundOutputs?.[compound.id]?.steadyStateConcentration ?? r.steadyStateConcentration,
      );
      const avgCssSorted = [...avgCss].sort((a, b) => a - b);
      const pregCssSorted = [...pregCss].sort((a, b) => a - b);
      const avgCssMedian = quantileSorted(avgCssSorted, 0.5);
      const pregCssMedian = quantileSorted(pregCssSorted, 0.5);
      const mwCss = calculateMannWhitneyU(pregCss, avgCss);

      cssRows.push({
        compoundId: compound.id,
        label: compound.id.toUpperCase(),
        avgMedian: avgCssMedian,
        pregMedian: pregCssMedian,
        medianRatio: avgCssMedian > 0 ? pregCssMedian / avgCssMedian : 0,
        uStat: mwCss.uStat,
        pValue: mwCss.pValue,
        isSignificant: mwCss.isSignificant,
        avgValues: avgCss,
        pregValues: pregCss,
      });

      const avgBurden = avgResults.map(
        (r) => r.compoundOutputs?.[compound.id]?.peakBodyBurden ?? r.peakBodyBurden,
      );
      const pregBurden = pregResults.map(
        (r) => r.compoundOutputs?.[compound.id]?.peakBodyBurden ?? r.peakBodyBurden,
      );
      const avgBurdenSorted = [...avgBurden].sort((a, b) => a - b);
      const pregBurdenSorted = [...pregBurden].sort((a, b) => a - b);
      const avgBurdenMedian = quantileSorted(avgBurdenSorted, 0.5);
      const pregBurdenMedian = quantileSorted(pregBurdenSorted, 0.5);
      const mwBurden = calculateMannWhitneyU(pregBurden, avgBurden);

      burdenRows.push({
        compoundId: compound.id,
        label: compound.id.toUpperCase(),
        avgMedian: avgBurdenMedian,
        pregMedian: pregBurdenMedian,
        medianRatio: avgBurdenMedian > 0 ? pregBurdenMedian / avgBurdenMedian : 0,
        uStat: mwBurden.uStat,
        pValue: mwBurden.pValue,
        isSignificant: mwBurden.isSignificant,
        avgValues: avgBurden,
        pregValues: pregBurden,
      });
    }

    return { mannWhitneyCssRows: cssRows, mannWhitneyBurdenRows: burdenRows };
  }, [results, activeScenarioId, counterparts]);

  return { wilcoxonRows, mannWhitneyCssRows, mannWhitneyBurdenRows };
}
