import { nozzleSmoothBoreGpm, pumpCurveMaxGpm } from '../../lib/hydraulics'

// FL coefficients per AI_AGENT_TECHNICAL_GUIDE.md and NFPA/IFSTA reference tables
const C_5IN = 0.025  // 5" LDH - field-calibrated
const C_3IN = 0.8    // 3" hose per technical guide Table 3.2
// const C_175IN = 15.5 // 1.75" hose per technical guide Table 3.2 - for future discharge calculations
const APPLIANCE_MS = 25  // Master stream device loss (per guide section 3.1)
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
 * Solve the hydrant system hydraulics with proper 70/30 flow split
 * 
 * CRITICAL: Field research shows steamer provides ~70% of flow due to larger port.
 * This is NOT equal distribution. A 1500 GPM pump can flow 2700-2900 GPM when 
 * hydrant-supplied with triple tap on good hydrant (50+ psi residual).
 * 
 * Key Facts:
 * - Pump draft rating (e.g., 1510 GPM) is MINIMUM capability
 * - With good hydrant, pump can flow 180-200% of draft rating
 * - Steamer (5" direct) carries ~70% of total flow
 * - Side ports (2.5" with adapters) carry ~15% each
 * - Flow is limited by: hydrant capacity, pump RPM governor, or cavitation
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

  // Pump capacity when HYDRANT-SUPPLIED (not draft)
  // Real-world: 1500 GPM pump can flow 2700-2900 GPM with good hydrant supply
  const pumpDraftRating = 1500
  const pumpHydrantMax = pumpDraftRating * 2.0  // 200% of draft rating with hydrant
  
  // Governor limits based on PDP setting (NFPA 1911 curve still applies)
  const governorLimit = pumpCurveMaxGpm(pumpDraftRating, s.governorPsi) * 2.0

  // Calculate available pressure drop (static minus floor)
  const availableDrop = Math.max(0, s.staticPsi - residualFloor)
  
  // HAV boost (only on steamer in boost mode)
  const havBoostPsi = s.hav.enabled && s.hav.mode === 'boost' ? s.hav.boostPsi : 0

  // CRITICAL: Flow split based on port sizes (field research)
  // Steamer: 5" direct connection = ~70% of flow
  // Side A/B: 2.5" with adapter = ~15% each (combined 30%)
  const steamerLeg = openLegs.find((l: any) => l.id === 'steamer')
  const sideLegs = openLegs.filter((l: any) => l.id !== 'steamer')
  
  // Calculate flow based on available pressure and port resistances
  // Using Hazen-Williams: Q ∝ (ΔP / R)^0.54
  let totalFlow = 0
  
  // Start with estimate based on static pressure
  // Good hydrant at 50 psi can supply 2000+ GPM through single 5" steamer
  const baseFlowPer5in = availableDrop * 28  // ~1400 GPM at 50 psi
  
  // Apply flow split ratios (70/30 rule)
  if (steamerLeg) {
    const steamerExtra = steamerLeg.id !== 'steamer' && steamerLeg.sizeIn === 5 ? ADAPTER_SIDE_5IN : 0
    const flSteamer = flPsiPerLeg(baseFlowPer5in, steamerLeg.sizeIn, steamerLeg.lengthFt, steamerExtra)
    const availablePsiSteamer = Math.max(0, s.staticPsi + havBoostPsi - flSteamer - residualFloor)
    
    // Steamer gets 70% of total system capacity
    steamerLeg.gpm = Math.min(
      availablePsiSteamer * (steamerLeg.sizeIn === 5 ? 28 : 10),
      pumpHydrantMax * 0.70
    )
    totalFlow += steamerLeg.gpm
  }
  
  // Side legs share the remaining 30%
  if (sideLegs.length > 0) {
    const flowPerSide = (pumpHydrantMax * 0.30) / sideLegs.length
    
    sideLegs.forEach((leg: any) => {
      const extra = leg.sizeIn === 5 ? ADAPTER_SIDE_5IN : 0
      const flSide = flPsiPerLeg(flowPerSide, leg.sizeIn, leg.lengthFt, extra)
      const availablePsiSide = Math.max(0, s.staticPsi - flSide - residualFloor)
      
      leg.gpm = Math.min(
        availablePsiSide * (leg.sizeIn === 5 ? 28 : 10),
        flowPerSide
      )
      totalFlow += leg.gpm
    })
  }
  
  // Apply governor ceiling (RPM limit)
  if (totalFlow > governorLimit) {
    const scale = governorLimit / totalFlow
    openLegs.forEach((leg: any) => {
      leg.gpm *= scale
    })
    totalFlow = governorLimit
  }

  // Calculate final intake pressure (weighted average of leg pressures)
  let weightedIntake = 0
  let totalWeight = 0
  
  openLegs.forEach((leg: any) => {
    const extra = leg.id !== 'steamer' && leg.sizeIn === 5 ? ADAPTER_SIDE_5IN : 0
    const fl = flPsiPerLeg(leg.gpm, leg.sizeIn, leg.lengthFt, extra)
    const legBoost = leg.id === 'steamer' && s.hav.enabled && s.hav.mode === 'boost' ? havBoostPsi : 0
    const legIntake = Math.max(residualFloor, s.staticPsi - fl + legBoost)
    
    weightedIntake += legIntake * leg.gpm
    totalWeight += leg.gpm
  })
  
  const engineIntakePsi = totalWeight > 0 
    ? weightedIntake / totalWeight 
    : s.staticPsi

  // Hydrant residual (approximate - pressure at main after all legs drawing)
  const totalFL = openLegs.reduce((sum, leg: any) => {
    const extra = leg.id !== 'steamer' && leg.sizeIn === 5 ? ADAPTER_SIDE_5IN : 0
    return sum + flPsiPerLeg(leg.gpm, leg.sizeIn, leg.lengthFt, extra)
  }, 0) / openLegs.length
  
  const hydrantResidualPsi = Math.max(residualFloor, s.staticPsi - totalFL * 0.5)

  return {
    engineIntakePsi: Math.round(engineIntakePsi * 10) / 10,
    totalInflowGpm: Math.round(totalFlow),
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