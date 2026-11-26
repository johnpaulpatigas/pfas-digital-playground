import type { ExposureParameterConfig, SimulationParameters } from '../types';

export const DAILY_INTAKE_PARAMETER_KEYS = {
  pfoa: 'dailyIntakePfoa',
  pfos: 'dailyIntakePfos',
  pfhxs: 'dailyIntakePfhxs',
  pfna: 'dailyIntakePfna',
  genx: 'dailyIntakeGenx',
} as const satisfies Record<string, keyof SimulationParameters>;

export const WATER_CONCENTRATION_PARAMETER_KEYS = {
  pfoa: 'waterConcentrationPfoa',
  pfos: 'waterConcentrationPfos',
  pfhxs: 'waterConcentrationPfhxs',
  pfna: 'waterConcentrationPfna',
  genx: 'waterConcentrationGenx',
} as const satisfies Record<string, keyof SimulationParameters>;

export function getSimulationParameter(
  parameters: SimulationParameters,
  key: keyof SimulationParameters,
): ExposureParameterConfig {
  const config = parameters[key];
  if (config) return config;
  if (
    Object.values(DAILY_INTAKE_PARAMETER_KEYS).includes(
      key as (typeof DAILY_INTAKE_PARAMETER_KEYS)[keyof typeof DAILY_INTAKE_PARAMETER_KEYS],
    ) &&
    parameters.dailyIntake
  ) {
    return {
      ...parameters.dailyIntake,
      id: key,
      name: `Daily ${key.replace('dailyIntake', '')} Intake (legacy shared input)`,
    };
  }
  if (
    Object.values(WATER_CONCENTRATION_PARAMETER_KEYS).includes(
      key as (typeof WATER_CONCENTRATION_PARAMETER_KEYS)[keyof typeof WATER_CONCENTRATION_PARAMETER_KEYS],
    )
  ) {
    return {
      id: key,
      name: `Water concentration (${key.replace('waterConcentration', '')})`,
      unit: 'ng/L',
      description: 'Compound-specific water concentration used to calculate water-derived intake.',
      scientificContext:
        'No measurement supplied; legacy fallback assumes zero water concentration.',
      distribution: { type: 'fixed', value: 0 },
    };
  }
  throw new Error(`Missing simulation parameter: ${key}`);
}

/**
 * Ordered list of the sixteen sampled exposure and physiological parameters.
 * Shared by sensitivity analysis and the parameter sidebar so the order stays
 * consistent across the simulation and the UI.
 */
export const PARAMETER_KEYS: Array<keyof SimulationParameters> = [
  'dailyIntakePfoa',
  'dailyIntakePfos',
  'dailyIntakePfhxs',
  'dailyIntakePfna',
  'dailyIntakeGenx',
  'waterConcentrationPfoa',
  'waterConcentrationPfos',
  'waterConcentrationPfhxs',
  'waterConcentrationPfna',
  'waterConcentrationGenx',
  'bodyWeight',
  'age',
  'waterConsumption',
  'bioavailability',
  'eliminationHalfLife',
  'exposureDuration',
];

/** Parameters shown for the selected PFAS plus shared physiological inputs. */
export function getVisibleParameterKeys(compoundId: string): Array<keyof SimulationParameters> {
  const intakeKey =
    DAILY_INTAKE_PARAMETER_KEYS[compoundId as keyof typeof DAILY_INTAKE_PARAMETER_KEYS];
  const concentrationKey =
    WATER_CONCENTRATION_PARAMETER_KEYS[
      compoundId as keyof typeof WATER_CONCENTRATION_PARAMETER_KEYS
    ];
  if (!intakeKey || !concentrationKey) return PARAMETER_KEYS;

  return PARAMETER_KEYS.filter(
    (key) =>
      !Object.values(DAILY_INTAKE_PARAMETER_KEYS).includes(
        key as (typeof DAILY_INTAKE_PARAMETER_KEYS)[keyof typeof DAILY_INTAKE_PARAMETER_KEYS],
      ) || key === intakeKey,
  ).filter(
    (key) =>
      !Object.values(WATER_CONCENTRATION_PARAMETER_KEYS).includes(
        key as (typeof WATER_CONCENTRATION_PARAMETER_KEYS)[keyof typeof WATER_CONCENTRATION_PARAMETER_KEYS],
      ) || key === concentrationKey,
  );
}
