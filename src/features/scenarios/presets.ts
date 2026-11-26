import type { DemographicScenario, ExposureParameterConfig } from '../../types';
import { PFAS_COMPOUNDS } from '../../simulation/pfasCompounds';

const intakeConfig = (
  compoundId: string,
  distribution: ExposureParameterConfig['distribution'],
  scientificContext =
    'Preset assumption only. Replace with compound-specific intake data appropriate to the study.',
): ExposureParameterConfig => ({
  id: `dailyIntake${compoundId}`,
  name: `Daily ${compoundId.toUpperCase()} Non-Water Intake`,
  unit: 'µg/day',
  description: `Compound-specific non-water daily intake for ${compoundId.toUpperCase()}.`,
  scientificContext,
  distribution,
});

const assumedIntakeGroup = (
  pfoa: [number, number],
  pfos: [number, number],
  other: [number, number],
) => ({
  dailyIntakePfoa: intakeConfig('pfoa', { type: 'lognormal', mean: pfoa[0], sd: pfoa[1] }),
  dailyIntakePfos: intakeConfig('pfos', { type: 'lognormal', mean: pfos[0], sd: pfos[1] }),
  dailyIntakePfhxs: intakeConfig('pfhxs', { type: 'lognormal', mean: other[0], sd: other[1] }),
  dailyIntakePfna: intakeConfig('pfna', { type: 'lognormal', mean: other[0], sd: other[1] }),
  dailyIntakeGenx: intakeConfig('genx', { type: 'lognormal', mean: other[0], sd: other[1] }),
});

const baselineWaterConcentrationConfig = (
  compoundId: string,
  value: number,
): ExposureParameterConfig => {
  const compound = PFAS_COMPOUNDS.find((item) => item.id === compoundId);
  if (!compound) throw new Error(`Unknown PFAS compound: ${compoundId}`);
  return {
    id: `waterConcentration${compound.id}`,
    name: `${compound.id.toUpperCase()} Water Concentration`,
    unit: 'ng/L',
    description: `Drinking-water concentration for ${compound.id.toUpperCase()}.`,
    scientificContext: `Low-level treated-water baseline (${value} ng/L, below the ${compound.epaMCL} ng/L 2024 EPA MCL); replace with measured site concentration.`,
    distribution: { type: 'fixed', value },
  };
};

const baselineWaterConcentrationGroup = () => ({
  waterConcentrationPfoa: baselineWaterConcentrationConfig('pfoa', 0.5),
  waterConcentrationPfos: baselineWaterConcentrationConfig('pfos', 0.5),
  waterConcentrationPfhxs: baselineWaterConcentrationConfig('pfhxs', 1.0),
  waterConcentrationPfna: baselineWaterConcentrationConfig('pfna', 1.0),
  waterConcentrationGenx: baselineWaterConcentrationConfig('genx', 1.0),
});

const zeroWaterConcentrationGroup = () => ({
  waterConcentrationPfoa: {
    ...baselineWaterConcentrationConfig('pfoa', 0),
    scientificContext: 'Critical-dose scenario sets water concentration to zero to isolate non-water intake.',
  },
  waterConcentrationPfos: {
    ...baselineWaterConcentrationConfig('pfos', 0),
    scientificContext: 'Critical-dose scenario sets water concentration to zero to isolate non-water intake.',
  },
  waterConcentrationPfhxs: {
    ...baselineWaterConcentrationConfig('pfhxs', 0),
    scientificContext: 'Critical-dose scenario sets water concentration to zero to isolate non-water intake.',
  },
  waterConcentrationPfna: {
    ...baselineWaterConcentrationConfig('pfna', 0),
    scientificContext: 'Critical-dose scenario sets water concentration to zero to isolate non-water intake.',
  },
  waterConcentrationGenx: {
    ...baselineWaterConcentrationConfig('genx', 0),
    scientificContext: 'Critical-dose scenario sets water concentration to zero to isolate non-water intake.',
  },
});

export const DEMOGRAPHIC_PRESETS: DemographicScenario[] = [
  {
    id: 'average-filipino-woman',
    name: 'Average Filipino Woman',
    targetGroup: 'General Adult Female Cohort',
    description:
      'Baseline physiological scenario for adult women in the Philippines. PFAS-specific intake distributions are provisional assumptions, not survey measurements.',
    parameters: {
      dailyIntake: intakeConfig('pfoa', { type: 'lognormal', mean: 0.0005, sd: 0.0002 }),
      ...assumedIntakeGroup([0.0005, 0.0002], [0.002, 0.0005], [0.01, 0.003]),
      ...baselineWaterConcentrationGroup(),
      bodyWeight: {
        id: 'bodyWeight',
        name: 'Body Weight',
        unit: 'kg',
        description: 'Adult female body mass.',
        scientificContext: 'Philippine National Nutrition Council survey baseline mean of 55.4 kg.',
        distribution: { type: 'normal', mean: 55.4, sd: 8.2 },
      },
      age: {
        id: 'age',
        name: 'Age',
        unit: 'years',
        description: 'Age range of exposed demographic cohort.',
        scientificContext: 'Reproductive age span.',
        distribution: { type: 'uniform', min: 18, max: 45 },
      },
      waterConsumption: {
        id: 'waterConsumption',
        name: 'Daily Drinking Water',
        unit: 'L/day',
        description: 'Daily direct drinking water intake.',
        scientificContext: 'Tropical hydration needs average 2.0 L/day.',
        distribution: { type: 'triangular', min: 1.2, mode: 2.0, max: 3.5 },
      },
      bioavailability: {
        id: 'bioavailability',
        name: 'Gastrointestinal Bioavailability',
        unit: 'fraction',
        description: 'Fraction of ingested PFAS absorbed into systemic blood circulation.',
        scientificContext: 'PFAS compounds such as PFOA show high oral absorption (>90%).',
        distribution: { type: 'uniform', min: 0.85, max: 0.99 },
      },
      eliminationHalfLife: {
        id: 'eliminationHalfLife',
        name: 'Elimination Half-Life',
        unit: 'years',
        description: 'Biological excretion half-life in human blood serum.',
        scientificContext: 'Scenario assumption; the 2024 memo reports a 3.52-year PFNA estimate used in MRL derivation.',
        distribution: { type: 'lognormal', mean: 3.2, sd: 0.8 },
      },
      exposureDuration: {
        id: 'exposureDuration',
        name: 'Exposure Duration',
        unit: 'years',
        description: 'Cumulative lifespan period of chronic low-dose exposure.',
        scientificContext:
          'Demographic baseline of 22 years chronic exposure for general adult female cohort (PSA/NDHS).',
        distribution: { type: 'triangular', min: 16, mode: 22, max: 28 },
      },
    },
  },
  {
    id: 'pregnant-woman',
    name: 'Pregnant Female Profile',
    targetGroup: 'Maternal Physiology Cohort',
    description:
      'Pregnancy physiology scenario. PFAS-specific intake distributions are provisional assumptions, not measured maternal exposures.',
    parameters: {
      dailyIntake: intakeConfig('pfoa', { type: 'lognormal', mean: 0.0006, sd: 0.0002 }),
      ...assumedIntakeGroup([0.0006, 0.0002], [0.0025, 0.0006], [0.012, 0.004]),
      ...baselineWaterConcentrationGroup(),
      bodyWeight: {
        id: 'bodyWeight',
        name: 'Body Weight',
        unit: 'kg',
        description: 'Gestational body mass.',
        scientificContext: 'Adjusted for pregnancy weight gain (+10 to 15 kg).',
        distribution: { type: 'normal', mean: 65.2, sd: 9.5 },
      },
      age: {
        id: 'age',
        name: 'Age',
        unit: 'years',
        description: 'Maternal age.',
        scientificContext: 'Reproductive peak years.',
        distribution: { type: 'uniform', min: 20, max: 38 },
      },
      waterConsumption: {
        id: 'waterConsumption',
        name: 'Daily Drinking Water',
        unit: 'L/day',
        description: 'Hydration requirement during pregnancy.',
        scientificContext: 'Increased fluid demands (approx. 2.5 to 3.0 L).',
        distribution: { type: 'triangular', min: 2.0, mode: 2.8, max: 4.5 },
      },
      bioavailability: {
        id: 'bioavailability',
        name: 'Gastrointestinal Bioavailability',
        unit: 'fraction',
        description: 'GI absorption fraction.',
        scientificContext: 'Unchanged or slightly elevated GI transport.',
        distribution: { type: 'uniform', min: 0.85, max: 0.98 },
      },
      eliminationHalfLife: {
        id: 'eliminationHalfLife',
        name: 'Elimination Half-Life',
        unit: 'years',
        description: 'Apparent serum clearance half-life.',
        scientificContext:
          'Pregnancy scenario assumption; the cited PFNA estimate is not pregnancy-specific.',
        distribution: { type: 'lognormal', mean: 2.4, sd: 0.6 },
      },
      exposureDuration: {
        id: 'exposureDuration',
        name: 'Exposure Duration',
        unit: 'years',
        description: 'Pre-gestational and gestational chronic exposure history.',
        scientificContext:
          'Calibrated to maternal age at pregnancy (19 years pre-gestational duration based on NDHS median maternal age).',
        distribution: { type: 'triangular', min: 14, mode: 19, max: 24 },
      },
    },
  },
  {
    id: 'critical-chronic-threshold',
    name: 'Critical Baseline Threshold (25 to 30 yr Chronic)',
    targetGroup: 'Toxicological Benchmark Cohort',
    description:
      'Configures a 25 to 30 year exposure period with baseline threshold parameters to evaluate steady-state PFAS body burden and exceedance.',
    parameters: {
      dailyIntake: intakeConfig('pfoa', { type: 'uniform', min: 0.0017, max: 0.003 }),
      ...zeroWaterConcentrationGroup(),
      dailyIntakePfoa: intakeConfig(
        'pfoa',
        { type: 'uniform', min: 0.0017, max: 0.003 },
        'Benchmark scenario around the PFOA RfD-derived intake threshold for a 55.4 kg adult; not an exposure estimate.',
      ),
      dailyIntakePfos: intakeConfig(
        'pfos',
        { type: 'uniform', min: 0.0055, max: 0.01 },
        'Benchmark scenario around the PFOS RfD-derived intake threshold for a 55.4 kg adult; not an exposure estimate.',
      ),
      dailyIntakePfhxs: intakeConfig(
        'pfhxs',
        { type: 'uniform', min: 0.53, max: 0.8 },
        'Benchmark scenario around the PFHxS RfD-derived intake threshold for a 55.4 kg adult; not an exposure estimate.',
      ),
      dailyIntakePfna: intakeConfig(
        'pfna',
        { type: 'uniform', min: 0.14, max: 0.2 },
        'Benchmark scenario around the PFNA MRL-derived intake threshold for a 55.4 kg adult; not an exposure estimate.',
      ),
      dailyIntakeGenx: intakeConfig(
        'genx',
        { type: 'uniform', min: 0.16, max: 0.25 },
        'Benchmark scenario around the GenX RfD-derived intake threshold for a 55.4 kg adult; not an exposure estimate.',
      ),
      bodyWeight: {
        id: 'bodyWeight',
        name: 'Body Weight',
        unit: 'kg',
        description: 'Baseline adult female body mass.',
        scientificContext: 'Philippine National Nutrition Council survey baseline mean of 55.4 kg.',
        distribution: { type: 'normal', mean: 55.4, sd: 5.0 },
      },
      age: {
        id: 'age',
        name: 'Age',
        unit: 'years',
        description: 'Adult demographic age range.',
        scientificContext: 'Chronic adult exposure span.',
        distribution: { type: 'uniform', min: 25, max: 55 },
      },
      waterConsumption: {
        id: 'waterConsumption',
        name: 'Daily Drinking Water',
        unit: 'L/day',
        description: 'Direct daily drinking water ingestion.',
        scientificContext: 'Standard adult hydration baseline of 2.0 L/day.',
        distribution: { type: 'triangular', min: 1.5, mode: 2.0, max: 3.0 },
      },
      bioavailability: {
        id: 'bioavailability',
        name: 'Gastrointestinal Bioavailability',
        unit: 'fraction',
        description: 'Gastrointestinal absorption fraction.',
        scientificContext: 'Near-complete absorption typical of perfluorinated carboxylic acids.',
        distribution: { type: 'uniform', min: 0.9, max: 0.98 },
      },
      eliminationHalfLife: {
        id: 'eliminationHalfLife',
        name: 'Elimination Half-Life',
        unit: 'years',
        description: 'Serum retention half-life.',
        scientificContext: 'Scenario assumption; the 2024 memo reports a 3.52-year PFNA estimate used in MRL derivation.',
        distribution: { type: 'normal', mean: 3.8, sd: 0.4 },
      },
      exposureDuration: {
        id: 'exposureDuration',
        name: 'Exposure Duration',
        unit: 'years',
        description: 'Exposure duration reaching over 99% of steady-state capacity.',
        scientificContext:
          '25 to 30 years corresponds to 6.5 to 8.0 half-lives, reaching steady-state accumulation.',
        distribution: { type: 'uniform', min: 25, max: 30 },
      },
    },
  },
];
