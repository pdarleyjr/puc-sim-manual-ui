import { create } from 'zustand'
import type { ScenarioId } from './store'

export type LauncherMode = 'panel' | 'scenario' | 'hydrant_lab' | 'scenarios' | 'settings' | null

// Mode aliases for backward compatibility during migration
export const MODE_ALIASES: Record<string, LauncherMode> = {
  'scenario_admin': 'scenarios',
  'scenario_runner': 'scenarios',
  'nozzle_admin': 'settings', // Redirect old nozzle_admin to settings
}

export interface LauncherState {
  chosenMode: LauncherMode
  chosenScenario: ScenarioId
  preferredMode: LauncherMode // from localStorage
  
  setMode: (mode: LauncherMode) => void
  setScenario: (id: ScenarioId) => void
  loadPreference: () => void
  savePreference: (mode: LauncherMode) => void
}

const STORAGE_KEY = 'pumpsim_preferred_mode'

export const useLauncher = create<LauncherState>((set) => ({
  chosenMode: null,
  chosenScenario: 'residential_one_xlay',
  preferredMode: null,
  
  setMode: (mode) => set({ chosenMode: mode }),
  
  setScenario: (id) => set({ chosenScenario: id }),
  
  loadPreference: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      // Apply mode aliases
      const effectiveMode = stored && MODE_ALIASES[stored] ? MODE_ALIASES[stored] : stored
      
      if (effectiveMode === 'panel' || effectiveMode === 'scenario' || effectiveMode === 'hydrant_lab' || effectiveMode === 'scenarios' || effectiveMode === 'settings') {
        set({ preferredMode: effectiveMode as LauncherMode, chosenMode: effectiveMode as LauncherMode })
      }
    } catch {
      // localStorage not available
    }
  },
  
  savePreference: (mode) => {
    try {
      if (mode) {
        localStorage.setItem(STORAGE_KEY, mode)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      set({ preferredMode: mode })
    } catch {
      // localStorage not available
    }
  },
}))