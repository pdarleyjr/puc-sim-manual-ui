import { create } from 'zustand'
import type { ScenarioId } from './store'

export type LauncherMode = 'panel' | 'scenario' | 'foam' | 'hydrant_lab' | 'water_supply_troubleshooting' | null

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
      if (stored === 'panel' || stored === 'scenario' || stored === 'foam' || stored === 'hydrant_lab' || stored === 'water_supply_troubleshooting') {
        set({ preferredMode: stored, chosenMode: stored })
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