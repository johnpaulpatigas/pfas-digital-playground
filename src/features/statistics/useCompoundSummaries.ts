import { useMemo } from 'react';
import { calculateCompoundSummaries } from '../../simulation/toxicokinetics';
import { useSimulationStore } from '../../stores/useSimulationStore';
import type { CompoundSummary, IterationResult, SimulationParameters } from '../../types';

/**
 * Single entry point for per-compound numbers. The store copy was produced from
 * the same results during the simulation run; the fallback covers callers that
 * pass results directly (e.g. before the store has been populated).
 */
export function useCompoundSummaries(
  results: IterationResult[] | null | undefined,
  parameters: SimulationParameters | undefined,
): CompoundSummary[] {
  const stored = useSimulationStore((state) => state.compoundSummaries);

  return useMemo(() => {
    if (stored && stored.length > 0) return stored;
    if (results && results.length > 0 && parameters) {
      return calculateCompoundSummaries(results, parameters);
    }
    return [];
  }, [stored, results, parameters]);
}
