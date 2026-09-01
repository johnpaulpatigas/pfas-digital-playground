import type { SimulationParameters, IterationResult } from '../types';
import { runMonteCarloSimulation } from './monteCarlo';
import { runLatinHypercubeSimulation } from './latinHypercube';

/**
 * Monte Carlo + Latin Hypercube Hybrid Simulation Engine
 * Combines pure pseudo-random Monte Carlo draws (50%) with stratified Latin Hypercube draws (50%)
 * to produce an ensemble dataset capturing both stochastic variance and optimal tail stratification.
 */
export function runMonteCarloLhsSimulation(
  parameters: SimulationParameters,
  iterations: number = 100000,
  seed: number = 42
): IterationResult[] {
  const mcCount = Math.floor(iterations / 2);
  const lhsCount = iterations - mcCount;

  const mcResults = runMonteCarloSimulation(parameters, mcCount, seed);
  const lhsResults = runLatinHypercubeSimulation(parameters, lhsCount, seed + 100000);

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
