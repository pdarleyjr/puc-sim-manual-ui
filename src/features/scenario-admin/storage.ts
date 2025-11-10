import localforage from 'localforage';
import type { Scenario, RunHistory } from './types';
import { validateScenario } from './validation';

/**
 * Storage abstraction for Scenario Admin
 * Uses IndexedDB via localForage for async, durable, offline-friendly storage
 * Ref: https://localforage.github.io/localForage/
 */

// Create separate stores for scenarios and run history
const scenarioStore = localforage.createInstance({
  name: 'puc-sim',
  storeName: 'scenarios',
  description: 'Fire pump training scenarios'
});

const historyStore = localforage.createInstance({
  name: 'puc-sim',
  storeName: 'scenario_history',
  description: 'Scenario run history'
});

/**
 * Scenario CRUD Operations
 */

export async function saveScenario(scenario: Scenario): Promise<void> {
  try {
    // Validate before saving
    validateScenario(scenario);
    await scenarioStore.setItem(scenario.id, scenario);
  } catch (error) {
    console.error('Failed to save scenario:', error);
    throw new Error(`Storage error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function loadScenario(id: string): Promise<Scenario | null> {
  try {
    const scenario = await scenarioStore.getItem<Scenario>(id);
    if (scenario) {
      // Validate on load to catch schema changes
      return validateScenario(scenario);
    }
    return null;
  } catch (error) {
    console.error('Failed to load scenario:', error);
    return null;
  }
}

export async function loadAllScenarios(): Promise<Scenario[]> {
  try {
    const scenarios: Scenario[] = [];
    await scenarioStore.iterate<Scenario, void>((value) => {
      try {
        scenarios.push(validateScenario(value));
      } catch (error) {
        console.warn('Skipping invalid scenario:', error);
      }
    });
    // Sort by updatedAt desc (most recent first)
    return scenarios.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    return [];
  }
}

export async function deleteScenario(id: string): Promise<void> {
  await scenarioStore.removeItem(id);
}

export async function clearAllScenarios(): Promise<void> {
  await scenarioStore.clear();
}

/**
 * Run History Operations
 */

export async function saveRunHistory(history: RunHistory): Promise<void> {
  await historyStore.setItem(history.id, history);
}

export async function loadRunHistory(scenarioId: string): Promise<RunHistory[]> {
  const allHistory: RunHistory[] = [];
  await historyStore.iterate<RunHistory, void>((value) => {
    if (value.scenarioId === scenarioId) {
      allHistory.push(value);
    }
  });
  // Sort by startTime desc (most recent first)
  return allHistory.sort((a, b) => b.startTime - a.startTime);
}

export async function clearRunHistory(): Promise<void> {
  await historyStore.clear();
}

/**
 * Import/Export Operations
 */

export interface ScenarioExport {
  version: 1;
  exportedAt: number;
  scenarios: Scenario[];
}

export async function exportScenarios(): Promise<string> {
  const scenarios = await loadAllScenarios();
  const exportData: ScenarioExport = {
    version: 1,
    exportedAt: Date.now(),
    scenarios,
  };
  return JSON.stringify(exportData, null, 2);
}

export async function importScenarios(jsonString: string): Promise<{
  imported: number;
  failed: number;
  errors: string[];
}> {
  const result = {
    imported: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    const data = JSON.parse(jsonString) as ScenarioExport;
    
    if (!data.scenarios || !Array.isArray(data.scenarios)) {
      throw new Error('Invalid export format: missing scenarios array');
    }

    for (const scenario of data.scenarios) {
      try {
        // Validate and save
        const validated = validateScenario(scenario);
        await saveScenario(validated);
        result.imported++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `Failed to import "${scenario.name}": ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}