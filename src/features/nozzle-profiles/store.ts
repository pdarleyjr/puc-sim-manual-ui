import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { NozzlePreset, LocalOverride, TabId, NozzleCategory } from './types';
import * as storage from './storage';
import { generateDefaultPresets } from './presets';

interface NozzleProfileState {
  // Data
  presets: NozzlePreset[];
  localOverrides: LocalOverride[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadPresets: () => Promise<void>;
  createPreset: (preset: Omit<NozzlePreset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePreset: (id: string, updates: Partial<NozzlePreset>) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  duplicatePreset: (id: string) => Promise<void>;
  
  // Local overrides
  loadLocalOverrides: () => Promise<void>;
  setLocalOverride: (tabId: TabId, category: NozzleCategory, presetId: string) => Promise<void>;
  clearLocalOverride: (tabId: TabId, category: NozzleCategory) => Promise<void>;
  
  // Resolution (CRITICAL)
  getEffectiveNozzle: (tabId: TabId, category: NozzleCategory) => NozzlePreset | null;
  
  // Import/Export
  exportPresets: () => Promise<string>;
  importPresets: (json: string) => Promise<{ imported: number; errors: string[] }>;
  
  // Initialization
  seedDefaultPresets: () => Promise<void>;
}

export const useNozzleProfiles = create<NozzleProfileState>((set, get) => ({
  presets: [],
  localOverrides: [],
  isLoading: false,
  error: null,
  
  loadPresets: async () => {
    set({ isLoading: true, error: null });
    try {
      const presets = await storage.loadAllPresets();
      
      // If no presets, seed defaults
      if (presets.length === 0) {
        await get().seedDefaultPresets();
        return;
      }
      
      set({ presets, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load presets',
        isLoading: false 
      });
    }
  },
  
  createPreset: async (preset) => {
    const now = Date.now();
    const newPreset: NozzlePreset = {
      ...preset,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    
    try {
      await storage.savePreset(newPreset);
      set(state => ({
        presets: [...state.presets, newPreset]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create preset' });
    }
  },
  
  updatePreset: async (id, updates) => {
    const preset = get().presets.find(p => p.id === id);
    if (!preset) return;
    
    const updated: NozzlePreset = {
      ...preset,
      ...updates,
      updatedAt: Date.now()
    };
    
    try {
      await storage.savePreset(updated);
      set(state => ({
        presets: state.presets.map(p => p.id === id ? updated : p)
      }));
      
      // Invalidate related local overrides (Admin wins)
      const overridesToInvalidate = get().localOverrides.filter(
        o => o.presetId === id && o.timestamp < updated.updatedAt
      );
      
      for (const override of overridesToInvalidate) {
        await storage.deleteLocalOverride(override.tabId, override.category);
      }
      
      if (overridesToInvalidate.length > 0) {
        await get().loadLocalOverrides();
        // TODO: Show toast notification
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update preset' });
    }
  },
  
  deletePreset: async (id) => {
    try {
      await storage.deletePreset(id);
      set(state => ({
        presets: state.presets.filter(p => p.id !== id)
      }));
      
      // Clear related local overrides
      const overridesToClear = get().localOverrides.filter(o => o.presetId === id);
      for (const override of overridesToClear) {
        await storage.deleteLocalOverride(override.tabId, override.category);
      }
      
      if (overridesToClear.length > 0) {
        await get().loadLocalOverrides();
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete preset' });
    }
  },
  
  duplicatePreset: async (id) => {
    const preset = get().presets.find(p => p.id === id);
    if (!preset) return;
    
    await get().createPreset({
      ...preset,
      name: `${preset.name} (Copy)`,
      isDefault: false
    });
  },
  
  loadLocalOverrides: async () => {
    try {
      const overrides = await storage.loadAllLocalOverrides();
      set({ localOverrides: overrides });
    } catch (error) {
      console.error('Failed to load local overrides:', error);
    }
  },
  
  setLocalOverride: async (tabId, category, presetId) => {
    const override: LocalOverride = {
      tabId,
      category,
      presetId,
      timestamp: Date.now()
    };
    
    try {
      await storage.saveLocalOverride(override);
      set(state => ({
        localOverrides: [
          ...state.localOverrides.filter(
            o => !(o.tabId === tabId && o.category === category)
          ),
          override
        ]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to set local override' });
    }
  },
  
  clearLocalOverride: async (tabId, category) => {
    try {
      await storage.deleteLocalOverride(tabId, category);
      set(state => ({
        localOverrides: state.localOverrides.filter(
          o => !(o.tabId === tabId && o.category === category)
        )
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to clear local override' });
    }
  },
  
  getEffectiveNozzle: (tabId, category) => {
    const { presets, localOverrides } = get();
    
    // 1. Check for local override
    const override = localOverrides.find(
      o => o.tabId === tabId && o.category === category
    );
    
    if (override) {
      const preset = presets.find(p => p.id === override.presetId);
      
      // If preset was deleted/modified after override, fallback
      if (!preset || preset.updatedAt > override.timestamp) {
        // Return Admin default (invalidation handled by updatePreset/deletePreset)
        return presets.find(p => p.category === category && p.isDefault) ?? 
               presets.find(p => p.category === category) ?? 
               null;
      }
      
      return preset;
    }
    
    // 2. Fall back to Admin default for category
    return presets.find(p => p.category === category && p.isDefault) ?? 
           presets.find(p => p.category === category) ?? 
           null;
  },
  
  exportPresets: async () => {
    return await storage.exportPresets();
  },
  
  importPresets: async (json) => {
    set({ isLoading: true });
    try {
      const result = await storage.importPresets(json);
      await get().loadPresets();
      return result;
    } finally {
      set({ isLoading: false });
    }
  },
  
  seedDefaultPresets: async () => {
    const defaults = generateDefaultPresets();
    for (const preset of defaults) {
      await storage.savePreset(preset);
    }
    await get().loadPresets();
  }
}));