/**
 * CalcEngineV2 Adapter
 * 
 * Transforms Hydrant Lab store state to/from calcEngineV2 pure function inputs.
 * This adapter bridges the impedance mismatch between the store's domain model
 * and calcEngineV2's pure functional API.
 * 
 * Key Transformations:
 * - Store legs → HoseConfig[] for supply lines
 * - Store dischargeLines[] → DischargeConfig[]
 * - Store nozzle types → NozzleConfig (smooth bore vs fog)
 * - HAV boost/bypass → appliance losses
 */

import {
  calcFrictionLoss,
  calcNozzleFlow,
  calcApplianceLoss,
  calcRequiredPDP,
  solveIntakePressure,
  calcPumpPerformance,
  calcHydrantFlow,
  type HoseConfig,
  type NozzleConfig,
  type DischargeConfig
} from './calcEngineV2'
import type { Leg, PortId, Hav, DischargeLine, NozzleType, NozzleSpec } from '../features/hydrant-lab/store'
import { NOZZLE_LIBRARY } from '../features/hydrant-lab/store'

/**
 * Transform store's Leg array to calcEngineV2 HoseConfig
 * Collects all open supply legs (steamer always open, sides need gate open)
 */
function transformSupplyLegs(
  legs: Record<PortId, Leg | null>,
  hav: Hav
): HoseConfig[] {
  const openLegs = Object.values(legs)
    .filter(Boolean)
    .filter((leg) => leg!.id === 'steamer' || leg!.gateOpen)
  
  return openLegs.map((leg) => {
    const hoseConfig: HoseConfig = {
      diameter: leg!.sizeIn,
      length: leg!.lengthFt
    }
    
    // Note: calcEngineV2 doesn't directly handle appliance losses in HoseConfig
    // We'll handle HAV and adapters separately in the appliance loss calculation
    return hoseConfig
  })
}

/**
 * Transform store's discharge line to calcEngineV2 DischargeConfig
 */
function transformDischargeLine(line: DischargeLine): DischargeConfig {
  const nozzleSpec = NOZZLE_LIBRARY[line.nozzleType]
  
  // Map store nozzle type to calcEngineV2 NozzleConfig
  const nozzle: NozzleConfig = {
    type: nozzleSpec.isConstantFlow ? 'fog' : 'smooth_bore',
    pressure: nozzleSpec.nozzlePressurePsi,
    ...(nozzleSpec.isConstantFlow 
      ? { ratedFlow: nozzleSpec.flowGpm }
      : { diameter: nozzleSpec.tipInches }
    )
  }
  
  const hose: HoseConfig = {
    diameter: line.hoseDiameterIn,
    length: line.hoseLengthFt
  }
  
  // Note: "fittings" is not in appliances.json, using gate_valve instead
  // Standard appliances: gate valves, wyes, etc.
  const appliances: string[] = ['gate_valve']
  
  return {
    nozzle,
    hose,
    appliances
  }
}

/**
 * Calculate total appliance losses for supply side
 * This handles HAV boost/bypass and adapter losses that aren't in calcEngineV2's HoseConfig
 */
function calculateSupplyAppliances(legs: Record<PortId, Leg | null>, hav: Hav): number {
  let totalLoss = 0
  
  // HAV bypass loss (on steamer in bypass mode)
  if (hav.enabled && hav.mode === 'bypass') {
    totalLoss += 4  // HAV_BYPASS_LOSS from math.ts
  }
  
  // Adapter losses on side ports with 5" hose
  Object.values(legs).forEach((leg) => {
    if (leg && leg.id !== 'steamer' && leg.sizeIn === 5) {
      totalLoss += 3  // ADAPTER_SIDE_5IN from math.ts
    }
  })
  
  // Gate valve losses on side ports
  Object.values(legs).forEach((leg) => {
    if (leg && leg.id !== 'steamer' && leg.gateOpen) {
      totalLoss += 2  // GATE_VALVE_LOSS from math.ts
    }
  })
  
  return totalLoss
}

/**
 * Solve hydrant system using calcEngineV2
 * 
 * This replaces the complex iterative solver in math.ts with calcEngineV2's
 * pure functional approach. Key differences:
 * - calcEngineV2 uses NFPA formulas directly
 * - Parallel flow distribution based on resistance
 * - Uses calcHydrantFlow for main valve capacity
 * 
 * @returns Same format as math.ts solveHydrantSystem
 */
export function solveHydrantSystemV2(state: {
  staticPsi: number
  legs: Record<PortId, Leg | null>
  hav: Hav
  governorPsi: number
  dischargeLines: DischargeLine[]
  pumpDischargePressurePsi: number
}): {
  engineIntakePsi: number
  totalInflowGpm: number
  hydrantResidualPsi: number
} {
  // Transform supply legs
  const supplyLegs = transformSupplyLegs(state.legs, state.hav)
  
  if (supplyLegs.length === 0) {
    return {
      engineIntakePsi: 0,
      totalInflowGpm: 0,
      hydrantResidualPsi: state.staticPsi
    }
  }
  
  // Calculate hydrant capacity using NFPA 291
  // Assume test flow at 80% static pressure yields 2500 GPM (typical 5.25" valve)
  const testFlow = 2500
  const testResidual = state.staticPsi * 0.8
  const hydrantMaxGpm = calcHydrantFlow(state.staticPsi, testResidual, testFlow, 20)
  
  // Governor limit based on NFPA 1911 pump curve
  const pumpRating = 1500
  let governorPercentage = 1.0
  if (state.governorPsi > 250) {
    governorPercentage = 0.50
  } else if (state.governorPsi > 200) {
    governorPercentage = 0.50 + (250 - state.governorPsi) / 250 * 0.20
  } else if (state.governorPsi > 150) {
    governorPercentage = 0.70 + (200 - state.governorPsi) / 200 * 0.30
  }
  const governorLimit = pumpRating * governorPercentage
  
  // Calculate what the supply system can deliver independent of discharge demand
  // This matches V1 behavior where supply is calculated first, then discharge uses it
  
  // Target intake pressure (aim for reasonable positive pressure)
  const targetIntakePsi = Math.max(20, state.staticPsi * 0.4)
  
  // Calculate parallel flow distribution across supply legs
  // Each leg resists flow based on C × L, flow distributes inversely to resistance
  const legData = supplyLegs.map(leg => {
    const C = leg.diameter === 5 ? 0.08 : leg.diameter === 3 ? 0.8 : 2.0
    const L = leg.length / 100
    const resistance = C * L
    return { leg, resistance }
  })
  
  const totalConductance = legData.reduce((sum, ld) => sum + (1 / ld.resistance), 0)
  
  // Calculate available pressure for friction
  const HYDRANT_MAIN_FLOOR = 20
  const availablePressure = state.staticPsi - HYDRANT_MAIN_FLOOR - targetIntakePsi
  
  // Calculate flow per leg based on available pressure and resistance
  const legFlows = legData.map((ld, i) => {
    // Get original leg for appliance losses
    const originalLegs = Object.values(state.legs).filter(Boolean)
    const originalLeg = originalLegs[i]
    
    let applianceLoss = 0
    if (originalLeg?.id !== 'steamer' && originalLeg?.sizeIn === 5) {
      applianceLoss += 3  // Adapter
    }
    if (originalLeg?.id !== 'steamer') {
      applianceLoss += 2  // Gate valve
    }
    if (originalLeg?.id === 'steamer' && state.hav.enabled && state.hav.mode === 'bypass') {
      applianceLoss += 4  // HAV bypass
    }
    
    // Pressure available for friction in this leg
    const pressureForFriction = Math.max(0, availablePressure - applianceLoss)
    
    // Solve for flow: Q = sqrt(ΔP / (C × L/100)) × 100
    const flow = Math.sqrt(pressureForFriction / Math.max(0.001, ld.resistance)) * 100
    return flow
  })
  
  let totalFlow = legFlows.reduce((sum, f) => sum + f, 0)
  
  // Limit by hydrant capacity
  if (totalFlow > hydrantMaxGpm) {
    const scale = hydrantMaxGpm / totalFlow
    legFlows.forEach((_, i) => legFlows[i] *= scale)
    totalFlow = hydrantMaxGpm
  }
  
  // Limit by governor
  if (totalFlow > governorLimit) {
    const scale = governorLimit / totalFlow
    legFlows.forEach((_, i) => legFlows[i] *= scale)
    totalFlow = governorLimit
  }
  
  // Calculate actual intake pressure based on flows
  let weightedIntakePsi = 0
  let totalWeight = 0
  
  legData.forEach((ld, i) => {
    const flow = legFlows[i]
    if (flow > 0) {
      const frictionLoss = calcFrictionLoss(flow, ld.leg)
      
      // Calculate appliance losses for this leg
      const originalLegs = Object.values(state.legs).filter(Boolean)
      const originalLeg = originalLegs[i]
      let applianceLoss = 0
      
      if (originalLeg?.id !== 'steamer' && originalLeg?.sizeIn === 5) {
        applianceLoss += 3  // Adapter
      }
      if (originalLeg?.id !== 'steamer') {
        applianceLoss += 2  // Gate valve
      }
      if (originalLeg?.id === 'steamer' && state.hav.enabled && state.hav.mode === 'bypass') {
        applianceLoss += 4  // HAV bypass
      }
      
      // Intake pressure for this leg
      let legIntakePsi = state.staticPsi - frictionLoss - applianceLoss
      
      // Apply HAV boost if applicable (only on steamer in boost mode)
      if (originalLeg?.id === 'steamer' && state.hav.enabled && state.hav.mode === 'boost') {
        legIntakePsi += state.hav.boostPsi
      }
      
      weightedIntakePsi += legIntakePsi * flow
      totalWeight += flow
    }
  })
  
  const engineIntakePsi = totalWeight > 0 ? weightedIntakePsi / totalWeight : 0
  
  // Hydrant residual (approximate based on flow)
  const flowRatio = totalFlow / Math.max(hydrantMaxGpm, 1)
  const pressureDrop = (state.staticPsi - HYDRANT_MAIN_FLOOR) * flowRatio * 0.5
  const hydrantResidual = Math.max(HYDRANT_MAIN_FLOOR, state.staticPsi - pressureDrop)
  
  return {
    engineIntakePsi: Math.round(engineIntakePsi * 10) / 10,
    totalInflowGpm: Math.round(totalFlow),
    hydrantResidualPsi: Math.round(hydrantResidual * 10) / 10
  }
}

/**
 * Calculate discharge line performance using calcEngineV2
 * 
 * This replaces the computeDischarges function in store.ts with calcEngineV2 logic
 */
export function computeDischargesV2(
  lines: DischargeLine[],
  pdpPsi: number,
  supplyGpm: number,
  intakePsi: number,
  governorPsi: number
): {
  totalDemand: number
  totalFlow: number
  cavitating: boolean
  governorLimited: boolean
  updatedLines: DischargeLine[]
} {
  const openLines = lines.filter(line => line.gateOpen)
  
  if (openLines.length === 0) {
    return {
      totalDemand: 0,
      totalFlow: 0,
      cavitating: false,
      governorLimited: false,
      updatedLines: lines
    }
  }
  
  // Calculate demand for each line using calcEngineV2
  let totalDemand = 0
  const updatedLines = lines.map(line => {
    if (!line.gateOpen) {
      return { ...line, calculatedGpm: 0, requiredGpm: 0, frictionLossPsi: 0 }
    }
    
    const discharge = transformDischargeLine(line)
    
    // Calculate required flow
    const requiredGpm = calcNozzleFlow(discharge.nozzle)
    
    // Calculate friction loss
    const frictionLoss = calcFrictionLoss(requiredGpm, discharge.hose)
    
    // Calculate appliance loss (gates, fittings)
    const applianceLoss = calcApplianceLoss(discharge.appliances)
    
    totalDemand += requiredGpm
    
    return {
      ...line,
      requiredGpm,
      frictionLossPsi: frictionLoss + applianceLoss,
      calculatedGpm: 0  // Will be set below
    }
  })
  
  // Check cavitation risk
  const minIntakeForPDP = pdpPsi > 200 ? 15 : pdpPsi > 150 ? 10 : 5
  const cavitating = intakePsi < minIntakeForPDP
  
  // Check governor limit using pump performance curve
  const pumpRating = 1500
  const maxPressure = calcPumpPerformance(pumpRating, totalDemand, 150)
  const governorLimited = pdpPsi > maxPressure
  
  // Actual deliverable flow
  let actualFlow = Math.min(totalDemand, supplyGpm)
  
  if (cavitating) {
    actualFlow = Math.min(actualFlow, supplyGpm * 0.5)
  }
  
  // Distribute flow proportionally
  const scale = totalDemand > 0 ? actualFlow / totalDemand : 0
  const finalLines = updatedLines.map(line => ({
    ...line,
    calculatedGpm: line.gateOpen ? Math.round(line.requiredGpm * scale) : 0
  }))
  
  return {
    totalDemand: Math.round(totalDemand),
    totalFlow: Math.round(actualFlow),
    cavitating,
    governorLimited,
    updatedLines: finalLines
  }
}

/**
 * Get a comparison between V1 (math.ts) and V2 (calcEngineV2) engines
 * Used by ComparisonDevPage for side-by-side analysis
 */
export function compareEngines(state: {
  staticPsi: number
  legs: Record<PortId, Leg | null>
  hav: Hav
  governorPsi: number
  dischargeLines: DischargeLine[]
  pumpDischargePressurePsi: number
}) {
  // Run V2 engine
  const v2Supply = solveHydrantSystemV2(state)
  const v2Discharge = computeDischargesV2(
    state.dischargeLines,
    state.pumpDischargePressurePsi,
    v2Supply.totalInflowGpm,
    v2Supply.engineIntakePsi,
    state.governorPsi
  )
  
  return {
    v2: {
      supply: v2Supply,
      discharge: v2Discharge
    }
  }
}