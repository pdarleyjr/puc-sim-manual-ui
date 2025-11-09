import { describe, it, expect } from 'vitest'
import {
  computeLineFrictionLoss,
  convertPsiPer100ToCoefficient,
  convertCoefficientToPsiPer100,
  type FrictionLossParams
} from '../src/engine/calcEngineV2'

describe('Friction Loss Calculations', () => {
  /**
   * Test 1: Key Combat Ready 1.75" - psi/100' mode
   * Default: 20.2 psi/100' for 175 GPM
   * Crosslay length: 200 feet
   * Expected total FL: 40.4 psi
   */
  it('should calculate FL for 1.75" Combat Ready crosslay (200 ft)', () => {
    const result = computeLineFrictionLoss({
      gpm: 175,
      lengthFt: 200,
      mode: 'psi_per100',
      value: 20.2
    })
    
    expect(result.psiPer100).toBeCloseTo(20.2, 1)
    expect(result.totalPsi).toBeCloseTo(40.4, 1) // 20.2 * 2
    expect(result.coeffUsed).toBeGreaterThan(0)
  })
  
  /**
   * Test 2: Key Combat Ready 1.75" - trash line
   * Length: 100 feet
   * Expected total FL: 20.2 psi
   */
  it('should calculate FL for 1.75" Combat Ready trash line (100 ft)', () => {
    const result = computeLineFrictionLoss({
      gpm: 175,
      lengthFt: 100,
      mode: 'psi_per100',
      value: 20.2
    })
    
    expect(result.psiPer100).toBeCloseTo(20.2, 1)
    expect(result.totalPsi).toBeCloseTo(20.2, 1) // 20.2 * 1
  })
  
  /**
   * Test 3: Key Big-10 2.5" - Low Flow (175 GPM)
   * Default: 2.7 psi/100' at 175 GPM
   * Length: 150 feet
   * Expected total FL: 4.05 psi
   */
  it('should calculate FL for 2.5" Big-10 at low flow (175 GPM)', () => {
    const result = computeLineFrictionLoss({
      gpm: 175,
      lengthFt: 150,
      mode: 'psi_per100',
      value: 2.7
    })
    
    expect(result.psiPer100).toBeCloseTo(2.7, 1)
    expect(result.totalPsi).toBeCloseTo(4.05, 1) // 2.7 * 1.5
  })
  
  /**
   * Test 4: Key Big-10 2.5" - Rated Flow (500 GPM)
   * Default: 22 psi/100' at 500 GPM
   * Length: 150 feet
   * Expected total FL: 33.0 psi
   */
  it('should calculate FL for 2.5" Big-10 at rated flow (500 GPM)', () => {
    const result = computeLineFrictionLoss({
      gpm: 500,
      lengthFt: 150,
      mode: 'psi_per100',
      value: 22.0
    })
    
    expect(result.psiPer100).toBeCloseTo(22.0, 1)
    expect(result.totalPsi).toBeCloseTo(33.0, 1) // 22 * 1.5
  })
  
  /**
   * Test 5: Coefficient mode with standard 1.75" hose
   * Using C=15.5, 150 GPM, 200 ft
   * Formula: FL = C × (Q/100)² × (L/100) = 15.5 × (1.5)² × 2 = 69.75 psi
   */
  it('should calculate FL using coefficient mode for 1.75" line', () => {
    const result = computeLineFrictionLoss({
      gpm: 150,
      lengthFt: 200,
      mode: 'coefficient',
      value: 15.5
    })
    
    expect(result.coeffUsed).toBe(15.5)
    expect(result.totalPsi).toBeCloseTo(69.75, 1)
    expect(result.psiPer100).toBeCloseTo(34.875, 1)
  })
  
  /**
   * Test 6: Coefficient mode with standard 2.5" hose
   * Using C=2.0, 250 GPM, 150 ft
   * Formula: FL = 2.0 × (2.5)² × 1.5 = 18.75 psi
   */
  it('should calculate FL using coefficient mode for 2.5" line', () => {
    const result = computeLineFrictionLoss({
      gpm: 250,
      lengthFt: 150,
      mode: 'coefficient',
      value: 2.0
    })
    
    expect(result.coeffUsed).toBe(2.0)
    expect(result.totalPsi).toBeCloseTo(18.75, 1)
    expect(result.psiPer100).toBeCloseTo(12.5, 1)
  })
  
  /**
   * Test 7: Zero flow edge case
   */
  it('should handle zero flow gracefully', () => {
    const result = computeLineFrictionLoss({
      gpm: 0,
      lengthFt: 200,
      mode: 'psi_per100',
      value: 20.2
    })
    
    // In psi_per100 mode, totalPsi is still calculated as psiPer100 * length
    // even with zero flow (the value is "per 100 feet" regardless of flow)
    expect(result.totalPsi).toBeCloseTo(40.4, 1) // 20.2 * 2
    expect(result.psiPer100).toBe(20.2)
    expect(result.coeffUsed).toBe(0) // Back-calculated coeff is 0 when gpm=0
  })
  
  /**
   * Test 8: Conversion - psi/100' to coefficient
   * 20.2 psi/100' at 175 GPM → C = 20.2 / (1.75)² ≈ 6.595918...
   */
  it('should convert psi/100 to coefficient correctly', () => {
    const coeff = convertPsiPer100ToCoefficient(20.2, 175)
    // Use 1 decimal place for precision tolerance
    expect(coeff).toBeCloseTo(6.59, 1)
  })
  
  /**
   * Test 9: Conversion - coefficient to psi/100'
   * C=15.5 at 150 GPM → psi/100' = 15.5 × (1.5)² = 34.875
   */
  it('should convert coefficient to psi/100 correctly', () => {
    const psiPer100 = convertCoefficientToPsiPer100(15.5, 150)
    expect(psiPer100).toBeCloseTo(34.875, 1)
  })
  
  /**
   * Test 10: Bidirectional conversion consistency
   */
  it('should maintain consistency in bidirectional conversions', () => {
    const originalPsi = 20.2
    const referenceGpm = 175
    
    // Convert to coefficient and back
    const coeff = convertPsiPer100ToCoefficient(originalPsi, referenceGpm)
    const backToPsi = convertCoefficientToPsiPer100(coeff, referenceGpm)
    
    expect(backToPsi).toBeCloseTo(originalPsi, 2)
  })
  
  /**
   * Test 11: Zero length edge case
   */
  it('should handle zero length correctly', () => {
    const result = computeLineFrictionLoss({
      gpm: 175,
      lengthFt: 0,
      mode: 'psi_per100',
      value: 20.2
    })
    
    expect(result.totalPsi).toBe(0)
  })
  
  /**
   * Test 12: Large flow values
   */
  it('should handle large flow rates (1000 GPM)', () => {
    const result = computeLineFrictionLoss({
      gpm: 1000,
      lengthFt: 100,
      mode: 'coefficient',
      value: 2.0
    })
    
    // FL = 2.0 × (10)² × 1 = 200 psi
    expect(result.totalPsi).toBeCloseTo(200, 1)
    expect(result.psiPer100).toBeCloseTo(200, 1)
  })
  
  /**
   * Test 13: Negative flow edge case (defensive programming)
   */
  it('should handle negative flow gracefully', () => {
    const result = computeLineFrictionLoss({
      gpm: -100,
      lengthFt: 200,
      mode: 'coefficient',
      value: 15.5
    })
    
    // Should still compute (FL formula doesn't validate sign)
    expect(result.totalPsi).toBeDefined()
  })
  
  /**
   * Test 14: Formula string contains correct information (psi_per100 mode)
   */
  it('should provide informative formula string in psi_per100 mode', () => {
    const result = computeLineFrictionLoss({
      gpm: 175,
      lengthFt: 200,
      mode: 'psi_per100',
      value: 20.2
    })
    
    expect(result.formula).toContain('20.2')
    expect(result.formula).toContain('psi/100')
    expect(result.formula).toContain('40.4')
  })
  
  /**
   * Test 15: Formula string contains correct information (coefficient mode)
   */
  it('should provide informative formula string in coefficient mode', () => {
    const result = computeLineFrictionLoss({
      gpm: 150,
      lengthFt: 200,
      mode: 'coefficient',
      value: 15.5
    })
    
    expect(result.formula).toContain('15.5')
    expect(result.formula).toContain('150')
    expect(result.formula).toContain('69.8') // Should be close to 69.75
  })
})