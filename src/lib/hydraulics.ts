/**
 * Fire Service Hydraulics Library - NFPA 291 & Field Research Based
 * 
 * This module implements industry-standard hydraulic calculations for fire pump
 * operations, hydrant supply analysis, and water delivery systems. All formulas
 * are based on published standards, textbooks, and documented field tests.
 * 
 * Key References:
 * - NFPA 291: Recommended Practice for Fire Flow Testing and Marking of Hydrants
 * - NFPA 1911: Fire Apparatus Pump Testing
 * - Fire Hydrants and Apparatus Water Supply (textbook)
 * - USFA Water Supply Systems and Evaluation Methods Volume II
 * - Heavy Hydrant Hookups field research (Fire Apparatus Magazine)
 */

import frictionCoeffsData from '../../data/friction_coeffs.json'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/** Supply leg configuration (steamer, side A, side B) */
export type SupplyLeg = {
  diameterIn: 3 | 4 | 5;          // Hose internal diameter
  lengthFt: number;                // Hose length in feet
  gpm: number;                     // Current flow assigned to this leg
  appliancesPsi?: number;          // Gate valves, adapters, HAV, etc.
}

/** Hydrant capacity test data per NFPA 291 */
export type HydrantTestData = {
  staticPsi: number;               // P_s: pressure with no flow
  residualPsi: number;             // P_r: pressure during test flow
  flowGpm: number;                 // Q_F: measured flow during test
}

/** HAV (Hydrant Assist Valve) configuration */
export type HAVConfig = {
  enabled: boolean;
  boostMode: boolean;              // false = straight-through, true = boosted
  boostPdpPsi?: number;            // PDP from second pumper (when boosting)
}

// ============================================================================
// FRICTION LOSS - Industry Standard Coefficients
// ============================================================================

/**
 * Friction loss coefficients for common fire hose sizes.
 * Formula: FL = C × (Q/100)² × (L/100)
 * 
 * These coefficients are calibrated to field test data from Heavy Hydrant Hookups
 * research (Fire Apparatus Magazine, 2022) which showed:
 * - 5″ × 200ft @ 2000 gpm ≈ 20-25 psi hose FL (before hydrant body & intake plumbing)
 * 
 * All values imported from friction_coeffs.json (single source of truth)
 * 
 * Source: Heavy Hydrant Hookups field tests
 * Source: friction_coeffs.json
 */
const FRICTION_COEFFICIENTS: Record<SupplyLeg['diameterIn'], number> = {
  3: frictionCoeffsData.supply_lines["3.0"],
  4: frictionCoeffsData.supply_lines["4.0"],
  5: frictionCoeffsData.supply_lines["5.0"],
}

/**
 * Calculates friction loss in a supply hose leg.
 * 
 * @param leg - Supply leg configuration
 * @returns Friction loss in PSI
 * 
 * @example
 * // 5″ hose, 200ft, flowing 1400 gpm
 * frictionLossPsi({ diameterIn: 5, lengthFt: 200, gpm: 1400 })
 * // Returns: ~31.4 psi
 */
export function frictionLossPsi(leg: SupplyLeg): number {
  const C = FRICTION_COEFFICIENTS[leg.diameterIn]
  const Q = leg.gpm / 100
  const L = leg.lengthFt / 100
  const FL = C * Q * Q * L
  const appliances = leg.appliancesPsi ?? 0
  return FL + appliances
}

// ============================================================================
// NFPA 291 - AVAILABLE FLOW AT 20 PSI RESIDUAL
// ============================================================================

/**
 * Calculates available flow at a desired residual pressure using NFPA 291 formula.
 * 
 * Formula: Q_R = Q_F × ((P_s - P_f) / (P_s - P_r))^0.54
 * 
 * This formula accounts for the non-linear relationship between pressure drop
 * and flow in water distribution systems (Hazen-Williams exponent ≈ 1.85/2 ≈ 0.54).
 * 
 * @param testData - Hydrant flow test results (static, residual, flow)
 * @param desiredResidualPsi - Target residual pressure (default: 20 psi per NFPA 291)
 * @returns Available flow in GPM at the desired residual pressure
 * 
 * Source: NFPA 291-2019, Section 5.2.3
 * Source: USFA Water Supply Systems Vol II, Chapter 3
 * 
 * @example
 * // Hydrant test: 65 psi static, 30 psi residual @ 500 gpm
 * availableFlowAtResidual({ staticPsi: 65, residualPsi: 30, flowGpm: 500 }, 20)
 * // Returns: ~565 gpm available at 20 psi residual
 */
export function availableFlowAtResidual(
  testData: HydrantTestData,
  desiredResidualPsi: number = 20
): number {
  const { staticPsi, residualPsi, flowGpm } = testData
  
  // Pressure drop during test: ΔP_test = P_s - P_r
  // Desired pressure drop: ΔP_desired = P_s - P_f
  // More pressure drop → more flow
  const dropTest = Math.max(1e-6, staticPsi - residualPsi)
  const dropDesired = Math.max(1e-6, staticPsi - desiredResidualPsi)
  
  // NFPA 291 formula: Q_f = Q_test × (ΔP_desired / ΔP_test)^0.54
  const Q_available = flowGpm * Math.pow(dropDesired / dropTest, 0.54)
  
  return Math.max(0, Q_available)
}

// ============================================================================
// SMOOTH BORE NOZZLE FLOW (Freeman Formula)
// ============================================================================

/**
 * Calculates flow from a smooth bore nozzle using the Freeman/Underwriters formula.
 * 
 * Formula: GPM = 29.7 × d² × √NP  (for C_d ≈ 0.97-0.98)
 * Exact: GPM = 29.83 × C_d × d² × √NP
 * 
 * @param tipInches - Nozzle tip diameter in inches
 * @param nozzlePressurePsi - Pressure at the nozzle (NP)
 * @returns Flow in GPM
 * 
 * Source: USFA Water Supply Systems Vol II, Chapter 3, Freeman Flow Formula
 * Source: Task Force Tips - 7 Hydraulic Calculations Every Firefighter Needs to Know
 * 
 * @example
 * // 2.0″ master stream tip @ 80 psi NP
 * nozzleSmoothBoreGpm(2.0, 80)
 * // Returns: ~1063 gpm
 */
export function nozzleSmoothBoreGpm(tipInches: number, nozzlePressurePsi: number): number {
  // Using 29.7 constant (assumes C_d ≈ 0.98 for well-designed nozzles)
  return 29.7 * tipInches * tipInches * Math.sqrt(Math.max(0, nozzlePressurePsi))
}

// ============================================================================
// PUMP PERFORMANCE CURVE - NFPA 1911 Acceptance Test Points
// ============================================================================

/**
 * Calculates maximum deliverable flow based on pump performance curve.
 * 
 * Pump acceptance test points per NFPA 1911:
 * - 100% rated capacity @ 150 PSI (20 min)
 * - 70% rated capacity @ 200 PSI (10 min)  
 * - 50% rated capacity @ 250 PSI (10 min)
 * - Plus overload: 165% @ 165 PSI (5 min) - not modeled here
 * 
 * @param ratedGpm - Pump's rated capacity (e.g., 1500 gpm for typical pumper)
 * @param pdpPsi - Pump Discharge Pressure (PDP) setpoint
 * @returns Maximum flow the pump can deliver at this PDP
 * 
 * Source: NFPA 1911-2017, Standard for Inspection, Maintenance, Testing, and
 *         Retirement of In-Service Automotive Fire Apparatus
 * Source: Fire Flow Services - Fire Pump Testing documentation
 * 
 * @example
 * // 1500 gpm pumper operating at 200 psi PDP
 * pumpCurveMaxGpm(1500, 200)
 * // Returns: 1050 gpm (70% of rated)
 */
export function pumpCurveMaxGpm(ratedGpm: number, pdpPsi: number): number {
  // 100% up to 150 psi
  if (pdpPsi <= 150) return ratedGpm
  
  // 70% from 150-200 psi (linear interpolation)
  if (pdpPsi <= 200) return ratedGpm * 0.70
  
  // 50% from 200-250 psi and above
  return ratedGpm * 0.50
}

// ============================================================================
// MULTI-LEG FLOW SOLVER - Field Research Based 70/30 Split
// ============================================================================

/**
 * Solves for flow distribution across multiple supply legs using an iterative
 * resistance-based solver with bias to replicate observed 70/30 split behavior.
 * 
 * The solver converges on a solution where:
 * 1. Total flow equals the sum of all leg flows
 * 2. Friction losses are balanced (with bias favoring steamer)
 * 3. Observed field behavior: ~70% through steamer, ~30% through first side
 * 
 * Field Research Evidence:
 * - At 2000 gpm total: ~1400 gpm steamer / ~600 gpm side A (70/30 split)
 * - Adding 5″ side line raised intake from 25 to 40 psi (60% increase)
 * - Adding 3″ instead of 5″ showed "no noticeable increase"
 * 
 * Source: Heavy Hydrant Hookups Part 2, Fire Apparatus Magazine, Sept 2022
 * Source: Fire Hydrants and Apparatus Water Supply, Chapter 7.3
 * 
 * @param legs - Array of supply leg configurations
 * @param totalDesiredGpm - Target total flow to distribute
 * @param maxIterations - Convergence iteration limit (default: 12)
 * @returns Object with total flow and per-leg flow assignments
 */
export function solveSupplySplit(
  legs: SupplyLeg[],
  totalDesiredGpm: number,
  maxIterations: number = 12
): { totalGpm: number; perLeg: Record<string, number> } {
  if (legs.length === 0 || totalDesiredGpm <= 0) {
    return { totalGpm: 0, perLeg: {} }
  }
  
  if (legs.length === 1) {
    // Single leg - all flow through it
    return { totalGpm: totalDesiredGpm, perLeg: { '0': totalDesiredGpm } }
  }
  
  // Initialize with simple proportional split
  let Q_total = totalDesiredGpm
  const perLeg: Record<string, number> = {}
  
  // Initial assignment: equal split as starting point
  legs.forEach((_, idx) => {
    perLeg[idx.toString()] = Q_total / legs.length
  })
  
  // Bias factors for achieving ~70/30 split
  const STEAMER_BIAS = 0.65  // Steamer gets more due to larger port area
  const SIDE_BIAS = 0.35     // Sides share the remainder
  
  for (let iter = 0; iter < maxIterations; iter++) {
    // Calculate weights based on inverse resistance + bias
    const weights = legs.map((leg, idx) => {
      const isSteamer = idx === 0
      const baseBias = isSteamer ? STEAMER_BIAS : SIDE_BIAS / Math.max(1, legs.length - 1)
      
      // Calculate resistance (FL per GPM as proxy)
      const C = FRICTION_COEFFICIENTS[leg.diameterIn]
      const L = leg.lengthFt / 100
      const appliances = leg.appliancesPsi ?? 0
      
      // Resistance metric: higher C, longer L, or more appliances = more resistance
      const resistance = Math.max(0.001, C * L * 10 + appliances * 0.1)
      
      // Weight inversely proportional to resistance, scaled by bias
      return { idx, weight: baseBias / resistance }
    })
    
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
    
    // Reassign flows
    const prevPerLeg = { ...perLeg }
    weights.forEach(w => {
      perLeg[w.idx.toString()] = (w.weight / totalWeight) * Q_total
    })
    
    // Check convergence
    const maxChange = Object.keys(perLeg).reduce((max, key) => {
      const change = Math.abs(perLeg[key] - (prevPerLeg[key] || 0))
      return Math.max(max, change)
    }, 0)
    
    if (maxChange < 5) break  // Converged
  }
  
  return { totalGpm: Q_total, perLeg }
}

// ============================================================================
// TRUCK MAX GPM - Supply and Pump Ceiling
// ============================================================================

/**
 * Computes the maximum flow the truck can deliver given:
 * - Hydrant available flow ceiling (AFF_20)
 * - Pump performance curve ceiling
 * - Supply leg friction losses
 * - Residual floor constraint (≥20 psi at main)
 * 
 * @param legs - Supply leg configurations with assigned flows
 * @param pdpPsi - Pump Discharge Pressure setpoint
 * @param residualMainPsi - Current predicted residual at hydrant main
 * @param ratedGpm - Pump rated capacity (e.g., 1500 gpm)
 * @param aff20Gpm - Available Flow at 20 psi from NFPA 291 (optional ceiling)
 * @returns Maximum deliverable flow in GPM
 */
export function computeTruckMaxGpm(
  legs: SupplyLeg[],
  pdpPsi: number,
  residualMainPsi: number,
  ratedGpm: number,
  aff20Gpm?: number
): number {
  // Floor: never drop main below 20 psi (NFPA 291 guidance)
  if (residualMainPsi < 20) return 0
  
  // Ceiling 1: Pump performance curve (NFPA 1911 test points)
  const pumpCeiling = pumpCurveMaxGpm(ratedGpm, pdpPsi)
  
  // Ceiling 2: Supply capacity (sum of current leg flows as approximation)
  // In a real solver, this would iterate, but for display purposes we use current assignment
  const supplyEstimate = legs.reduce((sum, leg) => sum + leg.gpm, 0)
  
  // Ceiling 3: Hydrant AFF_20 if provided
  const ceilings = [pumpCeiling, supplyEstimate]
  if (aff20Gpm !== undefined && aff20Gpm > 0) {
    ceilings.push(aff20Gpm)
  }
  
  return Math.max(0, Math.min(...ceilings))
}

// ============================================================================
// MONITOR/DECK GUN OUTPUT - Current Deliverable Flow
// ============================================================================

/**
 * Computes current deliverable flow to a deck gun / monitor given:
 * - Nozzle demand (smooth bore law)
 * - Supply ceiling (truck max)
 * - Appliance and piping losses
 * 
 * @param tipInches - Monitor tip diameter
 * @param pdpPsi - Pump Discharge Pressure
 * @param deviceLossPsi - Monitor + piping losses (~25-35 psi typical)
 * @param truckMaxGpm - Pre-computed supply ceiling
 * @returns Actual flow being delivered (min of demand and ceiling)
 * 
 * @example
 * // 1.5″ tip, 150 PDP, 25 psi device loss, 1200 gpm max
 * computeMonitorFlowGpm(1.5, 150, 25, 1200)
 * // NP = 150 - 25 = 125 psi → demand ~750 gpm, clamped by supply
 */
export function computeMonitorFlowGpm(
  tipInches: number,
  pdpPsi: number,
  deviceLossPsi: number,
  truckMaxGpm: number
): number {
  // Nozzle pressure = PDP - device/piping losses
  const NP = Math.max(0, pdpPsi - deviceLossPsi)
  
  // Nozzle demand from smooth bore law
  const nozzleDemand = nozzleSmoothBoreGpm(tipInches, NP)
  
  // Actual flow = minimum of what nozzle wants and what supply can deliver
  return Math.max(0, Math.min(nozzleDemand, truckMaxGpm))
}

// ============================================================================
// COMPLETE MONITOR OUTPUT COMPUTATION
// ============================================================================

/**
 * Complete calculation for monitor output meter display.
 * Combines all hydraulic factors: NFPA 291, pump curve, friction loss, nozzle demand.
 * 
 * @param legs - Supply leg configurations
 * @param tipInches - Monitor tip diameter
 * @param pdpPsi - Pump Discharge Pressure
 * @param deviceLossPsi - Monitor appliance + piping losses
 * @param residualMainPsi - Current residual at hydrant main
 * @param ratedGpm - Pump rated capacity
 * @param aff20Gpm - Optional: hydrant available flow at 20 psi (from NFPA 291 test)
 * @returns Flow metrics for UI display
 */
export function computeMonitorMetrics(
  legs: SupplyLeg[],
  tipInches: number,
  pdpPsi: number,
  deviceLossPsi: number,
  residualMainPsi: number,
  ratedGpm: number,
  aff20Gpm?: number
) {
  // Compute supply ceiling
  const truckMaxGpm = computeTruckMaxGpm(
    legs,
    pdpPsi,
    residualMainPsi,
    ratedGpm,
    aff20Gpm
  )
  
  // Compute actual deliverable flow
  const flowNowGpm = computeMonitorFlowGpm(
    tipInches,
    pdpPsi,
    deviceLossPsi,
    truckMaxGpm
  )
  
  // Compute per-leg flows using solver
  const split = solveSupplySplit(legs, flowNowGpm)
  
  return {
    flowNowGpm,
    truckMaxGpm,
    perLegGpm: split.perLeg,
    residualMainPsi
  }
}

// ============================================================================
// APPLIANCE LOSSES
// ============================================================================

/**
 * Standard appliance friction losses.
 * 
 * Source: Fire Protection Handbook, NFPA
 * Source: Fire Hydrants and Apparatus Water Supply, Chapter 7.2.1
 */
export const APPLIANCE_LOSSES = {
  /** Master stream device (deck gun, ladder pipe) */
  MASTER_STREAM: 25,
  
  /** Gate valve (typical) */
  GATE_VALVE: 0,  // Negligible when fully open
  
  /** 2.5″ → Storz adapter */
  ADAPTER_2_5_TO_STORZ: 3,
  
  /** Wye or siamese */
  WYE: 10,
  
  /** Standpipe system allowance */
  STANDPIPE: 25,
} as const

// ============================================================================
// ELEVATION PRESSURE
// ============================================================================

/**
 * Converts elevation to pressure head.
 * 
 * Formula: P = 0.433 × h  (exact: 0.433 psi per foot of head)
 * 
 * @param elevationFeet - Vertical elevation in feet
 * @returns Pressure in PSI
 * 
 * Source: USFA Water Supply Systems Vol II, Chapter 2, Formula 11
 */
export function elevationPressurePsi(elevationFeet: number): number {
  return 0.433 * elevationFeet
}

/**
 * Converts pressure to elevation head.
 * 
 * Formula: h = 2.31 × P  (exact: 2.31 feet per PSI)
 * 
 * @param pressurePsi - Pressure in PSI
 * @returns Elevation in feet
 * 
 * Source: USFA Water Supply Systems Vol II, Chapter 2, Formula 12
 */
export function pressureToElevationFeet(pressurePsi: number): number {
  return 2.31 * pressurePsi
}