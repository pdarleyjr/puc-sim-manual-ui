import { describe, it, expect } from 'vitest'
import {
  frictionLossPsi,
  availableFlowAtResidual,
  nozzleSmoothBoreGpm,
  pumpCurveMaxGpm,
  solveSupplySplit,
  computeTruckMaxGpm,
  computeMonitorMetrics,
  elevationPressurePsi,
  pressureToElevationFeet,
  type SupplyLeg,
  type HydrantTestData
} from '../src/lib/hydraulics'
import { solveHydrantSystem } from '../src/features/hydrant-lab/math'

// ============================================================================
// FRICTION LOSS TESTS - Industry Standard Coefficients
// ============================================================================

describe('Friction Loss (FL = C × Q² × L)', () => {
  it('scales with Q² (quadratic relationship)', () => {
    const leg: SupplyLeg = { diameterIn: 5, lengthFt: 100, gpm: 1000 }
    const fl1 = frictionLossPsi(leg)
    
    // Double the flow → 4x the friction loss
    const fl2 = frictionLossPsi({ ...leg, gpm: 2000 })
    expect(fl2).toBeCloseTo(fl1 * 4, 0)
  })

  it('scales linearly with length', () => {
    const fl100 = frictionLossPsi({ diameterIn: 5, lengthFt: 100, gpm: 1000 })
    const fl200 = frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 1000 })
    
    expect(fl200).toBeCloseTo(fl100 * 2, 0)
  })

  it('5″ LDH has field-calibrated coefficient', () => {
    // Field-calibrated: At 1000 gpm / 100 ft ≈ 2.5 psi
    // (Published 0.08 appears to be for different formula units)
    const fl = frictionLossPsi({ diameterIn: 5, lengthFt: 100, gpm: 1000 })
    expect(fl).toBeCloseTo(2.5, 0)
  })

  it('3″ hose has dramatically higher FL than 5″', () => {
    const fl5in = frictionLossPsi({ diameterIn: 5, lengthFt: 100, gpm: 1000 })
    const fl3in = frictionLossPsi({ diameterIn: 3, lengthFt: 100, gpm: 1000 })
    
    // 3″ coefficient (0.80) is 10x the 5″ coefficient (0.08)
    expect(fl3in).toBeGreaterThan(fl5in * 8)
  })

  it('includes appliance losses when provided', () => {
    const base = frictionLossPsi({ diameterIn: 5, lengthFt: 100, gpm: 1000 })
    const withAdapter = frictionLossPsi({ 
      diameterIn: 5, 
      lengthFt: 100, 
      gpm: 1000, 
      appliancesPsi: 3 
    })
    
    expect(withAdapter).toBe(base + 3)
  })
})

// ============================================================================
// NFPA 291 - AVAILABLE FLOW AT 20 PSI RESIDUAL
// ============================================================================

describe('NFPA 291 Available Flow Calculation', () => {
  it('computes AFF_20 using 0.54 exponent formula', () => {
    // Test data from USFA manual example
    const testData: HydrantTestData = {
      staticPsi: 65,
      residualPsi: 30,
      flowGpm: 500
    }
    
    // Manual calculation: 500 × ((65-30)/(65-20))^0.54 = 500 × (35/45)^0.54
    const aff20 = availableFlowAtResidual(testData, 20)
    
    // Should be approximately 565 gpm per USFA manual example
    expect(aff20).toBeGreaterThan(550)
    expect(aff20).toBeLessThan(580)
  })

  it('handles edge case: residual equals static (no flow measured)', () => {
    const testData: HydrantTestData = {
      staticPsi: 80,
      residualPsi: 80,  // No drop
      flowGpm: 0
    }
    
    const aff20 = availableFlowAtResidual(testData, 20)
    expect(aff20).toBe(0)
  })

  it('prevents negative values from bad test data', () => {
    const testData: HydrantTestData = {
      staticPsi: 50,
      residualPsi: 10,
      flowGpm: 1000
    }
    
    // Asking for 20 psi when test only got to 10 psi
    const aff20 = availableFlowAtResidual(testData, 20)
    expect(aff20).toBeGreaterThanOrEqual(0)
  })
})

// ============================================================================
// SMOOTH BORE NOZZLE FLOW - Freeman Formula
// ============================================================================

describe('Smooth Bore Nozzle Flow (GPM = 29.7 × d² × √NP)', () => {
  it('2.0″ master stream @ 80 psi ≈ 1063 gpm', () => {
    const gpm = nozzleSmoothBoreGpm(2.0, 80)
    
    // 29.7 × 4 × √80 ≈ 29.7 × 4 × 8.944 ≈ 1062.7
    expect(gpm).toBeGreaterThan(1050)
    expect(gpm).toBeLessThan(1075)
  })

  it('1.5″ tip @ 80 psi ≈ 597 gpm', () => {
    const gpm = nozzleSmoothBoreGpm(1.5, 80)
    
    // 29.7 × 2.25 × √80 ≈ 597
    expect(gpm).toBeGreaterThan(590)
    expect(gpm).toBeLessThan(605)
  })

  it('flow increases with √NP (not linearly)', () => {
    const gpm80 = nozzleSmoothBoreGpm(1.5, 80)
    const gpm320 = nozzleSmoothBoreGpm(1.5, 320) // 4x pressure
    
    // 4x pressure → 2x flow (square root relationship)
    expect(gpm320).toBeCloseTo(gpm80 * 2, 0)
  })

  it('handles zero/negative pressure safely', () => {
    expect(nozzleSmoothBoreGpm(2.0, 0)).toBe(0)
    expect(nozzleSmoothBoreGpm(2.0, -10)).toBe(0)
  })
})

// ============================================================================
// PUMP PERFORMANCE CURVE - NFPA 1911 Test Points
// ============================================================================

describe('Pump Curve Ceiling (NFPA 1911 acceptance points)', () => {
  const RATED = 1500

  it('100% capacity up to 150 psi', () => {
    expect(pumpCurveMaxGpm(RATED, 100)).toBe(1500)
    expect(pumpCurveMaxGpm(RATED, 150)).toBe(1500)
  })

  it('70% capacity at 200 psi', () => {
    expect(pumpCurveMaxGpm(RATED, 200)).toBe(1050)
  })

  it('50% capacity at 250 psi and above', () => {
    expect(pumpCurveMaxGpm(RATED, 250)).toBe(750)
    expect(pumpCurveMaxGpm(RATED, 300)).toBe(750)  // Stays at 50%
  })

  it('protects pump from over-pressurization', () => {
    // Even with small pumper, curve enforces limits
    expect(pumpCurveMaxGpm(750, 250)).toBe(375)
  })
})

// ============================================================================
// MULTI-LEG SOLVER - Field Research 70/30 Split
// ============================================================================

describe('Multi-Leg Flow Solver (70/30 split from field tests)', () => {
  it('single leg gets 100% of flow', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 200, gpm: 0 }
    ]
    
    const result = solveSupplySplit(legs, 2000)
    
    expect(result.totalGpm).toBeCloseTo(2000, 0)
    expect(result.perLeg['0']).toBeCloseTo(2000, 0)
  })

  it('double tap approximates 70/30 split (steamer favored)', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 200, gpm: 1400 },  // Steamer
      { diameterIn: 5, lengthFt: 200, gpm: 600 },   // Side A
    ]
    
    const result = solveSupplySplit(legs, 2000, 12)
    
    const steamerGpm = result.perLeg['0'] || 0
    const sideGpm = result.perLeg['1'] || 0
    const steamerPct = steamerGpm / (steamerGpm + sideGpm)
    
    // Should be roughly 65-75% through steamer (70% target ± margin)
    expect(steamerPct).toBeGreaterThan(0.60)
    expect(steamerPct).toBeLessThan(0.80)
  })

  it('solver converges within 12 iterations', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 150, gpm: 0 },
      { diameterIn: 5, lengthFt: 200, gpm: 0 },
    ]
    
    const result = solveSupplySplit(legs, 1500, 12)
    
    // Should converge to a solution
    expect(result.totalGpm).toBeGreaterThan(1000)
    expect(result.perLeg['0']).toBeGreaterThan(0)
    expect(result.perLeg['1']).toBeGreaterThan(0)
  })

  it('handles zero flow request', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 100, gpm: 0 }
    ]
    
    const result = solveSupplySplit(legs, 0)
    expect(result.totalGpm).toBe(0)
  })
})

// ============================================================================
// TRUCK MAX GPM - Integration Test
// ============================================================================

describe('Truck Max GPM (supply + pump ceiling)', () => {
  it('enforces 20 psi residual floor', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 100, gpm: 1000 }
    ]
    
    // When residual < 20, truck max should be 0
    const max = computeTruckMaxGpm(legs, 150, 15, 1500)
    expect(max).toBe(0)
  })

  it('limited by pump curve at high PDP', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 100, gpm: 1500 }
    ]
    
    // At 250 psi, pump can only do 50% = 750 gpm
    const max = computeTruckMaxGpm(legs, 250, 50, 1500)
    expect(max).toBeLessThanOrEqual(750)
  })

  it('respects AFF_20 ceiling when provided', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 100, gpm: 2000 }
    ]
    
    // Hydrant only rated for 1200 gpm at 20 psi
    const max = computeTruckMaxGpm(legs, 150, 40, 1500, 1200)
    expect(max).toBeLessThanOrEqual(1200)
  })
})

// ============================================================================
// COMPLETE MONITOR METRICS - End-to-End
// ============================================================================

describe('Complete Monitor Metrics (end-to-end)', () => {
  it('computes realistic flow for 1.5″ tip @ 150 PDP', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 5, lengthFt: 200, gpm: 700 },   // Steamer
      { diameterIn: 5, lengthFt: 200, gpm: 300 },   // Side A
    ]
    
    const metrics = computeMonitorMetrics(
      legs,
      1.5,          // 1.5″ tip
      150,          // 150 psi PDP
      25,           // 25 psi device loss
      45,           // 45 psi main residual
      1500          // 1500 gpm rated pump
    )
    
    // NP = 150 - 25 = 125 psi
    // Demand = 29.7 × 1.5² × √125 ≈ 745 gpm
    expect(metrics.flowNowGpm).toBeGreaterThan(700)
    expect(metrics.flowNowGpm).toBeLessThan(800)
    expect(metrics.residualMainPsi).toBe(45)
  })

  it('clamps flow when supply ceiling is lower than nozzle demand', () => {
    const legs: SupplyLeg[] = [
      { diameterIn: 3, lengthFt: 400, gpm: 500 },  // Long 3″ line (high FL)
    ]
    
    const metrics = computeMonitorMetrics(
      legs,
      2.0,          // 2.0″ tip wants ~1000+ gpm
      150,          // 150 psi PDP
      25,           // 25 psi device loss
      30,           // Low residual
      1500          // Rated pump
    )
    
    // Supply is limiting factor, not nozzle demand
    expect(metrics.flowNowGpm).toBeLessThan(metrics.truckMaxGpm * 1.1)
  })
})

// ============================================================================
// ELEVATION PRESSURE CONVERSIONS
// ============================================================================

describe('Elevation ↔ Pressure Conversions', () => {
  it('0.433 psi per foot (exact constant)', () => {
    const psi = elevationPressurePsi(100)
    expect(psi).toBeCloseTo(43.3, 1)
  })

  it('2.31 feet per psi (inverse constant)', () => {
    const feet = pressureToElevationFeet(65)
    expect(feet).toBeCloseTo(150, 0)
  })

  it('round-trip conversion', () => {
    const originalFeet = 100
    const psi = elevationPressurePsi(originalFeet)
    const backToFeet = pressureToElevationFeet(psi)
    
    expect(backToFeet).toBeCloseTo(originalFeet, 1)
  })
})

// ============================================================================
// FIELD RESEARCH VALIDATION - Heavy Hydrant Hookups Article
// ============================================================================

describe('Field Research Validation (Heavy Hydrant Hookups, Fire Apparatus Magazine)', () => {
  it('replicates field test: single 5″ @ 2000 gpm → ~20-25 psi FL', () => {
    // Field test: 80 psi static, 52 psi at hydrant, 25 psi at pump
    // Single 5″ × 200ft carrying full 2000 gpm
    const fl = frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 2000 })
    
    // FL should be ~20-30 psi range (hose only, before hydrant body & intake plumbing)
    expect(fl).toBeGreaterThanOrEqual(18)
    expect(fl).toBeLessThan(30)
  })

  it('replicates field test: double tap 5″ raises intake from 25→40 psi', () => {
    // When flow splits 70/30, friction in steamer drops dramatically
    const flSingle = frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 2000 })
    
    // Double tap: ~1400 gpm steamer, ~600 gpm side
    const flSteamer = frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 1400 })
    const flSide = frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 600 })
    
    // Steamer FL should be dramatically lower (~50% reduction)
    expect(flSteamer).toBeLessThan(flSingle * 0.55)
  })

  it('replicates field test: 2.5″ side line shows no benefit', () => {
    // Field observation: adding 2.5″ line to side while 5″ on steamer
    // resulted in "no noticeable increase" in intake pressure
    
    const fl5in = frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 300 })
    const fl2_5in = frictionLossPsi({ diameterIn: 3, lengthFt: 200, gpm: 300 })
    
    // 2.5″/3″ has so much more FL that negligible flow goes through it
    expect(fl2_5in).toBeGreaterThan(fl5in * 6)
  })
})

// ============================================================================
// BOUNDARY CONDITIONS & SAFETY
// ============================================================================

describe('Boundary Conditions & Safety', () => {
  it('handles zero-length hose', () => {
    const fl = frictionLossPsi({ diameterIn: 5, lengthFt: 0, gpm: 1000 })
    expect(fl).toBe(0)
  })

  it('handles zero flow', () => {
    const fl = frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 0 })
    expect(fl).toBe(0)
  })

  it('handles very high flows without NaN', () => {
    const fl = frictionLossPsi({ diameterIn: 5, lengthFt: 500, gpm: 5000 })
    expect(fl).toBeGreaterThan(0)
    expect(Number.isFinite(fl)).toBe(true)
  })

  it('NFPA 291 formula handles edge cases', () => {
    // Division by near-zero protected
    const aff = availableFlowAtResidual({
      staticPsi: 20.1,
      residualPsi: 20,
      flowGpm: 100
    }, 20)
    
    expect(Number.isFinite(aff)).toBe(true)
    expect(aff).toBeGreaterThanOrEqual(0)
  })
})

// ============================================================================
// TEXTBOOK EXAMPLES - USFA Manual Vol II
// ============================================================================

describe('USFA Textbook Example Validation', () => {
  it('Example 3-1: Dead-end main flow test (Figure 3-1)', () => {
    // Static 65 psi, Residual 30 psi @ 500 gpm → AFF_20 ≈ 565 gpm
    const testData: HydrantTestData = {
      staticPsi: 65,
      residualPsi: 30,
      flowGpm: 500
    }
    
    const aff20 = availableFlowAtResidual(testData, 20)
    
    // Per textbook graph, should be approximately 560-575 gpm (graphical reading tolerance)
    expect(aff20).toBeGreaterThan(560)
    expect(aff20).toBeLessThan(580)
  })

  it('Gravity tank riser: 100 ft height = 43.3 psi', () => {
    // Chapter 2, Problem 4
    const psi = elevationPressurePsi(100)
    expect(psi).toBeCloseTo(43.3, 1)
  })

  it('Inspector test gauge: 65 psi = 150 ft head', () => {
    // Chapter 2, Problem 5
    const feet = pressureToElevationFeet(65)
    expect(feet).toBeCloseTo(150, 0)
  })
})

// ============================================================================
// HYDRANT LAB SANITY CHECKS - Corrected Physics Model
// ============================================================================

describe('Hydrant Lab Sanity Checks (Task Validation)', () => {
  it('Sanity Check 1: Single 5" LDH, 300ft, 50-psi hydrant → ~1290 gpm', () => {
    // Single 5″ LDH, 300′, 50-psi hydrant, intake ~10 psi
    // ΔP available across hose ≈ 40 psi
    // FL = 0.08 × Q² × 3 ⇒ 0.24 Q² ≈ 40 ⇒ Q ≈ 12.9 ⇒ ~1290 gpm
    
    const result = solveHydrantSystem({
      staticPsi: 50,
      legs: {
        steamer: { id: 'steamer', sizeIn: 5, lengthFt: 300, gpm: 0 },
        sideA: null,
        sideB: null
      },
      hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
      governorPsi: 150
    })
    
    // Should get ~1200-1400 gpm (matches field experience)
    expect(result.totalInflowGpm).toBeGreaterThan(1100)
    expect(result.totalInflowGpm).toBeLessThan(1500)
    
    // Intake should be relatively low (high friction)
    expect(result.engineIntakePsi).toBeGreaterThan(5)
    expect(result.engineIntakePsi).toBeLessThan(20)
    
    // Hydrant main residual should stay ≥20 psi
    expect(result.hydrantResidualPsi).toBeGreaterThanOrEqual(20)
  })
  
  it('Sanity Check 2: Add second 5" side leg → total ~1900-2100 gpm', () => {
    // Two 5″ legs in parallel, each 300′
    // Each leg carries ~900-1,000 gpm; total inflow ~1,900-2,100 gpm
    // Intake climbs because each leg's FL drops
    
    const result = solveHydrantSystem({
      staticPsi: 50,
      legs: {
        steamer: { id: 'steamer', sizeIn: 5, lengthFt: 300, gpm: 0 },
        sideA: { id: 'sideA', sizeIn: 5, lengthFt: 300, gpm: 0, gateOpen: true },
        sideB: null
      },
      hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
      governorPsi: 150
    })
    
    // Total flow should be significantly higher than single leg
    expect(result.totalInflowGpm).toBeGreaterThan(1700)
    expect(result.totalInflowGpm).toBeLessThan(2300)
    
    // Intake should be higher due to reduced friction per leg
    expect(result.engineIntakePsi).toBeGreaterThan(15)
    
    // Hydrant main should still be ≥20 psi
    expect(result.hydrantResidualPsi).toBeGreaterThanOrEqual(20)
  })
  
  it('Sanity Check 3: 3" side leg contributes little, steamer >70%', () => {
    // Swap side leg to 3″, 300′
    // Its FL per 100′ at 1,000 gpm is ~80 psi; contributes very little flow
    // Steamer still carries the lion's share (often >70%)
    
    const steamerLeg = { id: 'steamer' as const, sizeIn: 5 as const, lengthFt: 300, gpm: 0 }
    const sideALeg = { id: 'sideA' as const, sizeIn: 3 as const, lengthFt: 300, gpm: 0, gateOpen: true }
    
    const result = solveHydrantSystem({
      staticPsi: 50,
      legs: {
        steamer: steamerLeg,
        sideA: sideALeg,
        sideB: null
      },
      hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
      governorPsi: 150
    })
    
    // Total flow should be only slightly higher than single 5" leg
    expect(result.totalInflowGpm).toBeGreaterThan(1100)
    expect(result.totalInflowGpm).toBeLessThan(1700)
    
    // Check steamer carries majority (leg objects are mutated by solver)
    const steamerGpm = steamerLeg.gpm
    const sideGpm = sideALeg.gpm
    const steamerPercent = steamerGpm / result.totalInflowGpm
    
    // Steamer should carry >70% due to 3" having high resistance
    expect(steamerPercent).toBeGreaterThan(0.70)
    
    // 3" side leg should contribute relatively little
    expect(sideGpm).toBeLessThan(steamerGpm * 0.5)
  })
  
  it('Sanity Check 4: Governor limits outflow at high PDP', () => {
    // At PDP 150 psi, pump can move roughly rated flow (1500 gpm)
    // At higher PDP (200-250 psi), governor limits to 70-50% of rated
    // This should prevent flow even with good hydrant supply
    
    const goodSupply = solveHydrantSystem({
      staticPsi: 80,
      legs: {
        steamer: { id: 'steamer', sizeIn: 5, lengthFt: 100, gpm: 0 },
        sideA: { id: 'sideA', sizeIn: 5, lengthFt: 100, gpm: 0, gateOpen: true },
        sideB: null
      },
      hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
      governorPsi: 150
    })
    
    // At 150 psi PDP, should allow ~1500 gpm (100% of rating)
    expect(goodSupply.totalInflowGpm).toBeGreaterThan(1300)
    
    // Now limit by governor at high PDP
    const governorLimited = solveHydrantSystem({
      staticPsi: 80,
      legs: {
        steamer: { id: 'steamer', sizeIn: 5, lengthFt: 100, gpm: 0 },
        sideA: { id: 'sideA', sizeIn: 5, lengthFt: 100, gpm: 0, gateOpen: true },
        sideB: null
      },
      hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
      governorPsi: 250  // High PDP → 50% governor limit
    })
    
    // At 250 psi PDP, governor should limit to ~750 gpm (50% of 1500)
    expect(governorLimited.totalInflowGpm).toBeLessThan(900)
    expect(governorLimited.totalInflowGpm).toBeGreaterThan(600)
  })
  
  it('Validates NFPA 291 constraint: hydrant main ≥20 psi', () => {
    // Even with massive demand, hydrant main residual should never drop below 20 psi
    // This is the NFPA 291 fire flow rating constraint
    
    const result = solveHydrantSystem({
      staticPsi: 40,  // Low static pressure
      legs: {
        steamer: { id: 'steamer', sizeIn: 5, lengthFt: 300, gpm: 0 },
        sideA: { id: 'sideA', sizeIn: 5, lengthFt: 300, gpm: 0, gateOpen: true },
        sideB: { id: 'sideB', sizeIn: 5, lengthFt: 300, gpm: 0, gateOpen: true }
      },
      hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
      governorPsi: 150
    })
    
    // Hydrant residual must stay ≥20 psi per NFPA 291
    expect(result.hydrantResidualPsi).toBeGreaterThanOrEqual(20)
    
    // Intake CAN be lower (the fix allows this)
    // This is acceptable per field practice
    expect(result.engineIntakePsi).toBeLessThan(result.hydrantResidualPsi)
  })
  
  it('Allows engine intake below 20 psi during high flow', () => {
    // Critical fix: intake can legitimately be <20 psi
    // Only the MAIN residual must stay ≥20 psi
    
    const result = solveHydrantSystem({
      staticPsi: 50,
      legs: {
        steamer: { id: 'steamer', sizeIn: 5, lengthFt: 400, gpm: 0 },  // Long run
        sideA: null,
        sideB: null
      },
      hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
      governorPsi: 150
    })
    
    // With long hose run, intake can be <20 psi
    // This is physically correct and matches field observations
    expect(result.engineIntakePsi).toBeLessThan(20)
    
    // But hydrant main stays protected
    expect(result.hydrantResidualPsi).toBeGreaterThanOrEqual(20)
  })
})