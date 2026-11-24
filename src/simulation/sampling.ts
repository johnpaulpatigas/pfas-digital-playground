import type { DistributionParams, IterationResult, SimulationParameters } from '../types';
import { PARAMETER_KEYS } from './parameters';
import { calculateToxicokinetics } from './toxicokinetics';

export type ParameterSampleValues = Record<keyof SimulationParameters, number>;

/**
 * Draw one value for every sampled parameter using the supplied distribution sampler.
 */
export function sampleParameterSet(
  parameters: SimulationParameters,
  draw: (distribution: DistributionParams) => number,
): ParameterSampleValues {
  const samples = {} as ParameterSampleValues;
  for (const key of PARAMETER_KEYS) {
    samples[key] = draw(parameters[key].distribution);
  }
  return samples;
}

/**
 * Apply physiological bounds and evaluate the 1-compartment model for one draw.
 */
export function evaluateParameterSample(
  samples: ParameterSampleValues,
  iteration: number,
  compoundId: string,
): IterationResult {
  return calculateToxicokinetics(
    {
      dailyIntake: Math.max(0.0001, samples.dailyIntake),
      bodyWeight: Math.max(20, samples.bodyWeight),
      age: Math.max(1, samples.age),
      waterConsumption: Math.max(0.1, samples.waterConsumption),
      bioavailability: Math.max(0.01, Math.min(1.0, samples.bioavailability)),
      eliminationHalfLife: Math.max(0.1, samples.eliminationHalfLife),
      exposureDuration: Math.max(0.1, samples.exposureDuration),
      compoundId,
    },
    iteration,
  );
}
