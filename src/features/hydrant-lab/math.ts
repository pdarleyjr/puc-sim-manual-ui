import { nozzleSmoothBoreGpm, pumpCurveMaxGpm } from '../../lib/hydraulics'

// FL coefficients per AI_AGENT_TECHNICAL_GUIDE.md and NFPA/IFSTA reference tables
// Formula: FL = C × (Q/100)² × (L/100) where Q is in hundreds of GPM
const C_1_75IN = 15.5  // 1.75" hose per Utah Valley University / IFSTA
const C_2_5IN = 2.0    // 2.5" hose standard coefficient
const C_3IN = 0.8      // 3" hose per technical guide Table 3.2
const C_4IN = 0.2      // 4" LDH standard coefficient
const C_5IN = 0.08     // 5" LDH per IFSTA/NFPA standards

const APPLIANCE_MS = 25  // Master stream device loss (per guide section 3.1)
const ADAPTER_SIDE_5IN = 3  // 2.5" to Storz adapter on side ports
const GATE_VALVE_LOSS = 2  // Gate valve loss at high flows
const HAV_BYPASS_LOSS = 4  // HAV bypass mode internal loss

/**
 * Get friction loss coefficient for a given hose diameter
 */
function getFrictionCoefficient(diameterIn: number): number {
  const coefficients: Record<number, number> = {
    1.75: C_1_75IN,
    2.5: C_2_5IN,
    3: C_3IN,
    4: C_4IN,
    5: C_5IN
  }
  return coefficients[diameterIn] || C_3IN
}

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
  const C = getFrictionCoefficient(diameterIn)
  const Q = gpm / 100
  const L = lengthFt / 100
  return C * Q * Q * L + extraPsi
}

/**
 * Calculate hydrant main valve capacity based on static pressure
 * Based on 5.25" main valve (21.65 in² area)
 * Using empirical data: 80 psi static → ~2700 GPM max (at 30 psi residual)
 * Formula: GPM ≈ K × √(ΔP) where K depends on valve size
 */
function hydrantMainValveCapacity(staticPsi: number): number {
  const residualFloor = 20
  const availablePressure = Math.max(0, staticPsi - residualFloor)
  
  // Empirical coefficient based on 5.25" valve
  // At 80 psi static (60 psi available), max was 2700 GPM → K ≈ 348
  // At 50 psi static (30 psi available), estimate ~2100 GPM
  const K = 348
  return K * Math.sqrt(availablePressure)
}

/**
 * Solve the hydrant system hydraulics using proper resistance-based flow distribution.
 * 
 * Key Physics Principles:
 * - Each leg in parallel experiences the same pressure drop: ΔP = P_hydrant - P_intake
 * - Flow through each leg: ΔP = C × Q² × (L/100) + appliance_losses
 * - Solving for Q: Q = sqrt((ΔP - losses) / (C × L/100))
 * - Total inflow = sum of all leg flows
 * - Steamer naturally carries more flow due to larger port area and shorter path
 * 
 * Critical NFPA 291 Rule:
 * - Hydrant MAIN residual must stay ≥20 psi (fire flow rating standard)
 * - Engine INTAKE can be lower (even <10 psi or slight vacuum during high flow)
 * 
 * Real-World Field Data (Heavy Hydrant Hookups):
 * - Single 5" steamer @ 300ft, 50 psi hydrant: ~1290 gpm, intake ~10 psi
 * - Double 5" (steamer + side A) @ 300ft each: ~1900-2100 gpm total, intake rises to ~25 psi
 * - With 3" side instead of 5": side contributes <200 gpm, steamer still carries >70%
 * 
 * @param s - System configuration (static pressure, legs, HAV, governor)
 * @returns Computed intake pressure, total inflow, and hydrant residual
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

  // NFPA 291 constraint: hydrant main residual floor at 20 psi
  const HYDRANT_MAIN_FLOOR = 20
  
  // HAV boost (only on steamer in boost mode)
  const havBoostPsi = s.hav.enabled && s.hav.mode === 'boost' ? s.hav.boostPsi : 0
  
  // HAV bypass loss (only on steamer in bypass mode)
  const havBypassLoss = s.hav.enabled && s.hav.mode === 'bypass' ? HAV_BYPASS_LOSS : 0

  // Hydrant main valve capacity (ultimate limiter based on 5.25" valve)
  // At 80 psi static: ~2700 GPM max, at 50 psi static: ~2100 GPM max
  const hydrantMaxGpm = hydrantMainValveCapacity(s.staticPsi)
  
  // Governor limit from NFPA 1911 pump curve
  const pumpDraftRating = 1500
  const governorLimit = pumpCurveMaxGpm(pumpDraftRating, s.governorPsi)
  
  // Prepare leg data with resistance factors
  type LegData = {
    leg: any
    C: number
    L: number
    losses: number
    resistance: number
  }
  
  const legData: LegData[] = openLegs.map((leg: any) => {
    const C = getFrictionCoefficient(leg.sizeIn)
    const L = leg.lengthFt / 100  // Convert to hundreds of feet
    
    // Appliance losses
    let losses = 0
    if (leg.id !== 'steamer' && leg.sizeIn === 5) {
      losses += ADAPTER_SIDE_5IN  // 2.5" to Storz adapter on side ports
    }
    if (leg.id !== 'steamer') {
      losses += GATE_VALVE_LOSS  // Gate valve on side ports
    }
    if (leg.id === 'steamer' && s.hav.enabled && s.hav.mode === 'bypass') {
      losses += havBypassLoss  // HAV bypass internal loss
    }
    
    // Resistance factor: higher = more resistance = less flow
    const resistance = C * L
    
    return { leg, C, L, losses, resistance }
  })
  
  // Iteratively solve for flow distribution
  // Start with an estimate and refine based on pressure constraints
  let targetIntakePsi = s.staticPsi * 0.3  // Initial guess: 30% of static
  let iterations = 0
  const maxIterations = 20
  let converged = false
  
  let bestSolution = {
    intakePsi: 0,
    totalGpm: 0,
    hydrantResidual: s.staticPsi,
    legFlows: legData.map(() => 0)
  }
  
  while (iterations < maxIterations && !converged) {
    iterations++
    
    // Calculate flow for each leg based on current intake pressure estimate
    const legFlows: number[] = []
    let totalFlow = 0
    
    for (const ld of legData) {
      // Pressure drop from hydrant to intake
      const availablePressure = Math.max(0, s.staticPsi - targetIntakePsi)
      
      // Account for appliance losses
      const pressureForFriction = Math.max(0, availablePressure - ld.losses)
      
      // Solve for flow: Q = sqrt(ΔP / (C × L/100))
      // From: ΔP = C × Q² × (L/100)
      const Q_hundreds = Math.sqrt(pressureForFriction / Math.max(0.001, ld.resistance))
      const flowGpm = Q_hundreds * 100
      
      legFlows.push(flowGpm)
      totalFlow += flowGpm
    }
    
    // Apply hydrant main valve capacity limit
    if (totalFlow > hydrantMaxGpm) {
      const scale = hydrantMaxGpm / totalFlow
      for (let i = 0; i < legFlows.length; i++) {
        legFlows[i] *= scale
      }
      totalFlow = hydrantMaxGpm
    }
    
    // Calculate actual friction losses with these flows
    let weightedHydrantResidual = 0
    let weightedIntakePsi = 0
    let totalWeight = 0
    
    for (let i = 0; i < legData.length; i++) {
      const ld = legData[i]
      const flow = legFlows[i]
      
      if (flow > 0) {
        // Friction loss in this leg
        const Q_hundreds = flow / 100
        const frictionLoss = ld.C * Q_hundreds * Q_hundreds * ld.L
        const totalLoss = frictionLoss + ld.losses
        
        // This leg's contribution to intake pressure
        let legIntakePsi = s.staticPsi - totalLoss
        
        // Apply HAV boost if applicable (only on steamer in boost mode)
        if (ld.leg.id === 'steamer' && s.hav.enabled && s.hav.mode === 'boost') {
          legIntakePsi += havBoostPsi
        }
        
        // Weight by flow for averaging
        weightedIntakePsi += legIntakePsi * flow
        
        // Hydrant residual (approximate as static minus average friction factor)
        const hydrantContribution = s.staticPsi - (frictionLoss * 0.4)  // Friction mainly in hose, not main
        weightedHydrantResidual += hydrantContribution * flow
        
        totalWeight += flow
      }
    }
    
    const calculatedIntakePsi = totalWeight > 0 ? weightedIntakePsi / totalWeight : 0
    const calculatedHydrantResidual = totalWeight > 0 
      ? Math.max(HYDRANT_MAIN_FLOOR, weightedHydrantResidual / totalWeight)
      : s.staticPsi
    
    // Check if hydrant main constraint is violated
    if (calculatedHydrantResidual < HYDRANT_MAIN_FLOOR + 1) {
      // Hydrant main getting too low, reduce target intake to reduce flow
      targetIntakePsi = Math.max(0, targetIntakePsi * 0.85)
    } else {
      // Check convergence
      const intakeDiff = Math.abs(calculatedIntakePsi - targetIntakePsi)
      if (intakeDiff < 2) {
        converged = true
        bestSolution = {
          intakePsi: calculatedIntakePsi,
          totalGpm: totalFlow,
          hydrantResidual: calculatedHydrantResidual,
          legFlows
        }
      } else {
        // Update target with damping for stability
        targetIntakePsi = (targetIntakePsi + calculatedIntakePsi) / 2
      }
    }
    
    // Store best solution so far
    if (!converged) {
      bestSolution = {
        intakePsi: calculatedIntakePsi,
        totalGpm: totalFlow,
        hydrantResidual: calculatedHydrantResidual,
        legFlows
      }
    }
  }
  
  // Apply governor limit (pump RPM ceiling)
  let finalTotalGpm = bestSolution.totalGpm
  if (finalTotalGpm > governorLimit) {
    const scale = governorLimit / finalTotalGpm
    bestSolution.legFlows = bestSolution.legFlows.map(f => f * scale)
    finalTotalGpm = governorLimit
  }
  
  // Assign flows to legs
  for (let i = 0; i < legData.length; i++) {
    legData[i].leg.gpm = Math.round(bestSolution.legFlows[i])
  }

  return {
    engineIntakePsi: Math.round(bestSolution.intakePsi * 10) / 10,
    totalInflowGpm: Math.round(finalTotalGpm),
    hydrantResidualPsi: Math.round(bestSolution.hydrantResidual * 10) / 10
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