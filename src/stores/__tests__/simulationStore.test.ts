import { beforeEach, describe, expect, it } from 'vitest';
import { useSimulationStore } from '../useSimulationStore';

describe('useSimulationStore demographic scenario synchronization', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetToDefault();
  });

  it('initializes with the default Average Filipino Woman scenario', () => {
    const state = useSimulationStore.getState();
    expect(state.activeScenarioId).toBe('average-filipino-woman');
    expect(state.samplingConfig.method).toBe('monte-carlo-lhs');
    expect(state.samplingConfig.iterations).toBe(5000);
    expect(state.parameters.bodyWeight.distribution.type).toBe('normal');
  });

  it('loadScenario loads the pregnant-woman parameter distributions', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('pregnant-woman');

    const updated = useSimulationStore.getState();
    expect(updated.activeScenarioId).toBe('pregnant-woman');
    expect(updated.parameters.eliminationHalfLife.distribution.type).toBe('lognormal');
    expect(updated.parameters.bodyWeight.distribution.type).toBe('normal');
    if (updated.parameters.bodyWeight.distribution.type === 'normal') {
      expect(updated.parameters.bodyWeight.distribution.mean).toBe(65.2);
    }
  });

  it('loadScenario loads the critical-chronic-threshold scenario', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('critical-chronic-threshold');

    const updated = useSimulationStore.getState();
    expect(updated.activeScenarioId).toBe('critical-chronic-threshold');
    expect(updated.parameters.exposureDuration.distribution.type).toBe('uniform');
    if (updated.parameters.exposureDuration.distribution.type === 'uniform') {
      expect(updated.parameters.exposureDuration.distribution.min).toBe(25);
      expect(updated.parameters.exposureDuration.distribution.max).toBe(30);
    }
  });

  it('resetToDefault restores the default baseline scenario and sampling config', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('pregnant-woman');
    store.setSamplingConfig({ method: 'latin-hypercube', iterations: 25000 });

    store.resetToDefault();
    const state = useSimulationStore.getState();
    expect(state.activeScenarioId).toBe('average-filipino-woman');
    expect(state.samplingConfig.method).toBe('monte-carlo-lhs');
    expect(state.samplingConfig.iterations).toBe(5000);
  });

  it('setCompoundId properly updates fixed and distribution parameters for active compound', () => {
    const store = useSimulationStore.getState();

    // 1. Test fixed distribution update (e.g. GenX half-life = 0.2 yr)
    store.setParameterDistribution('eliminationHalfLife', { type: 'fixed', value: 3.8 });
    store.setCompoundId('genx');
    const genxDist = useSimulationStore.getState().parameters.eliminationHalfLife.distribution;
    expect(genxDist.type).toBe('fixed');
    if (genxDist.type === 'fixed') {
      expect(genxDist.value).toBe(0.2);
    }

    // 2. Test normal distribution update (e.g. PFHxS half-life = 8.5 yr)
    store.setParameterDistribution('eliminationHalfLife', { type: 'normal', mean: 3.8, sd: 0.8 });
    store.setCompoundId('pfhxs');
    const pfhxsDist = useSimulationStore.getState().parameters.eliminationHalfLife.distribution;
    expect(pfhxsDist.type).toBe('normal');
    if (pfhxsDist.type === 'normal') {
      expect(pfhxsDist.mean).toBe(8.5);
    }
  });
});
