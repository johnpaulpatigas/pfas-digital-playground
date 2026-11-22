import type { IterationResult, SimulationParameters } from '../types';
import { runLatinHypercubeSimulation } from './latinHypercube';
import { runMonteCarloSimulation } from './monteCarlo';

/**
 * Monte Carlo + Latin Hypercube Hybrid Simulation Engine
 * Combines pure pseudo-random Monte Carlo draws (50%) with stratified Latin Hypercube draws (50%)
 * to produce an ensemble dataset capturing both stochastic variance and optimal tail stratification.
 */
export function runMonteCarloLhsSimulation(
  parameters: SimulationParameters,
  iterations: number = 25000,
  seed: number = 42,
  compoundId: string = 'pfoa',
): IterationResult[] {
  const mcCount = Math.floor(iterations / 2);
  const lhsCount = iterations - mcCount;

  const mcResults = runMonteCarloSimulation(parameters, mcCount, seed, compoundId);
  const lhsResults = runLatinHypercubeSimulation(parameters, lhsCount, seed + 1, compoundId);

  const combined: IterationResult[] = [];
  const maxLen = Math.max(mcResults.length, lhsResults.length);

  for (let i = 0; i < maxLen; i++) {
    if (i < mcResults.length) {
      combined.push({
        ...mcResults[i],
        iteration: combined.length + 1,
      });
    }
    if (i < lhsResults.length) {
      combined.push({
        ...lhsResults[i],
        iteration: combined.length + 1,
      });
    }
  }

  return combined;
}
