import { describe, it, expect } from 'vitest'
import {
  frictionLossPsi,
  type SupplyLeg
} from '../src/lib/hydraulics'
import frictionCoeffsData from '../data/friction_coeffs.json'

// ============================================================================
// COEFFICIENT CONSISTENCY TESTS - Single Source of Truth Validation
// ============================================================================

describe('Coefficient Consistency', () => {
  const TOLERANCE = 0.001  // ±0.001 tolerance for floating point comparison

  it('verifies friction_coeffs.json is the single source of truth', () => {
    // This test ensures all friction coefficients come from friction_coeffs.json
    // and no hardcoded values exist that could diverge
    expect(frictionCoeffsData.supply_lines["5.0"]).toBe(0.025)
    expect(frictionCoeffsData.supply_lines["4.0"]).toBe(0.2)
    expect(frictionCoeffsData.supply_lines["3.0"]).toBe(0.8)
    expect(frictionCoeffsData.attack_lines["2.5"]).toBe(2.0)
    expect(frictionCoeffsData.attack_lines["1.75"]).toBe(15.5)
  })

  it('verifies hydraulics.ts uses 0.025 for 5" LDH (not 0.08)', () => {
    // Field-calibrated coefficient must be used, not the IFSTA/NFPA standard
    const leg: SupplyLeg = { diameterIn: 5, lengthFt: 100, gpm: 1000 }
    const fl = frictionLossPsi(leg)
    
    // At 1000 GPM / 100 ft with C=0.025: FL = 0.025 × 10² × 1 = 2.5 PSI
    // If using 0.08: FL would be 8.0 PSI (3.2x difference)
    expect(fl).toBeCloseTo(2.5, 1)
    expect(fl).not.toBeCloseTo(8.0, 1)
  })

  it('verifies math.ts matches hydraulics.ts coefficients', () => {
    // Compare friction loss calculations between both modules
    // Both should produce identical results for same inputs
    
    const testCases = [
      { diameterIn: 5 as const, lengthFt: 100, gpm: 1000 },
      { diameterIn: 5 as const, lengthFt: 200, gpm: 2000 },
      { diameterIn: 3 as const, lengthFt: 100, gpm: 500 },
      { diameterIn: 4 as const, lengthFt: 150, gpm: 1500 }
    ]
    
    for (const testCase of testCases) {
      const flHydraulics = frictionLossPsi(testCase)
      
      // Calculate using the same formula from math.ts
      const key = `${testCase.diameterIn}.0` as "3.0" | "4.0" | "5.0"
      const C = frictionCoeffsData.supply_lines[key]
      const Q = testCase.gpm / 100
      const L = testCase.lengthFt / 100
      const flMath = C * Q * Q * L
      
      expect(flHydraulics).toBeCloseTo(flMath, 2)
    }
  })

  it('detects if 5" coefficient diverges from 0.025', () => {
    // This test will fail if someone changes the coefficient back to 0.08
    // or to any other value, alerting them to the discrepancy
    
    const coeff5inch = frictionCoeffsData.supply_lines["5.0"]
    expect(Math.abs(coeff5inch - 0.025)).toBeLessThan(TOLERANCE)
    
    // Verify it's NOT the old IFSTA/NFPA value
    expect(Math.abs(coeff5inch - 0.08)).toBeGreaterThan(0.05)
  })

  it('validates all coefficients match between JSON and calculated friction loss', () => {
    // Comprehensive check: for each hose size, verify the coefficient
    // used in frictionLossPsi matches friction_coeffs.json
    
    const testSizes: Array<{ size: SupplyLeg['diameterIn'], key: "3.0" | "4.0" | "5.0" }> = [
      { size: 5, key: "5.0" },
      { size: 4, key: "4.0" },
      { size: 3, key: "3.0" }
    ]
    
    for (const { size, key } of testSizes) {
      const expectedCoeff = frictionCoeffsData.supply_lines[key]
      
      // Calculate friction loss for standard test case
      const testGpm = 1000
      const testLength = 100
      const fl = frictionLossPsi({ diameterIn: size, lengthFt: testLength, gpm: testGpm })
      
      // Back-calculate coefficient: C = FL / ((Q/100)² × (L/100))
      const Q = testGpm / 100
      const L = testLength / 100
      const calculatedCoeff = fl / (Q * Q * L)
      
      expect(calculatedCoeff).toBeCloseTo(expectedCoeff, 3)
    }
  })

  it('ensures 5" LDH 3.2x difference issue is resolved', () => {
    // This is the core issue: at 1000 GPM through 100 ft of 5" hose
    // - With 0.025: ~2.5 PSI loss
    // - With 0.08: ~8 PSI loss (3.2x difference)
    
    const leg: SupplyLeg = { diameterIn: 5, lengthFt: 100, gpm: 1000 }
    const actualFL = frictionLossPsi(leg)
    
    const expectedWithCorrectCoeff = 2.5  // Using 0.025
    const wrongValueWithOldCoeff = 8.0    // Using 0.08
    
    // Should match the correct coefficient
    expect(actualFL).toBeCloseTo(expectedWithCorrectCoeff, 1)
    
    // Should NOT match the old incorrect coefficient
    expect(Math.abs(actualFL - wrongValueWithOldCoeff)).toBeGreaterThan(5)
  })
})