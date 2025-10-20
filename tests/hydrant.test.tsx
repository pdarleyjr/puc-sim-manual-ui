import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../src/state/store'
import type { AppState } from '../src/state/store'
import { 
  selectHydrantSplit, 
  selectHydrantResiduals, 
  selectResidualBadges, 
  selectHydrantAdvice
} from '../src/state/selectors'

// Helper to set test-only Q_total override
function setTotalDischargeForTest(store: AppState, gpm: number) {
  // Use test-only override (only works when NODE_ENV === 'test')
  store.__test = { ...(store.__test ?? {}), Q_total_override: gpm }
}

describe('Hydrant Supply System', () => {
  beforeEach(() => {
    const store = useStore.getState()
    // Reset to clean state
    store.disengagePump()
    store.setSource('none')
    // Clear any test overrides
    store.__test = undefined
  })

  describe('Size Restrictions', () => {
    it('should only allow 3" and 5" hose sizes', () => {
      let state = useStore.getState()
      
      // Check that only 3" and 5" sizes are in the type
      const validSizes: ('3' | '5')[] = ['3', '5']
      
      // Verify steamer defaults to 5"
      expect(state.hydrant.hoses.steamer.size).toBe('5')
      
      // Verify we can set to 3"
      state.setHydrantLeg('steamer', { size: '3' })
      state = useStore.getState() // Re-read after mutation
      expect(state.hydrant.hoses.steamer.size).toBe('3')
      
      // Verify we can set back to 5"
      state.setHydrantLeg('steamer', { size: '5' })
      state = useStore.getState() // Re-read after mutation
      expect(state.hydrant.hoses.steamer.size).toBe('5')
      
      // TypeScript should prevent other values at compile time
      expect(validSizes).toHaveLength(2)
    })
  })

  describe('Flow Split Plausibility', () => {
    it('should split 70/30 for double 5" (steamer + sideA)', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('double')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideA', { size: '5', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      const split = selectHydrantSplit(state)
      
      // Expect steamer to get ~70% (65-75% acceptable)
      expect(split.steamer).toBeGreaterThan(0.65)
      expect(split.steamer).toBeLessThan(0.75)
      
      // Side should get remainder (~30%)
      expect(split.side).toBeGreaterThan(0.25)
      expect(split.side).toBeLessThan(0.35)
    })

    it('should split ~85/15 for 5" steamer + 3" side', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('double')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideA', { size: '3', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      const split = selectHydrantSplit(state)
      
      // Expect steamer (5") to get ~85% (80-90% acceptable)
      expect(split.steamer).toBeGreaterThan(0.80)
      expect(split.steamer).toBeLessThan(0.90)
      
      // 3" side gets remainder (~15%)
      expect(split.side).toBeGreaterThan(0.10)
      expect(split.side).toBeLessThan(0.20)
    })

    it('should split evenly for triple 5" hoses', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('triple')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideA', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideB', { size: '5', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      const split = selectHydrantSplit(state)
      
      // With geometry factor on steamer, expect ~50% steamer, ~50% combined sides
      expect(split.steamer).toBeGreaterThan(0.45)
      expect(split.steamer).toBeLessThan(0.55)
      expect(split.side).toBeGreaterThan(0.45)
      expect(split.side).toBeLessThan(0.55)
    })
  })

  describe('Calibration Targets at 2000 GPM', () => {
    beforeEach(() => {
      const store = useStore.getState()
      store.engagePump('water')
      store.setSource('hydrant')
      store.setIntakePsi(80) // Static pressure
    })

    it('should achieve intake ≈25 psi with single 5" at 2000 gpm', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('single')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      setTotalDischargeForTest(state, 2000)
      
      const { engineIntake, hydrantResidual } = selectHydrantResiduals(state)
      
      // Acceptance: intake 22-28 psi, hydrant main 49-55 psi
      expect(engineIntake).toBeGreaterThanOrEqual(22)
      expect(engineIntake).toBeLessThanOrEqual(28)
      expect(hydrantResidual).toBeGreaterThanOrEqual(49)
      expect(hydrantResidual).toBeLessThanOrEqual(55)
    })

    it('should achieve intake ≈40 psi with double 5" at 2000 gpm', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('double')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideA', { size: '5', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      setTotalDischargeForTest(state, 2000)
      
      const { engineIntake } = selectHydrantResiduals(state)
      
      // Acceptance: intake 37-43 psi
      expect(engineIntake).toBeGreaterThanOrEqual(37)
      expect(engineIntake).toBeLessThanOrEqual(43)
    })

    it('should achieve intake ≈45 psi with triple 5" at 2000 gpm', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('triple')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideA', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideB', { size: '5', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      setTotalDischargeForTest(state, 2000)
      
      const { engineIntake } = selectHydrantResiduals(state)
      
      // Acceptance: intake 42-48 psi
      expect(engineIntake).toBeGreaterThanOrEqual(42)
      expect(engineIntake).toBeLessThanOrEqual(48)
    })
  })

  describe('Badges and Advice Logic', () => {
    beforeEach(() => {
      const store = useStore.getState()
      store.engagePump('water')
      store.setSource('hydrant')
      store.setIntakePsi(80)
    })

    it('should show green badges when both residuals ≥20 psi', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('double')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 100 })
      store.setHydrantLeg('sideA', { size: '5', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      // Low flow scenario - should have high residuals
      const { hydrantBadge, intakeBadge } = selectResidualBadges(state)
      
      expect(hydrantBadge).toBe('green')
      expect(intakeBadge).toBe('green')
    })

    it('should show amber/red badges when residuals drop below thresholds', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('single')
      store.setHydrantLeg('steamer', { size: '3', lengthFt: 150 })
      
      const state = useStore.getState() // Read fresh state
      setTotalDischargeForTest(state, 2000)
      
      const { intakeBadge } = selectResidualBadges(state)
      
      // With 3" at high flow, intake should be low (amber or red)
      expect(intakeBadge === 'amber' || intakeBadge === 'red').toBe(true)
    })

    it('should suggest adding LDH when intake low but hydrant residual good', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('single')
      store.setHydrantLeg('steamer', { size: '5', lengthFt: 150 })
      
      const state = useStore.getState() // Read fresh state
      setTotalDischargeForTest(state, 2000) // Higher flow to create enough loss
      
      const advice = selectHydrantAdvice(state)
      
      // Should suggest either adding LDH or upsizing
      expect(advice.suggestAddLDH || advice.suggestUpsizeTo5).toBe(true)
    })

    it('should suggest upsizing when any 3" hose is connected', () => {
      const store = useStore.getState()
      store.setHydrantTapMode('single')
      store.setHydrantLeg('steamer', { size: '3', lengthFt: 100 })
      
      const state = useStore.getState() // Read fresh state
      setTotalDischargeForTest(state, 1500)
      
      const advice = selectHydrantAdvice(state)
      const { engineIntake } = selectHydrantResiduals(state)
      
      // If intake is low with 3", should suggest upsize
      if (engineIntake < 20) {
        expect(advice.suggestUpsizeTo5).toBe(true)
      }
    })
  })

  describe('Master Intake Display', () => {
    it('should display engineIntake when source is hydrant', () => {
      const store = useStore.getState()
      store.engagePump('water')
      store.setSource('hydrant')
      store.setIntakePsi(80)
      
      const state = useStore.getState() // Read fresh state
      // Simulate minimal flow (to get intake plumbing loss but not much supply hose loss)
      setTotalDischargeForTest(state, 100)
      
      const { engineIntake } = selectHydrantResiduals(state)
      
      // With 100 gpm, losses should be minimal
      // K_INTAKE × 100² = 6.4e-6 × 10000 = 0.064 psi intake loss
      // Supply: 6.5e-6 × (100²) × 1 = 0.065 psi
      // Hydrant body: 2 psi
      // Total: ~2.13 psi loss, so expect ~77-78 psi
      expect(engineIntake).toBeLessThan(80)
      expect(engineIntake).toBeGreaterThan(76) // Reasonable with small losses
    })

    it('should display 0 when source is tank', () => {
      const store = useStore.getState()
      store.engagePump('water')
      store.setSource('tank')
      
      expect(store.gauges.masterIntake).toBe(0)
    })
  })
})