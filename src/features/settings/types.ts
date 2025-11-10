export type SettingsSection = 'equipment' | 'scenarios'

export interface SettingsNavState {
  currentSection: SettingsSection
  hasUnsavedChanges: boolean
}