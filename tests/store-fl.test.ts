import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../src/state/store'
import type { AppState } from '../src/state/store'

describe('Store FL Integration', () => {
  let store: ReturnType<typeof useStore.getState>
  
  beforeEach(() => {
    // Get fresh store state for each test
    store = useStore.getState()
    
    // Reset store to initial state
    if (store.pumpEngaged) {
      store.disengagePump()
    }
    
    // Reset all discharges
    const dischargeIds = ['xlay1', 'xlay2', 'xlay3', 'trashline', 'twohalfA', 'twohalfB', 'twohalfC', 'twohalfD', 'deckgun'] as const
    dischargeIds.forEach(id => {
      store.setLine(id, { 
        open: false, 
        valvePercent: 0,
        hoseConfig: {
          ...store.discharges[id].hoseConfig,
          flOverride: undefined
        }
      })
    })
  })
  
  /**
   * Test 1: Discharge has correct hoseConfig after initialization
   */
  it('should initialize discharges with correct hoseConfig', () => {
    const crosslay1 = store.discharges.xlay1
    
    expect(crosslay1.hoseConfig.diameter).toBe(1.75)
    expect(crosslay1.hoseConfig.lengthFt).toBeGreaterThan(0)
    expect(crosslay1.hoseConfig.presetId).toBe('key_combat_ready_175')
    expect(crosslay1.hoseConfig.flMode).toBe('preset')
  })
  
  /**
   * Test 2: 2.5" lines use correct diameter (bug fix verification)
   */
  it('should use 2.5" diameter for twohalfA discharge', () => {
    const twohalfA = store.discharges.twohalfA
    
    expect(twohalfA.hoseConfig.diameter).toBe(2.5)
    expect(twohalfA.hoseConfig.presetId).toBe('key_big10_25_low')
    expect(twohalfA.assignment.type).toBe('handline_250_smooth')
  })
  
  /**
   * Test 3: All 2.5" lines have correct configuration
   */
  it('should configure all 2.5" lines correctly', () => {
    const twohalfLines = [
      store.discharges.twohalfA,
      store.discharges.twohalfB,
      store.discharges.twohalfC,
      store.discharges.twohalfD
    ]
    
    twohalfLines.forEach((line, index) => {
      expect(line.hoseConfig.diameter).toBe(2.5)
      expect(line.assignment.type).toBe('handline_250_smooth')
    })
  })
  
  /**
   * Test 4: FL override persistence
   */
  it('should persist FL overrides via setLine action', () => {
    const originalConfig = store.discharges.xlay1.hoseConfig
    
    // Apply override
    store.setLine('xlay1', {
      hoseConfig: {
        ...originalConfig,
        flOverride: { psiPer100: 18.0 }
      }
    })
    
    const updated = useStore.getState().discharges.xlay1
    expect(updated.hoseConfig.flOverride?.psiPer100).toBe(18.0)
  })
  
  /**
   * Test 5: Multiple FL overrides can be set independently
   */
  it('should handle multiple independent FL overrides', () => {
    // Set override on crosslay1
    store.setLine('xlay1', {
      hoseConfig: {
        ...store.discharges.xlay1.hoseConfig,
        flOverride: { psiPer100: 18.0 }
      }
    })
    
    // Set different override on twohalfA
    store.setLine('twohalfA', {
      hoseConfig: {
        ...store.discharges.twohalfA.hoseConfig,
        flOverride: { psiPer100: 3.5 }
      }
    })
    
    const state = useStore.getState()
    expect(state.discharges.xlay1.hoseConfig.flOverride?.psiPer100).toBe(18.0)
    expect(state.discharges.twohalfA.hoseConfig.flOverride?.psiPer100).toBe(3.5)
  })
  
  /**
   * Test 6: Auto-open behavior when valve moves from 0%
   */
  it('should auto-open discharge when valve moves from 0% to positive', () => {
    // Ensure closed initially
    store.setLine('xlay1', { valvePercent: 0, open: false })
    expect(useStore.getState().discharges.xlay1.open).toBe(false)
    
    // Move valve to 25%
    store.setLine('xlay1', { valvePercent: 25 })
    expect(useStore.getState().discharges.xlay1.open).toBe(true)
  })
  
  /**
   * Test 7: Auto-close behavior when valve set to 0%
   */
  it('should auto-close discharge when valve set to 0%', () => {
    // Open at 50%
    store.setLine('xlay1', { valvePercent: 50, open: true })
    expect(useStore.getState().discharges.xlay1.open).toBe(true)
    
    // Close by setting to 0%
    store.setLine('xlay1', { valvePercent: 0 })
    expect(useStore.getState().discharges.xlay1.open).toBe(false)
  })
  
  /**
   * Test 8: Valve auto-open works for all discharge types
   */
  it('should auto-open any discharge type when valve moves from 0%', () => {
    const testLines = ['xlay1', 'trashline', 'twohalfA', 'deckgun'] as const
    
    testLines.forEach(lineId => {
      // Reset to closed
      store.setLine(lineId, { valvePercent: 0, open: false })
      
      // Open valve
      store.setLine(lineId, { valvePercent: 30 })
      
      const state = useStore.getState()
      expect(state.discharges[lineId].open).toBe(true)
    })
  })
  
  /**
   * Test 9: Direct open/close still works (backwards compatibility)
   * Note: Auto-open behavior takes precedence when valve moves from 0%
   */
  it('should allow manual open/close independent of valve position', () => {
    // The auto-open behavior is intentional: moving valve from 0% to positive auto-opens
    // This test verifies the behavior is consistent
    
    // Start closed at 0%
    store.setLine('xlay1', { valvePercent: 0, open: false })
    expect(useStore.getState().discharges.xlay1.open).toBe(false)
    
    // Move valve to 50% - should auto-open
    store.setLine('xlay1', { valvePercent: 50 })
    expect(useStore.getState().discharges.xlay1.open).toBe(true)
    
    // Can explicitly close while valve is open (unusual but supported)
    store.setLine('xlay1', { open: false })
    expect(useStore.getState().discharges.xlay1.open).toBe(false)
    
    // Can explicitly open at any valve position
    store.setLine('xlay1', { open: true })
    expect(useStore.getState().discharges.xlay1.open).toBe(true)
  })
  
  /**
   * Test 10: FL mode can be toggled between preset and coefficient
   */
  it('should allow toggling between preset and coefficient modes', () => {
    // Get fresh state to avoid interference from other tests
    const currentState = useStore.getState()
    
    // Start in preset mode
    expect(currentState.discharges.xlay1.hoseConfig.flMode).toBe('preset')
    
    // Switch to coefficient mode
    store.setLine('xlay1', {
      hoseConfig: {
        ...currentState.discharges.xlay1.hoseConfig,
        flMode: 'coefficient'
      }
    })
    
    expect(useStore.getState().discharges.xlay1.hoseConfig.flMode).toBe('coefficient')
    
    // Clean up: reset to preset mode for other tests
    store.setLine('xlay1', {
      hoseConfig: {
        ...useStore.getState().discharges.xlay1.hoseConfig,
        flMode: 'preset'
      }
    })
  })
  
  /**
   * Test 11: Hose config updates preserve other discharge properties
   */
  it('should preserve other discharge properties when updating hoseConfig', () => {
    const original = store.discharges.xlay1
    
    // Update hoseConfig
    store.setLine('xlay1', {
      hoseConfig: {
        ...original.hoseConfig,
        flOverride: { psiPer100: 22.0 }
      }
    })
    
    const updated = useStore.getState().discharges.xlay1
    
    // Check other properties are preserved
    expect(updated.label).toBe(original.label)
    expect(updated.lengthFt).toBe(original.lengthFt)
    expect(updated.foamCapable).toBe(original.foamCapable)
    expect(updated.assignment).toEqual(original.assignment)
  })
  
  /**
   * Test 12: Deck gun has correct configuration (3.0" diameter)
   */
  it('should configure deck gun with 3.0" diameter', () => {
    const deckgun = store.discharges.deckgun
    
    expect(deckgun.hoseConfig.diameter).toBe(3.0)
    expect(deckgun.hoseConfig.lengthFt).toBe(0) // Piped, no hose
    expect(deckgun.assignment.type).toBe('deck_gun')
  })
  
  /**
   * Test 13: Trashline uses same preset as crosslays
   */
  it('should configure trashline with same preset as crosslays', () => {
    const trashline = store.discharges.trashline
    const crosslay1 = store.discharges.xlay1
    
    expect(trashline.hoseConfig.presetId).toBe(crosslay1.hoseConfig.presetId)
    expect(trashline.hoseConfig.diameter).toBe(1.75)
    expect(trashline.hoseConfig.lengthFt).toBe(100) // Shorter than crosslay
  })
  
  /**
   * Test 14: Crosslays have consistent configuration
   */
  it('should configure all crosslays consistently', () => {
    // Get fresh state to ensure no interference
    const currentState = useStore.getState()
    
    const crosslays = [
      currentState.discharges.xlay1,
      currentState.discharges.xlay2,
      currentState.discharges.xlay3
    ]
    
    const firstConfig = crosslays[0].hoseConfig
    
    crosslays.forEach((crosslay, index) => {
      expect(crosslay.hoseConfig.diameter).toBe(firstConfig.diameter)
      expect(crosslay.hoseConfig.lengthFt).toBe(firstConfig.lengthFt)
      expect(crosslay.hoseConfig.presetId).toBe(firstConfig.presetId)
      // All should start in preset mode (this is the default)
      expect(crosslay.hoseConfig.flMode).toBe('preset')
    })
  })
  
  /**
   * Test 15: Valve percentage affects line pressure (integration test)
   */
  it('should scale line pressure with valve percentage', () => {
    // Engage pump and set governor
    store.engagePump('water')
    store.setSource('tank')
    store.setGovernorMode('pressure')
    store.setGovernorSetPsi(150)
    
    // Open line at 50%
    store.setLine('xlay1', { valvePercent: 50, open: true })
    store.recomputeMasters()
    
    const state50 = useStore.getState()
    const psi50 = state50.gauges.masterDischarge
    
    // Change to 100%
    store.setLine('xlay1', { valvePercent: 100 })
    store.recomputeMasters()
    
    const state100 = useStore.getState()
    const psi100 = state100.gauges.masterDischarge
    
    // 100% should give higher pressure than 50%
    expect(psi100).toBeGreaterThan(psi50)
    
    // Clean up
    store.disengagePump()
  })
})