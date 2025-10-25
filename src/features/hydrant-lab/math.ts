import { nozzleSmoothBoreGpm, pumpCurveMaxGpm } from '../../lib/hydraulics'

// FL coefficients per NFPA/IFSTA reference tables
const C_5IN = 0.025  // Field-calibrated for 5" LDH
const C_3IN = 0.50   // Field-calibrated for 3" hose
const APPLIANCE_MS = 25  // Master stream device loss
const ADAPTER_SIDE_5IN = 3  // 2.5" to Storz adapter on side ports

/**
 * Calculate friction loss for a single leg
 * Formula: FL = C × (Q/100)² × (L/100)
 */
export function flPsiPerLeg(
  gpm: number,
  diameterIn: number,
  lengthFt: number,
  extraPsi = 0
): number {
  const C = diameterIn === 5 ? C_5IN : C_3IN
  const Q = gpm / 100
  const L = lengthFt / 100
  return C * Q * Q * L + extraPsi
}

/**
 * Solve the hydrant system hydraulics
 * Returns engine intake pressure, total inflow GPM, and hydrant residual
 */
export function solveHydrantSystem(s: {
  staticPsi: number
  legs: Record<'sideA' | 'steamer' | 'sideB', any>
  hav: any
  governorPsi: number
}): {
  engineIntakePsi: number
  totalInflowGpm: number
  hydrantResidualPsi: number
} {
  // Gather open legs (steamer always open if connected, sides need gate open)
  const openLegs = Object.values(s.legs)
    .filter(Boolean)
    .filter((l: any) => l.id === 'steamer' || l.gateOpen)

  if (openLegs.length === 0) {
    return { engineIntakePsi: 0, totalInflowGpm: 0, hydrantResidualPsi: s.staticPsi }
  }

  // Residual floor per NFPA 291 (≥20 psi at the main)
  const residualFloor = 20

  // Pump curve limit based on governor setpoint
  const pumpMax = pumpCurveMaxGpm(1500, s.governorPsi) // Pierce 1500 base

  // Iterative solver (2-3 passes converges quickly for UI)
  let total = 0
  const updatedLegs = [...openLegs]

  for (let pass = 0; pass < 3; pass++) {
    total = 0

    for (const leg of updatedLegs) {
      // Initial flow guess for this leg
      const guess = pass === 0 ? 600 : leg.gpm

      // Calculate friction loss for this guess
      const extra = leg.id !== 'steamer' && leg.sizeIn === 5 ? ADAPTER_SIDE_5IN : 0
      const fl = flPsiPerLeg(guess, leg.sizeIn, leg.lengthFt, extra)

      // HAV boost only applies to steamer in boost mode
      const havBoost =
        s.hav.enabled && leg.id === 'steamer' && s.hav.mode === 'boost'
          ? s.hav.boostPsi
          : 0

      // Available pressure at intake = static - FL + HAV boost
      const availablePsi = Math.max(0, s.staticPsi - fl + havBoost - residualFloor)

      // Flow is proportional to available pressure (simplified model)
      // More sophisticated: use resistance network solver
      const legGpm = availablePsi * (leg.sizeIn === 5 ? 30 : 8) // Size-based flow factor

      leg.gpm = legGpm
      total += legGpm
    }

    // Apply pump ceiling
    if (total > pumpMax) {
      const scale = pumpMax / total
      updatedLegs.forEach((leg) => {
        leg.gpm *= scale
      })
      total = pumpMax
    }
  }

  // Calculate final intake pressure (simplified: assume uniform distribution)
  const avgFL = updatedLegs.reduce((sum, leg) => {
    const extra = leg.id !== 'steamer' && leg.sizeIn === 5 ? ADAPTER_SIDE_5IN : 0
    return sum + flPsiPerLeg(leg.gpm, leg.sizeIn, leg.lengthFt, extra)
  }, 0) / updatedLegs.length

  const havBoostEffect =
    s.hav.enabled && s.hav.mode === 'boost' ? s.hav.boostPsi * 0.7 : 0

  const engineIntakePsi = Math.max(
    residualFloor,
    s.staticPsi - avgFL + havBoostEffect
  )

  const hydrantResidualPsi = Math.max(residualFloor, engineIntakePsi - 5)

  return {
    engineIntakePsi: Math.round(engineIntakePsi * 10) / 10,
    totalInflowGpm: Math.round(total),
    hydrantResidualPsi: Math.round(hydrantResidualPsi * 10) / 10
  }
}

/**
 * Compute monitor/deck gun output given current supply
 */
export function computeMonitorOutput(
  tipInches: number,
  pdpPsi: number,
  totalInflowGpm: number
): number {
  // Nozzle pressure = PDP - appliance losses
  const NP = Math.max(0, pdpPsi - APPLIANCE_MS)

  // Nozzle demand using smooth bore formula
  const demand = nozzleSmoothBoreGpm(tipInches, NP)

  // Actual flow = min of demand and available supply
  return Math.min(demand, totalInflowGpm)
}