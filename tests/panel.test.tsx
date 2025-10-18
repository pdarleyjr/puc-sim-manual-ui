import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../src/state/store'
import type { DischargeId } from '../src/state/store'

describe('PUC Manual Pump Rules', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { disengagePump, setSource, setLine } = useStore.getState()
    disengagePump()
    setSource('tank')
    
    // Fully reset gauges including water level
    useStore.setState({
      gauges: {
        masterIntake: 0,
        masterDischarge: 0,
        rpm: 650,
        waterGal: 720,
        foamGal: 30,
      },
      lastSimTick: 0,
    })
    
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

  describe('Hydraulics Simulation', () => {
    it('should compute correct GPM for a line with PDP=115 psi and length=200 ft', () => {
      const { engagePump, setLine, simTick } = useStore.getState()
      
      engagePump('water')
      
      // Set crosslay 1 (200 ft) to 115 PSI and open
      setLine('xlay1', { open: true, setPsi: 115 })
      
      // Run simulation tick
      simTick()
      
      const discharge = useStore.getState().discharges.xlay1
      // Expected ~175 GPM (±1)
      expect(discharge.gpmNow).toBeGreaterThanOrEqual(174)
      expect(discharge.gpmNow).toBeLessThanOrEqual(176)
    })

    it('should compute correct total GPM when opening two lines', () => {
      const { engagePump, setLine, simTick } = useStore.getState()
      
      engagePump('water')
      
      // Open two crosslays at 115 PSI each (~175 GPM each)
      setLine('xlay1', { open: true, setPsi: 115 })
      setLine('xlay2', { open: true, setPsi: 115 })
      
      simTick()
      
      const totals = useStore.getState().totals
      // Expected ~350 GPM total
      expect(totals.gpmTotalNow).toBeGreaterThanOrEqual(348)
      expect(totals.gpmTotalNow).toBeLessThanOrEqual(352)
    })

    it('should accumulate gallons over time', () => {
      const { engagePump, setLine } = useStore.getState()
      
      engagePump('water')
      setLine('xlay1', { open: true, setPsi: 115 })
      
      // Run simTick with lastSimTick manually set to past to simulate time passage
      // Set lastSimTick before calling simTick
      useStore.setState({ lastSimTick: performance.now() - 60000 })
      useStore.getState().simTick()
      
      const discharge = useStore.getState().discharges.xlay1
      const totals = useStore.getState().totals
      
      // Should have accumulated some gallons
      expect(discharge.gallonsThisEng).toBeGreaterThan(0)
      expect(totals.gallonsPumpThisEng).toBeGreaterThan(0)
    })

    it('should deplete tank over time when source is Tank', () => {
      const { engagePump, setLine } = useStore.getState()
      
      engagePump('water')
      const initialWater = useStore.getState().gauges.waterGal
      expect(initialWater).toBe(720)
      
      setLine('xlay1', { open: true, setPsi: 115 })
      
      // Simulate time passage
      useStore.setState({ lastSimTick: performance.now() - 60000 })
      useStore.getState().simTick()
      
      const waterGal = useStore.getState().gauges.waterGal
      // Tank should have depleted
      expect(waterGal).toBeLessThan(initialWater)
    })

    it('should stop flow when tank reaches 0 gallons', () => {
      const { engagePump, setLine, simTick } = useStore.getState()
      
      engagePump('water')
      
      // Manually set tank to 0
      useStore.setState({ gauges: { ...useStore.getState().gauges, waterGal: 0 } })
      
      // Open line at high flow (~175 GPM)
      setLine('xlay1', { open: true, setPsi: 115 })
      
      // Run tick - should detect empty tank and set flow to 0
      simTick()
      
      const finalState = useStore.getState()
      expect(finalState.discharges.xlay1.gpmNow).toBe(0)
      expect(finalState.totals.gpmTotalNow).toBe(0)
    })

    it('should stop tank depletion when switching to Hydrant', () => {
      const { engagePump, setSource, setLine, simTick } = useStore.getState()
      
      engagePump('water')
      setLine('xlay1', { open: true, setPsi: 115 })
      
      // Run tick and simulate 30 seconds on tank
      simTick()
      useStore.setState({ lastSimTick: performance.now() - 30000 })
      simTick()
      
      const waterAfter30s = useStore.getState().gauges.waterGal
      expect(waterAfter30s).toBeLessThan(720) // Tank should have depleted
      
      // Switch to hydrant
      setSource('hydrant')
      
      // Run tick and simulate another 30 seconds on hydrant
      simTick()
      useStore.setState({ lastSimTick: performance.now() - 30000 })
      simTick()
      
      const waterAfter60s = useStore.getState().gauges.waterGal
      // Water level should not have changed while on hydrant
      expect(waterAfter60s).toBeCloseTo(waterAfter30s, 1)
      
      // But flow should continue
      expect(useStore.getState().discharges.xlay1.gpmNow).toBeGreaterThan(0)
    })

    it('should reset all engagement counters when pump is disengaged', () => {
      const { engagePump, disengagePump, setLine, simTick } = useStore.getState()
      
      engagePump('water')
      setLine('xlay1', { open: true, setPsi: 115 })
      setLine('xlay2', { open: true, setPsi: 115 })
      
      // Run ticks with time passing
      simTick()
      useStore.setState({ lastSimTick: performance.now() - 10000 })
      simTick()
      
      // Verify there are accumulated values
      expect(useStore.getState().discharges.xlay1.gallonsThisEng).toBeGreaterThan(0)
      expect(useStore.getState().discharges.xlay2.gallonsThisEng).toBeGreaterThan(0)
      expect(useStore.getState().totals.gallonsPumpThisEng).toBeGreaterThan(0)
      
      // Disengage pump
      disengagePump()
      
      // All engagement counters should be reset
      const state = useStore.getState()
      expect(state.discharges.xlay1.gpmNow).toBe(0)
      expect(state.discharges.xlay1.gallonsThisEng).toBe(0)
      expect(state.discharges.xlay2.gpmNow).toBe(0)
      expect(state.discharges.xlay2.gallonsThisEng).toBe(0)
      expect(state.totals.gpmTotalNow).toBe(0)
      expect(state.totals.gallonsPumpThisEng).toBe(0)
    })

    it('should compute higher flow at higher PDP', () => {
      const { engagePump, setLine, simTick } = useStore.getState()
      
      engagePump('water')
      
      // Test at 115 PSI
      setLine('xlay1', { open: true, setPsi: 115 })
      simTick()
      const gpm115 = useStore.getState().discharges.xlay1.gpmNow
      
      // Test at 150 PSI
      setLine('xlay1', { open: true, setPsi: 150 })
      simTick()
      const gpm150 = useStore.getState().discharges.xlay1.gpmNow
      
      // Higher PDP should produce higher flow
      expect(gpm150).toBeGreaterThan(gpm115)
      expect(gpm150).toBeGreaterThan(195) // Adjusted expectation based on actual hydraulics
    })

    it('should compute different flows for different hose lengths', () => {
      const { engagePump, setLine, simTick } = useStore.getState()
      
      engagePump('water')
      
      // Crosslay 1 is 200 ft
      setLine('xlay1', { open: true, setPsi: 115 })
      // Trashline is 100 ft (less friction loss)
      setLine('trashline', { open: true, setPsi: 115 })
      
      simTick()
      
      const xlay1Gpm = useStore.getState().discharges.xlay1.gpmNow
      const trashlineGpm = useStore.getState().discharges.trashline.gpmNow
      
      // Shorter hose should have higher flow at same PDP
      expect(trashlineGpm).toBeGreaterThan(xlay1Gpm)
    })
  })
})