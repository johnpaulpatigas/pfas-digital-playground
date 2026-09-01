import { describe, it, expect } from 'vitest';
import { runMonteCarloSimulation } from '../monteCarlo';
import { runLatinHypercubeSimulation } from '../latinHypercube';
import { runMonteCarloLhsSimulation } from '../monteCarloLhs';
import type { SimulationParameters, DistributionParams, ExposureParameterConfig } from '../../types';

const createConfig = (id: string, name: string, dist: DistributionParams): ExposureParameterConfig => ({
  id,
  name,
  unit: '',
  description: '',
  scientificContext: '',
  distribution: dist,
});

const defaultParameters: SimulationParameters = {
  dailyIntake: createConfig('dailyIntake', 'Daily Intake', { type: 'normal', mean: 0.1, sd: 0.02 }),
  bodyWeight: createConfig('bodyWeight', 'Body Weight', { type: 'normal', mean: 55, sd: 8 }),
  age: createConfig('age', 'Age', { type: 'fixed', value: 30 }),
  waterConsumption: createConfig('waterConsumption', 'Water Consumption', { type: 'lognormal', mean: 1.5, sd: 0.3 }),
  bioavailability: createConfig('bioavailability', 'Bioavailability', { type: 'fixed', value: 0.95 }),
  eliminationHalfLife: createConfig('eliminationHalfLife', 'Half-Life', { type: 'uniform', min: 2.0, max: 4.5 }),
  exposureDuration: createConfig('exposureDuration', 'Exposure Duration', { type: 'triangular', min: 5, mode: 20, max: 40 }),
};

describe('Simulation Engines', () => {
  it('runMonteCarloSimulation generates requested number of results deterministically', () => {
    const results1 = runMonteCarloSimulation(defaultParameters, 100, 42);
    const results2 = runMonteCarloSimulation(defaultParameters, 100, 42);

    expect(results1.length).toBe(100);
    expect(results2.length).toBe(100);
    expect(results1[0].steadyStateConcentration).toBe(results2[0].steadyStateConcentration);
  });

  it('runLatinHypercubeSimulation generates stratified results deterministically', () => {
    const results1 = runLatinHypercubeSimulation(defaultParameters, 100, 42);
    const results2 = runLatinHypercubeSimulation(defaultParameters, 100, 42);

    expect(results1.length).toBe(100);
    expect(results2.length).toBe(100);
    expect(results1[0].steadyStateConcentration).toBe(results2[0].steadyStateConcentration);
  });

  it('runMonteCarloLhsSimulation combines MC and LHS seamlessly with multi-compound outputs', () => {
    const results = runMonteCarloLhsSimulation(defaultParameters, 1000, 42);

    expect(results.length).toBe(1000);
    expect(results[0].compoundOutputs).toBeDefined();
    expect(results[0].compoundOutputs?.pfoa).toBeDefined();
    expect(results[0].compoundOutputs?.pfos).toBeDefined();
    expect(results[0].compoundOutputs?.pfhxs).toBeDefined();
    expect(results[0].compoundOutputs?.pfna).toBeDefined();
    expect(results[0].compoundOutputs?.genx).toBeDefined();
  });
});

