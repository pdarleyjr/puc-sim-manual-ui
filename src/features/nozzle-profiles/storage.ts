import localforage from 'localforage';
import type { NozzlePreset, LocalOverride, NozzleExport, TabId, NozzleCategory } from './types';

/**
 * Storage for nozzle profiles using IndexedDB via localForage
 */

// Global presets store
const presetsStore = localforage.createInstance({
  name: 'puc-sim',
  storeName: 'fps-nozzles-global-v1',
  description: 'Admin nozzle presets'
});

// Local overrides store
const overridesStore = localforage.createInstance({
  name: 'puc-sim',
  storeName: 'fps-nozzles-local-v1',
  description: 'Per-tab nozzle overrides'
});

/**
 * Preset CRUD Operations
 */

export async function savePreset(preset: NozzlePreset): Promise<void> {
  await presetsStore.setItem(preset.id, preset);
}

export async function loadPreset(id: string): Promise<NozzlePreset | null> {
  return await presetsStore.getItem<NozzlePreset>(id);
}

export async function loadAllPresets(): Promise<NozzlePreset[]> {
  const presets: NozzlePreset[] = [];
  await presetsStore.iterate<NozzlePreset, void>((value) => {
    presets.push(value);
  });
  // Sort by category, then name
  return presets.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });
}

export async function deletePreset(id: string): Promise<void> {
  await presetsStore.removeItem(id);
}

export async function clearAllPresets(): Promise<void> {
  await presetsStore.clear();
}

/**
 * Local Override Operations
 */

function getOverrideKey(tabId: TabId, category: NozzleCategory): string {
  return `${tabId}:${category}`;
}

export async function saveLocalOverride(override: LocalOverride): Promise<void> {
  const key = getOverrideKey(override.tabId, override.category);
  await overridesStore.setItem(key, override);
}

export async function loadLocalOverride(tabId: TabId, category: NozzleCategory): Promise<LocalOverride | null> {
  const key = getOverrideKey(tabId, category);
  return await overridesStore.getItem<LocalOverride>(key);
}

export async function loadAllLocalOverrides(): Promise<LocalOverride[]> {
  const overrides: LocalOverride[] = [];
  await overridesStore.iterate<LocalOverride, void>((value) => {
    overrides.push(value);
  });
  return overrides;
}

export async function deleteLocalOverride(tabId: TabId, category: NozzleCategory): Promise<void> {
  const key = getOverrideKey(tabId, category);
  await overridesStore.removeItem(key);
}

export async function clearAllLocalOverrides(): Promise<void> {
  await overridesStore.clear();
}

/**
 * Import/Export Operations
 */

export async function exportPresets(): Promise<string> {
  const presets = await loadAllPresets();
  const exportData: NozzleExport = {
    version: 1,
    exportedAt: Date.now(),
    presets
  };
  return JSON.stringify(exportData, null, 2);
}

export async function importPresets(jsonString: string): Promise<{ imported: number; errors: string[] }> {
  const result = { imported: 0, errors: [] as string[] };
  
  try {
    const data = JSON.parse(jsonString) as NozzleExport;
    
    if (!data.presets || !Array.isArray(data.presets)) {
      throw new Error('Invalid format: missing presets array');
    }
    
    for (const preset of data.presets) {
      try {
        await savePreset(preset);
        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to import "${preset.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  } catch (error) {
    throw new Error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return result;
}