import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from '../useSimulationStore';
import { DEMOGRAPHIC_PRESETS } from '../../features/scenarios/presets';

describe('useSimulationStore demographic scenario and simple mode synchronization', () => {
  beforeEach(() => {
    useSimulationStore.getState().resetToDefault();
  });

  it('initializes in Simple Mode with default Average Filipino Woman scenario and simpleProfile', () => {
    const state = useSimulationStore.getState();
    expect(state.mode).toBe('simple');
    expect(state.activeScenarioId).toBe('average-filipino-woman');
    expect(state.simpleProfile.bodyWeight).toBe(55.4);
    expect(state.simpleProfile.age).toBe(30);
    expect(state.simpleProfile.waterConsumption).toBe(2.0);
  });

  it('DEMOGRAPHIC_PRESETS all have configured simpleProfile baselines', () => {
    DEMOGRAPHIC_PRESETS.forEach((preset) => {
      expect(preset.simpleProfile).toBeDefined();
      expect(preset.simpleProfile?.bodyWeight).toBeGreaterThan(20);
      expect(preset.simpleProfile?.age).toBeGreaterThan(10);
      expect(preset.simpleProfile?.waterConsumption).toBeGreaterThan(0.5);
    });
  });

  it('loadScenario updates simpleProfile to match pregnant-woman demographic profile', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('pregnant-woman');

    const updated = useSimulationStore.getState();
    expect(updated.activeScenarioId).toBe('pregnant-woman');
    expect(updated.simpleProfile.bodyWeight).toBe(65.2);
    expect(updated.simpleProfile.age).toBe(29);
    expect(updated.simpleProfile.waterConsumption).toBe(2.8);
    // Maternal clearance half-life distribution should be loaded
    expect(updated.parameters.eliminationHalfLife.distribution.type).toBe('lognormal');
  });

  it('loadScenario updates simpleProfile to match critical-chronic-threshold demographic profile', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('critical-chronic-threshold');

    const updated = useSimulationStore.getState();
    expect(updated.activeScenarioId).toBe('critical-chronic-threshold');
    expect(updated.simpleProfile.bodyWeight).toBe(55.4);
    expect(updated.simpleProfile.age).toBe(40);
    expect(updated.simpleProfile.waterConsumption).toBe(2.0);
  });

  it('updateSimpleProfile switches activeScenarioId to custom when user adjusts values', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('pregnant-woman');
    expect(useSimulationStore.getState().activeScenarioId).toBe('pregnant-woman');

    // Adjust body weight away from preset
    store.updateSimpleProfile({ bodyWeight: 72.0 });

    const state = useSimulationStore.getState();
    expect(state.activeScenarioId).toBe('custom');
    expect(state.simpleProfile.bodyWeight).toBe(72.0);
    expect(state.parameters.bodyWeight.distribution.type).toBe('normal');
  });

  it('preserves loaded demographic preset scenario when switching between Simple and Advanced modes', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('pregnant-woman');

    // Switch to Advanced Mode
    store.setPlaygroundMode('advanced');
    expect(useSimulationStore.getState().mode).toBe('advanced');
    expect(useSimulationStore.getState().activeScenarioId).toBe('pregnant-woman');

    // Switch back to Simple Mode
    store.setPlaygroundMode('simple');
    expect(useSimulationStore.getState().mode).toBe('simple');
    expect(useSimulationStore.getState().activeScenarioId).toBe('pregnant-woman');
    expect(useSimulationStore.getState().simpleProfile.bodyWeight).toBe(65.2);
  });

  it('resetToDefault restores default baseline scenario and simpleProfile', () => {
    const store = useSimulationStore.getState();
    store.loadScenario('pregnant-woman');
    store.updateSimpleProfile({ bodyWeight: 80 });

    store.resetToDefault();
    const state = useSimulationStore.getState();
    expect(state.activeScenarioId).toBe('average-filipino-woman');
    expect(state.simpleProfile.bodyWeight).toBe(55.4);
    expect(state.simpleProfile.age).toBe(30);
    expect(state.simpleProfile.waterConsumption).toBe(2.0);
  });
});
