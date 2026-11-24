import type { SimulationParameters } from '../types';

/**
 * Ordered list of the seven sampled exposure and physiological parameters.
 * Shared by sensitivity analysis and the parameter sidebar so the order stays
 * consistent across the simulation and the UI.
 */
export const PARAMETER_KEYS: Array<keyof SimulationParameters> = [
  'dailyIntake',
  'bodyWeight',
  'age',
  'waterConsumption',
  'bioavailability',
  'eliminationHalfLife',
  'exposureDuration',
];
