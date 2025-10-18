import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../src/state/store'
import type { DischargeId } from '../src/state/store'

describe('PUC Manual Pump Rules', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { disengagePump, setSource, setLine } = useStore.getState()
    disengagePump()
    setSource('tank')
    // Reset all discharge lines
    Object.keys(useStore.getState().discharges).forEach(id => {
      setLine(id as DischargeId, { open: false, setPsi: 0 })
    })
  })

  describe('Master Discharge Calculation', () => {
    it('should equal the highest setPsi among open lines', () => {
      const { engagePump, setLine } = useStore.getState()
      
      engagePump('water')
      
      // Open first line at 100 PSI
      setLine('xlay1', { open: true, setPsi: 100 })
      expect(useStore.getState().gauges.masterDischarge).toBe(100)
      
      // Open second line at higher pressure
      setLine('xlay2', { open: true, setPsi: 150 })
      expect(useStore.getState().gauges.masterDischarge).toBe(150)
      
      // Open third line at lower pressure (should still be 150)
      setLine('xlay3', { open: true, setPsi: 75 })
      expect(useStore.getState().gauges.masterDischarge).toBe(150)
    })

    it('should be 0 when no lines are open', () => {
      const { engagePump, setLine } = useStore.getState()
      
      engagePump('water')
      
      // Set pressure but keep lines closed
      setLine('xlay1', { setPsi: 100 })
      setLine('xlay2', { setPsi: 150 })
      
      expect(useStore.getState().gauges.masterDischarge).toBe(0)
    })

    it('should be capped at 400 PSI', () => {
      const { engagePump, setLine } = useStore.getState()
      
      engagePump('water')
      setLine('xlay1', { open: true, setPsi: 400 })
      
      expect(useStore.getState().gauges.masterDischarge).toBe(400)
    })
  })

  describe('Source Switching (Tank/Hydrant)', () => {
    it('should set masterIntake to 50 PSI when switching from Tank to Hydrant (if currently 0)', () => {
      const { engagePump, setSource, gauges } = useStore.getState()
      
      engagePump('water')
      expect(gauges.masterIntake).toBe(0) // Tank default
      
      setSource('hydrant')
      expect(useStore.getState().gauges.masterIntake).toBe(50)
    })

    it('should lock masterIntake at 0 when source is Tank', () => {
      const { engagePump, setSource, setIntakePsi } = useStore.getState()
      
      engagePump('water')
      setSource('tank')
      
      // Try to set intake (should be ignored)
      setIntakePsi(100)
      expect(useStore.getState().gauges.masterIntake).toBe(0)
    })

    it('should allow adjusting masterIntake when source is Hydrant', () => {
      const { engagePump, setSource, setIntakePsi } = useStore.getState()
      
      engagePump('water')
      setSource('hydrant')
      
      setIntakePsi(75)
      expect(useStore.getState().gauges.masterIntake).toBe(75)
      
      setIntakePsi(150)
      expect(useStore.getState().gauges.masterIntake).toBe(150)
    })

    it('should default to 50 PSI when switching back to Hydrant from Tank', () => {
      const { engagePump, setSource, setIntakePsi } = useStore.getState()
      
      engagePump('water')
      setSource('hydrant')
      setIntakePsi(100)
      expect(useStore.getState().gauges.masterIntake).toBe(100)
      
      // Switch to tank (locks at 0)
      setSource('tank')
      expect(useStore.getState().gauges.masterIntake).toBe(0)
      
      // Switch back to hydrant (defaults to 50 since intake is now 0)
      setSource('hydrant')
      expect(useStore.getState().gauges.masterIntake).toBe(50)
    })
  })

  describe('Master Intake Independence', () => {
    it('should not affect Master Discharge when Master Intake changes', () => {
      const { engagePump, setSource, setLine, setIntakePsi } = useStore.getState()
      
      engagePump('water')
      setSource('hydrant')
      
      // Set a discharge line
      setLine('xlay1', { open: true, setPsi: 125 })
      const initialDischarge = useStore.getState().gauges.masterDischarge
      expect(initialDischarge).toBe(125)
      
      // Change intake pressure
      setIntakePsi(100)
      
      // Master discharge should remain unchanged
      expect(useStore.getState().gauges.masterDischarge).toBe(initialDischarge)
    })
  })

  describe('RPM Calculation (Affinity Laws)', () => {
    it('should increase with master discharge', () => {
      const { engagePump, setLine, recomputeMasters } = useStore.getState()
      
      engagePump('water')
      const baseRpm = useStore.getState().targetRpm
      
      // Open line at 100 PSI
      setLine('xlay1', { open: true, setPsi: 100 })
      recomputeMasters()
      const rpm100 = useStore.getState().targetRpm
      
      // Open line at 200 PSI
      setLine('xlay1', { open: true, setPsi: 200 })
      recomputeMasters()
      const rpm200 = useStore.getState().targetRpm
      
      expect(rpm100).toBeGreaterThan(baseRpm)
      expect(rpm200).toBeGreaterThan(rpm100)
    })

    it('should be slightly lower on hydrant with positive intake for same discharge', () => {
      const { engagePump, setSource, setLine, setIntakePsi, recomputeMasters } = useStore.getState()
      
      engagePump('water')
      
      // Tank mode with discharge
      setSource('tank')
      setLine('xlay1', { open: true, setPsi: 150 })
      recomputeMasters()
      const tankRpm = useStore.getState().targetRpm
      
      // Hydrant mode with same discharge and positive intake
      setSource('hydrant')
      setIntakePsi(50)
      setLine('xlay1', { open: true, setPsi: 150 })
      recomputeMasters()
      const hydrantRpm = useStore.getState().targetRpm
      
      // Hydrant RPM should be lower due to incoming pressure relief
      expect(hydrantRpm).toBeLessThan(tankRpm)
    })

    it('should not exceed MAX_RPM (2200)', () => {
      const { engagePump, setLine, recomputeMasters } = useStore.getState()
      
      engagePump('water')
      
      // Set very high discharge
      setLine('xlay1', { open: true, setPsi: 400 })
      recomputeMasters()
      
      expect(useStore.getState().targetRpm).toBeLessThanOrEqual(2200)
    })

    it('should return to idle when pump is disengaged', () => {
      const { engagePump, disengagePump, setLine, recomputeMasters } = useStore.getState()
      
      engagePump('water')
      setLine('xlay1', { open: true, setPsi: 200 })
      recomputeMasters()
      
      expect(useStore.getState().targetRpm).toBeGreaterThan(650)
      
      disengagePump()
      expect(useStore.getState().targetRpm).toBe(650) // ENGINE_IDLE
    })
  })

  describe('Sound System', () => {
    it('should start with sound disabled', () => {
      expect(useStore.getState().soundOn).toBe(false)
    })

    it('should allow toggling sound on and off', () => {
      const { setSoundOn } = useStore.getState()
      
      setSoundOn(true)
      expect(useStore.getState().soundOn).toBe(true)
      
      setSoundOn(false)
      expect(useStore.getState().soundOn).toBe(false)
    })

    // Note: Testing actual AudioContext creation requires mocking and user gestures
    // The Web Audio hook will only create context when soundOn=true AND after a gesture
  })
})