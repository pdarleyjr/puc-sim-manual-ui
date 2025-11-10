import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import localforage from 'localforage'
import {
  getStorageVersion,
  setStorageVersion,
  loadEquipmentDefaults,
  saveEquipmentDefaults,
  resetToFactoryDefaults,
  migrateStorage
} from '../src/features/equipment-config/storage'
import { getFactoryDefaults } from '../src/features/equipment-config/seeds'

describe('Equipment Config Storage', () => {
  beforeEach(async () => {
    // Clear storage before each test
    localStorage.clear()
    // Clear all IndexedDB stores
    await localforage.clear()
    
    // Also clear the specific equipment store
    const equipmentStore = localforage.createInstance({
      name: 'FirePumpSim',
      storeName: 'fps-equipment-defaults-v1'
    })
    await equipmentStore.clear()
  })
  
  describe('Storage Version', () => {
    it('returns 0 for new installation', () => {
      expect(getStorageVersion()).toBe(0)
    })
    
    it('persists version across reads', () => {
      setStorageVersion(1)
      expect(getStorageVersion()).toBe(1)
    })
  })
  
  describe('Equipment Defaults', () => {
    it('seeds factory defaults on first load', async () => {
      const defaults = await loadEquipmentDefaults()
      
      expect(defaults.discharges['xlay1'].label).toBe('Primary Crosslay')
      expect(defaults.discharges['xlay1'].hose.lengthFt).toBe(200)
      expect(defaults.discharges['xlay1'].nozzle?.ratedGPM).toBe(175)
      expect(defaults.discharges['trashline'].hose.lengthFt).toBe(100)
    })
    
    it('persists custom defaults', async () => {
      const defaults = await loadEquipmentDefaults()
      defaults.discharges['xlay1'].label = 'Custom Crosslay'
      defaults.discharges['xlay1'].hose.lengthFt = 250
      
      await saveEquipmentDefaults(defaults)
      
      const reloaded = await loadEquipmentDefaults()
      expect(reloaded.discharges['xlay1'].label).toBe('Custom Crosslay')
      expect(reloaded.discharges['xlay1'].hose.lengthFt).toBe(250)
    })
    
    it('resets to factory defaults', async () => {
      // First load and modify
      const defaults = await loadEquipmentDefaults()
      defaults.discharges['xlay1'].hose.lengthFt = 999
      await saveEquipmentDefaults(defaults)
      
      // Verify it was saved
      const modified = await loadEquipmentDefaults()
      expect(modified.discharges['xlay1'].hose.lengthFt).toBe(999)
      
      // Now reset
      const reset = await resetToFactoryDefaults()
      expect(reset.discharges['xlay1'].hose.lengthFt).toBe(200)
      
      // Verify reset persisted
      const reloaded = await loadEquipmentDefaults()
      expect(reloaded.discharges['xlay1'].hose.lengthFt).toBe(200)
    })
  })
  
  describe('Migration', () => {
    it('runs migration on version 0', async () => {
      expect(getStorageVersion()).toBe(0)
      await migrateStorage()
      expect(getStorageVersion()).toBe(1)
      
      const defaults = await loadEquipmentDefaults()
      expect(defaults.discharges).toBeDefined()
    })
    
    it('skips migration if already at current version', async () => {
      setStorageVersion(2)  // Current version is now 2 (after Phase 3 scenario seeding)
      await migrateStorage()
      expect(getStorageVersion()).toBe(2)
    })
  })
  
  describe('Factory Defaults Validation', () => {
    it('includes all 8 discharge types', () => {
      const factory = getFactoryDefaults()
      expect(Object.keys(factory.discharges).length).toBe(8)
      expect(factory.discharges['xlay1']).toBeDefined()
      expect(factory.discharges['xlay2']).toBeDefined()
      expect(factory.discharges['xlay3']).toBeDefined()
      expect(factory.discharges['trashline']).toBeDefined()
      expect(factory.discharges['twohalfA']).toBeDefined()
      expect(factory.discharges['twohalfB']).toBeDefined()
      expect(factory.discharges['twohalfC']).toBeDefined()
      expect(factory.discharges['twohalfD']).toBeDefined()
    })
    
    it('validates Primary Crosslay spec', () => {
      const factory = getFactoryDefaults()
      const xlay1 = factory.discharges['xlay1']
      
      expect(xlay1.hose.diameter).toBe(1.75)
      expect(xlay1.hose.lengthFt).toBe(200)
      expect(xlay1.nozzle?.kind).toBe('fog_fixed')
      expect(xlay1.nozzle?.ratedGPM).toBe(175)
      expect(xlay1.nozzle?.ratedNPpsi).toBe(75)
    })
    
    it('validates Trash Line spec', () => {
      const factory = getFactoryDefaults()
      const trash = factory.discharges['trashline']
      
      expect(trash.hose.lengthFt).toBe(100)
      expect(trash.nozzle?.ratedGPM).toBe(175)
      expect(trash.nozzle?.ratedNPpsi).toBe(75)
    })
    
    it('validates Skid Load spec (2.5" A)', () => {
      const factory = getFactoryDefaults()
      const skid = factory.discharges['twohalfA']
      
      expect(skid.hose.diameter).toBe(3.0)
      expect(skid.nozzle?.kind).toBe('smooth_bore')
      expect(skid.nozzle?.tipDiameterIn).toBe(0.875)  // 7/8"
      expect(skid.nozzle?.ratedNPpsi).toBe(50)
      expect(skid.nozzle?.ratedGPM).toBe(150)
    })
    
    it('validates FDC spec (2.5" C) - no nozzle', () => {
      const factory = getFactoryDefaults()
      const fdc = factory.discharges['twohalfC']
      
      expect(fdc.hose.diameter).toBe(3.0)
      expect(fdc.nozzle).toBeNull()
    })
  })
})