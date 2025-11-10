import { create } from 'zustand'
import type { EquipmentDefaults, DischargeDefault, DischargeId } from './types'
import {
  loadEquipmentDefaults,
  saveEquipmentDefaults,
  resetToFactoryDefaults,
  exportEquipmentDefaults,
  importEquipmentDefaults
} from './storage'

interface EquipmentConfigState {
  // State
  defaults: EquipmentDefaults | null
  isLoading: boolean
  error: string | null
  
  // Actions
  initialize: () => Promise<void>
  getDischarge: (id: DischargeId) => DischargeDefault | null
  updateDischarge: (id: DischargeId, updates: Partial<DischargeDefault>) => Promise<void>
  resetDefaults: () => Promise<void>
  exportJSON: () => Promise<string>
  importJSON: (json: string) => Promise<void>
}

export const useEquipmentConfig = create<EquipmentConfigState>((set, get) => ({
  defaults: null,
  isLoading: false,
  error: null,
  
  initialize: async () => {
    set({ isLoading: true, error: null })
    try {
      const defaults = await loadEquipmentDefaults()
      set({ defaults, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load equipment defaults',
        isLoading: false 
      })
    }
  },
  
  getDischarge: (id) => {
    const { defaults } = get()
    return defaults?.discharges[id] ?? null
  },
  
  updateDischarge: async (id, updates) => {
    const { defaults } = get()
    if (!defaults) return
    
    const updated: EquipmentDefaults = {
      ...defaults,
      discharges: {
        ...defaults.discharges,
        [id]: {
          ...defaults.discharges[id],
          ...updates
        }
      }
    }
    
    await saveEquipmentDefaults(updated)
    set({ defaults: updated })
  },
  
  resetDefaults: async () => {
    set({ isLoading: true, error: null })
    try {
      const factory = await resetToFactoryDefaults()
      set({ defaults: factory, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to reset defaults',
        isLoading: false
      })
    }
  },
  
  exportJSON: async () => {
    return await exportEquipmentDefaults()
  },
  
  importJSON: async (json) => {
    try {
      const imported = await importEquipmentDefaults(json)
      set({ defaults: imported, error: null })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to import defaults'
      })
      throw error
    }
  }
}))