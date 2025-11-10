import { create } from 'zustand'
import type { SettingsSection } from './types'

interface SettingsState {
  currentSection: SettingsSection
  hasUnsavedChanges: boolean
  
  // Actions
  setSection: (section: SettingsSection) => void
  setHasUnsavedChanges: (hasChanges: boolean) => void
  saveAndNavigateHome: () => Promise<void>
}

export const useSettings = create<SettingsState>((set, get) => ({
  currentSection: 'equipment',
  hasUnsavedChanges: false,
  
  setSection: (section) => set({ currentSection: section }),
  
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  
  saveAndNavigateHome: async () => {
    // Trigger save operations from equipment/scenario stores
    // This will be called by the Back button
    const { hasUnsavedChanges } = get()
    
    if (hasUnsavedChanges) {
      // Equipment defaults auto-save on each change
      // Scenarios auto-save on each change
      // Just ensure localStorage is flushed
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    set({ hasUnsavedChanges: false })
  }
}))