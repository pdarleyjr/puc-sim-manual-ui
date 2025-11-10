import localforage from 'localforage'
import type { EquipmentDefaults } from './types'
import { getFactoryDefaults } from './seeds'
import { seedBuiltInScenarios, needsSeeding } from '../scenario-admin/seeding'

const STORE_NAME = 'fps-equipment-defaults-v1'
const STORAGE_VERSION_KEY = 'fps_storage_version'

// Initialize IndexedDB store
const equipmentStore = localforage.createInstance({
  name: 'FirePumpSim',
  storeName: STORE_NAME
})

/**
 * Get current storage version from localStorage
 */
export function getStorageVersion(): number {
  const version = localStorage.getItem(STORAGE_VERSION_KEY)
  return version ? parseInt(version, 10) : 0
}

/**
 * Set storage version in localStorage
 */
export function setStorageVersion(version: number): void {
  localStorage.setItem(STORAGE_VERSION_KEY, version.toString())
}

/**
 * Load equipment defaults from storage, seeding factory defaults on first launch
 */
export async function loadEquipmentDefaults(): Promise<EquipmentDefaults> {
  const stored = await equipmentStore.getItem<EquipmentDefaults>('defaults')
  
  if (!stored) {
    // First launch - seed factory defaults
    const factory = getFactoryDefaults()
    await equipmentStore.setItem('defaults', factory)
    return factory
  }
  
  return stored
}

/**
 * Save equipment defaults to storage
 */
export async function saveEquipmentDefaults(defaults: EquipmentDefaults): Promise<void> {
  defaults.updatedAt = Date.now()
  await equipmentStore.setItem('defaults', defaults)
}

/**
 * Reset to factory defaults (user action)
 */
export async function resetToFactoryDefaults(): Promise<EquipmentDefaults> {
  const factory = getFactoryDefaults()
  await equipmentStore.setItem('defaults', factory)
  return factory
}

/**
 * Run storage migration if needed
 */
export async function migrateStorage(): Promise<void> {
  const currentVersion = getStorageVersion()
  
  if (currentVersion === 0) {
    // Version 0 → 1: Initialize equipment defaults
    await loadEquipmentDefaults()  // This will seed if not exists
    setStorageVersion(1)
    return
  }
  
  if (currentVersion === 1) {
    // Version 1 → 2: Seed built-in scenarios
    if (await needsSeeding()) {
      await seedBuiltInScenarios()
    }
    setStorageVersion(2)
    return
  }
  
  // Future migrations go here
  // if (currentVersion === 2) { ... }
}

/**
 * Export equipment defaults as JSON (for backup/sharing)
 */
export async function exportEquipmentDefaults(): Promise<string> {
  const defaults = await loadEquipmentDefaults()
  return JSON.stringify(defaults, null, 2)
}

/**
 * Import equipment defaults from JSON (for restore/sharing)
 */
export async function importEquipmentDefaults(json: string): Promise<EquipmentDefaults> {
  const imported = JSON.parse(json) as EquipmentDefaults
  imported.updatedAt = Date.now()
  await equipmentStore.setItem('defaults', imported)
  return imported
}