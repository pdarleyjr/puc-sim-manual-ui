import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../src/state/store'
import type { DischargeId } from '../src/state/store'

describe('PUC Manual Pump Rules', () => {
  beforeEach(() => {
    // Reset store to initial state
    const { disengagePump, setSource, setLine } = useStore.getState()
    disengagePump()
    setSource('none')
    
    // Fully reset gauges including water level
    useStore.setState({
      gauges: {
        masterIntake: 0,
        masterDischarge: 0,
        rpm: 650,
        waterGal: 720,
        foamGal: 30,
        pumpTempF: 120,
      },
      governor: {
        enabled: false,
        mode: 'pressure',
        setPsi: 50,
        setRpm: 1200,
      },
      lastSimTick: 0,
    })
    
    // Reset all discharge lines
    Object.keys(useStore.getState().discharges).forEach(id => {
      setLine(id as DischargeId, { open: false, valvePercent: 0 })
    })
  })

  describe('Master Discharge Calculation', () => {
    it('should equal the highest setPsi among open lines', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      
      // Open first line at 100% valve with governor at 100 PSI
      setGovernorSetPsi(100)
      setLine('xlay1', { open: true, valvePercent: 100 })
      expect(useStore.getState().gauges.masterDischarge).toBe(100)
      
      // Increase governor to 150 PSI
      setGovernorSetPsi(150)
      expect(useStore.getState().gauges.masterDischarge).toBe(150)
      
      // Open another line at 50% valve (75 PSI)
      setLine('xlay3', { open: true, valvePercent: 50 })
      expect(useStore.getState().gauges.masterDischarge).toBe(150)
    })

    it('should be 0 when no lines are open', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(150)
      
      // Set valve but keep lines closed
      setLine('xlay1', { valvePercent: 100 })
      setLine('xlay2', { valvePercent: 100 })
      
      expect(useStore.getState().gauges.masterDischarge).toBe(0)
    })

    it('should be capped at 400 PSI', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(300)
      setLine('xlay1', { open: true, valvePercent: 100 })
      
      expect(useStore.getState().gauges.masterDischarge).toBeLessThanOrEqual(400)
    })
  })

  describe('Source Switching (Tank/Hydrant)', () => {
    it('should set masterIntake to 50 PSI when switching from Tank to Hydrant (if currently 0)', () => {
      const { engagePump, setSource, gauges } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      expect(gauges.masterIntake).toBe(0) // Tank default
      
      setSource('hydrant')
      expect(useStore.getState().gauges.masterIntake).toBe(50)
    })

    it('should lock masterIntake at 0 when source is Tank', () => {
      const { engagePump, setSource, setIntakePsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setSource('tank')
      
      // Try to set intake (should be ignored)
      setIntakePsi(100)
      expect(useStore.getState().gauges.masterIntake).toBe(0)
    })

    it('should allow adjusting masterIntake when source is Hydrant', () => {
      const { engagePump, setSource, setIntakePsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setSource('hydrant')
      
      setIntakePsi(75)
      expect(useStore.getState().gauges.masterIntake).toBe(75)
      
      setIntakePsi(150)
      expect(useStore.getState().gauges.masterIntake).toBe(150)
    })

    it('should default to 50 PSI when switching back to Hydrant from Tank', () => {
      const { engagePump, setSource, setIntakePsi } = useStore.getState()
      
      setSource('tank')
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
      const { engagePump, setSource, setLine, setIntakePsi, setGovernorMode, setGovernorSetPsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setSource('hydrant')
      
      // Set governor high enough that P_base changes won't affect it
      // With intake at 100, P_base would be 150, so set governor to 200
      setGovernorMode('pressure')
      setGovernorSetPsi(200)
      setLine('xlay1', { open: true, valvePercent: 100 })
      const initialDischarge = useStore.getState().gauges.masterDischarge
      expect(initialDischarge).toBe(200)
      
      // Change intake pressure from 50 to 100 (P_base goes from 100 to 150)
      setIntakePsi(100)
      
      // Master discharge should remain 200 (governor setpoint is still above P_base)
      expect(useStore.getState().gauges.masterDischarge).toBe(200)
    })
  })

  describe('RPM Calculation (Affinity Laws)', () => {
    it('should increase with master discharge', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      const baseRpm = useStore.getState().targetRpm
      
      // Open line at 100% with governor at 100 PSI
      setGovernorSetPsi(100)
      setLine('xlay1', { open: true, valvePercent: 100 })
      recomputeMasters()
      const rpm100 = useStore.getState().targetRpm
      
      // Increase governor to 200 PSI
      setGovernorSetPsi(200)
      recomputeMasters()
      const rpm200 = useStore.getState().targetRpm
      
      expect(rpm100).toBeGreaterThan(baseRpm)
      expect(rpm200).toBeGreaterThan(rpm100)
    })

    it('should be slightly lower on hydrant with positive intake for same discharge', () => {
      const { engagePump, setSource, setLine, setIntakePsi, setGovernorMode, setGovernorSetPsi, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      
      // Tank mode with discharge at 150 PSI
      setSource('tank')
      setGovernorSetPsi(150)
      setLine('xlay1', { open: true, valvePercent: 100 })
      recomputeMasters()
      const tankRpm = useStore.getState().targetRpm
      
      // Hydrant mode with same discharge and positive intake
      setSource('hydrant')
      setIntakePsi(50)
      setGovernorSetPsi(150)
      setLine('xlay1', { open: true, valvePercent: 100 })
      recomputeMasters()
      const hydrantRpm = useStore.getState().targetRpm
      
      // Hydrant RPM should be lower due to incoming pressure relief
      expect(hydrantRpm).toBeLessThan(tankRpm)
    })

    it('should not exceed MAX_RPM (2200)', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      
      // Set very high discharge
      setGovernorSetPsi(300)
      setLine('xlay1', { open: true, valvePercent: 100 })
      recomputeMasters()
      
      expect(useStore.getState().targetRpm).toBeLessThanOrEqual(2200)
    })

    it('should return to idle when pump is disengaged', () => {
      const { engagePump, disengagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(200)
      setLine('xlay1', { open: true, valvePercent: 100 })
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
    it('should compute correct GPM for a line with valve at 100% and governor at 115 psi', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, simTick } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(115)
      
      // Set crosslay 1 (200 ft) to 100% open
      setLine('xlay1', { open: true, valvePercent: 100 })
      
      // Run simulation tick
      simTick()
      
      const discharge = useStore.getState().discharges.xlay1
      // Expected ~175 GPM (±1)
      expect(discharge.gpmNow).toBeGreaterThanOrEqual(174)
      expect(discharge.gpmNow).toBeLessThanOrEqual(176)
    })

    it('should compute correct total GPM when opening two lines', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, simTick } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(115)
      
      // Open two crosslays at 100% each (~175 GPM each)
      setLine('xlay1', { open: true, valvePercent: 100 })
      setLine('xlay2', { open: true, valvePercent: 100 })
      
      simTick()
      
      const totals = useStore.getState().totals
      // Expected ~350 GPM total
      expect(totals.gpmTotalNow).toBeGreaterThanOrEqual(348)
      expect(totals.gpmTotalNow).toBeLessThanOrEqual(352)
    })

    it('should accumulate gallons over time', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(115)
      setLine('xlay1', { open: true, valvePercent: 100 })
      
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
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      const initialWater = useStore.getState().gauges.waterGal
      expect(initialWater).toBe(720)
      
      setGovernorSetPsi(115)
      setLine('xlay1', { open: true, valvePercent: 100 })
      
      // Simulate time passage
      useStore.setState({ lastSimTick: performance.now() - 60000 })
      useStore.getState().simTick()
      
      const waterGal = useStore.getState().gauges.waterGal
      // Tank should have depleted
      expect(waterGal).toBeLessThan(initialWater)
    })

    it('should stop flow when tank reaches 0 gallons', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, simTick } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      
      // Manually set tank to 0
      useStore.setState({ gauges: { ...useStore.getState().gauges, waterGal: 0 } })
      
      // Open line at high flow (~175 GPM)
      setGovernorSetPsi(115)
      setLine('xlay1', { open: true, valvePercent: 100 })
      
      // Run tick - should detect empty tank and set flow to 0
      simTick()
      
      const finalState = useStore.getState()
      expect(finalState.discharges.xlay1.gpmNow).toBe(0)
      expect(finalState.totals.gpmTotalNow).toBe(0)
    })

    it('should stop tank depletion when switching to Hydrant', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, simTick } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(115)
      setLine('xlay1', { open: true, valvePercent: 100 })
      
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
      const { engagePump, disengagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, simTick } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(115)
      setLine('xlay1', { open: true, valvePercent: 100 })
      setLine('xlay2', { open: true, valvePercent: 100 })
      
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
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, simTick } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      
      // Test at 115 PSI
      setGovernorSetPsi(115)
      setLine('xlay1', { open: true, valvePercent: 100 })
      simTick()
      const gpm115 = useStore.getState().discharges.xlay1.gpmNow
      
      // Test at 150 PSI
      setGovernorSetPsi(150)
      simTick()
      const gpm150 = useStore.getState().discharges.xlay1.gpmNow
      
      // Higher PDP should produce higher flow
      expect(gpm150).toBeGreaterThan(gpm115)
      expect(gpm150).toBeGreaterThan(195) // Adjusted expectation based on actual hydraulics
    })

    it('should compute different flows for different hose lengths', () => {
      const { engagePump, setSource, setLine, setGovernorMode, setGovernorSetPsi, simTick } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(115)
      
      // Crosslay 1 is 200 ft
      setLine('xlay1', { open: true, valvePercent: 100 })
      // Trashline is 100 ft (less friction loss)
      setLine('trashline', { open: true, valvePercent: 100 })
      
      simTick()
      
      const xlay1Gpm = useStore.getState().discharges.xlay1.gpmNow
      const trashlineGpm = useStore.getState().discharges.trashline.gpmNow
      
      // Shorter hose should have higher flow at same PDP
      expect(trashlineGpm).toBeGreaterThan(xlay1Gpm)
    })
  })

  describe('Governor Behavior', () => {
    it('should maintain P_base (100 PSI) with hydrant=50 and governor=50 in pressure mode', () => {
      const { engagePump, setSource, setIntakePsi, setGovernorMode, setGovernorSetPsi, setLine, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setSource('hydrant')
      setIntakePsi(50)
      
      setGovernorMode('pressure')
      setGovernorSetPsi(50)
      setLine('xlay1', { open: true, valvePercent: 100 })
      recomputeMasters()
      
      // P_system should be P_base (50 + 50 = 100)
      const masterDischarge = useStore.getState().gauges.masterDischarge
      expect(masterDischarge).toBe(100)
      
      // Target RPM should be at PUMP_BASE (750), no extra throttle needed
      const targetRpm = useStore.getState().targetRpm
      expect(targetRpm).toBe(750)
    })

    it('should surpass P_base threshold when governor setPsi exceeds 100', () => {
      const { engagePump, setSource, setIntakePsi, setGovernorMode, setGovernorSetPsi, setLine, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setSource('hydrant')
      setIntakePsi(50)
      
      setGovernorMode('pressure')
      setGovernorSetPsi(160)
      setLine('xlay1', { open: true, valvePercent: 100 })
      recomputeMasters()
      
      // P_system should be 160
      const masterDischarge = useStore.getState().gauges.masterDischarge
      expect(masterDischarge).toBe(160)
      
      // Target RPM should increase proportionally (160 - 100 = 60 extra PSI)
      const targetRpm = useStore.getState().targetRpm
      const expectedRpm = 750 + 60 * 0.6 // PUMP_BASE + extraPsi * RPM_PER_PSI
      expect(targetRpm).toBeCloseTo(expectedRpm, 0)
      expect(targetRpm).toBeGreaterThan(750)
    })

    it('should throttle discharge pressure with partial valve opening', () => {
      const { engagePump, setSource, setIntakePsi, setGovernorMode, setGovernorSetPsi, setLine, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setSource('hydrant')
      setIntakePsi(50)
      
      setGovernorMode('pressure')
      setGovernorSetPsi(160)
      setLine('xlay1', { open: true, valvePercent: 50 })
      recomputeMasters()
      
      // P_line should be 50% of 160 = 80 PSI
      const masterDischarge = useStore.getState().gauges.masterDischarge
      expect(masterDischarge).toBe(80)
    })

    it('should maintain RPM in RPM mode without auto-correcting pressure', () => {
      const { engagePump, setSource, setIntakePsi, setGovernorMode, setGovernorSetRpm, setLine, recomputeMasters } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setSource('hydrant')
      setIntakePsi(50)
      
      setGovernorMode('rpm')
      setGovernorSetRpm(1400)
      setLine('xlay1', { open: true, valvePercent: 100 })
      recomputeMasters()
      
      // Target RPM should be 1400
      const targetRpm = useStore.getState().targetRpm
      expect(targetRpm).toBe(1400)
      
      // Change intake - RPM should NOT change in RPM mode
      setIntakePsi(100)
      recomputeMasters()
      
      // RPM should remain the same
      expect(useStore.getState().targetRpm).toBe(1400)
      
      // Discharge may change due to P_base calculation
      const newDischarge = useStore.getState().gauges.masterDischarge
      expect(newDischarge).toBeGreaterThan(0)
    })

    it('should maintain tank/hydrant intake rules with governor enabled', () => {
      const { engagePump, setSource, setGovernorMode, setGovernorSetPsi } = useStore.getState()
      
      setSource('tank')
      engagePump('water')
      setGovernorMode('pressure')
      setGovernorSetPsi(150)
      
      // Tank mode: intake should be 0
      setSource('tank')
      expect(useStore.getState().gauges.masterIntake).toBe(0)
      
      // Hydrant mode: intake should default to 50
      setSource('hydrant')
      expect(useStore.getState().gauges.masterIntake).toBe(50)
    })
  })
})