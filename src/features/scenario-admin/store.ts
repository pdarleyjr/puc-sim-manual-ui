import { create } from 'zustand';
import type { Scenario, EvoSpec, RunHistory } from './types';
import * as storage from './storage';
import { createEmptyScenario, duplicateScenario, generateId } from './utils';

interface ScenarioAdminState {
  // Data
  scenarios: Scenario[];
  activeScenarioId: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Runner state
  runningScenarioId: string | null;
  currentEvoIndex: number;
  timerRunning: boolean;
  elapsedTime: number;
  runStartTime: number | null;

  // Actions
  loadScenarios: () => Promise<void>;
  createScenario: () => Promise<void>;
  updateScenario: (id: string, updates: Partial<Scenario>) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  duplicateScenario: (id: string) => Promise<void>;
  setActiveScenario: (id: string | null) => void;
  
  // Evolution operations
  addEvolution: (scenarioId: string, evolution: EvoSpec) => Promise<void>;
  updateEvolution: (scenarioId: string, evoId: string, updates: Partial<EvoSpec>) => Promise<void>;
  deleteEvolution: (scenarioId: string, evoId: string) => Promise<void>;
  
  // Runner actions
  startRun: (scenarioId: string) => void;
  stopRun: () => void;
  nextEvolution: () => void;
  prevEvolution: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  tick: () => void;
  saveRunResult: (passed: boolean, metrics: any) => Promise<void>;
  
  // Import/Export
  exportScenarios: () => Promise<string>;
  importScenarios: (jsonString: string) => Promise<{ imported: number; failed: number; errors: string[] }>;
}

export const useScenarioAdmin = create<ScenarioAdminState>((set, get) => ({
  scenarios: [],
  activeScenarioId: null,
  isLoading: false,
  error: null,
  
  // Runner state
  runningScenarioId: null,
  currentEvoIndex: 0,
  timerRunning: false,
  elapsedTime: 0,
  runStartTime: null,

  loadScenarios: async () => {
    set({ isLoading: true, error: null });
    try {
      const scenarios = await storage.loadAllScenarios();
      set({ scenarios, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load scenarios',
        isLoading: false 
      });
    }
  },

  createScenario: async () => {
    const newScenario = createEmptyScenario();
    try {
      await storage.saveScenario(newScenario);
      set(state => ({
        scenarios: [newScenario, ...state.scenarios],
        activeScenarioId: newScenario.id,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create scenario' });
    }
  },

  updateScenario: async (id, updates) => {
    const scenario = get().scenarios.find(s => s.id === id);
    if (!scenario) return;

    const updated = {
      ...scenario,
      ...updates,
      updatedAt: Date.now(),
    };

    try {
      await storage.saveScenario(updated);
      set(state => ({
        scenarios: state.scenarios.map(s => s.id === id ? updated : s),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update scenario' });
    }
  },

  deleteScenario: async (id) => {
    try {
      await storage.deleteScenario(id);
      set(state => ({
        scenarios: state.scenarios.filter(s => s.id !== id),
        activeScenarioId: state.activeScenarioId === id ? null : state.activeScenarioId,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete scenario' });
    }
  },

  duplicateScenario: async (id) => {
    const scenario = get().scenarios.find(s => s.id === id);
    if (!scenario) return;

    const duplicate = duplicateScenario(scenario);
    try {
      await storage.saveScenario(duplicate);
      set(state => ({
        scenarios: [duplicate, ...state.scenarios],
        activeScenarioId: duplicate.id,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to duplicate scenario' });
    }
  },

  setActiveScenario: (id) => {
    set({ activeScenarioId: id });
  },

  addEvolution: async (scenarioId, evolution) => {
    const scenario = get().scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const updated = {
      ...scenario,
      evolutions: [...scenario.evolutions, { ...evolution, id: generateId() }],
      updatedAt: Date.now(),
    };

    try {
      await storage.saveScenario(updated);
      set(state => ({
        scenarios: state.scenarios.map(s => s.id === scenarioId ? updated : s),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add evolution' });
    }
  },

  updateEvolution: async (scenarioId, evoId, updates) => {
    const scenario = get().scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    const updated = {
      ...scenario,
      evolutions: scenario.evolutions.map(evo =>
        evo.id === evoId ? { ...evo, ...updates } : evo
      ),
      updatedAt: Date.now(),
    };

    try {
      await storage.saveScenario(updated);
      set(state => ({
        scenarios: state.scenarios.map(s => s.id === scenarioId ? updated : s),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update evolution' });
    }
  },

  deleteEvolution: async (scenarioId, evoId) => {
    const scenario = get().scenarios.find(s => s.id === scenarioId);
    if (!scenario) return;

    if (scenario.evolutions.length === 1) {
      set({ error: 'Cannot delete the last evolution' });
      return;
    }

    const updated = {
      ...scenario,
      evolutions: scenario.evolutions.filter(evo => evo.id !== evoId),
      updatedAt: Date.now(),
    };

    try {
      await storage.saveScenario(updated);
      set(state => ({
        scenarios: state.scenarios.map(s => s.id === scenarioId ? updated : s),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete evolution' });
    }
  },
  
  // Runner actions
  startRun: (scenarioId) => {
    set({
      runningScenarioId: scenarioId,
      currentEvoIndex: 0,
      elapsedTime: 0,
      timerRunning: false,
      runStartTime: Date.now(),
    });
  },
  
  stopRun: () => {
    set({
      runningScenarioId: null,
      currentEvoIndex: 0,
      timerRunning: false,
      elapsedTime: 0,
      runStartTime: null,
    });
  },
  
  nextEvolution: () => {
    const { runningScenarioId, scenarios, currentEvoIndex } = get();
    if (!runningScenarioId) return;
    
    const scenario = scenarios.find(s => s.id === runningScenarioId);
    if (!scenario) return;
    
    if (currentEvoIndex < scenario.evolutions.length - 1) {
      set({
        currentEvoIndex: currentEvoIndex + 1,
        elapsedTime: 0,
        timerRunning: false,
      });
    }
  },
  
  prevEvolution: () => {
    const { currentEvoIndex } = get();
    if (currentEvoIndex > 0) {
      set({
        currentEvoIndex: currentEvoIndex - 1,
        elapsedTime: 0,
        timerRunning: false,
      });
    }
  },
  
  startTimer: () => {
    set({ timerRunning: true });
  },
  
  stopTimer: () => {
    set({ timerRunning: false });
  },
  
  tick: () => {
    const { timerRunning, elapsedTime } = get();
    if (timerRunning) {
      set({ elapsedTime: elapsedTime + 1 });
    }
  },
  
  saveRunResult: async (passed, metrics) => {
    const { runningScenarioId, scenarios, runStartTime } = get();
    if (!runningScenarioId || !runStartTime) return;
    
    const scenario = scenarios.find(s => s.id === runningScenarioId);
    if (!scenario) return;
    
    const history: RunHistory = {
      id: generateId(),
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      startTime: runStartTime,
      endTime: Date.now(),
      evolutions: metrics.evolutions,
      overallPassed: passed,
    };
    
    await storage.saveRunHistory(history);
  },

  exportScenarios: async () => {
    return await storage.exportScenarios();
  },

  importScenarios: async (jsonString) => {
    set({ isLoading: true });
    try {
      const result = await storage.importScenarios(jsonString);
      await get().loadScenarios(); // Reload all scenarios
      return result;
    } finally {
      set({ isLoading: false });
    }
  },
}));