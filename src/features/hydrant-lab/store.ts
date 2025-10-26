import { create } from 'zustand'
import { solveHydrantSystem } from './math'

export type PortId = 'sideA' | 'steamer' | 'sideB'

export type Leg = {
  id: PortId
  sizeIn: 3 | 5
  lengthFt: number
  gateOpen?: boolean      // sides only
  adapterPsi?: number     // +3 psi when 2.5"→Storz on side ports with 5"
  gpm: number             // solved each frame
}

export type Hav = {
  enabled: boolean
  mode: 'bypass' | 'boost'
  outlets: 1 | 2
  boostPsi: number // 0–50; active only in 'boost'
}

/**
 * Nozzle types available in the simulator
 */
export type NozzleType = 
  | 'smooth-bore-1.75'    // 1.75" smooth bore handline (50 psi NP)
  | 'smooth-bore-2.5'     // 2.5" smooth bore handline (50 psi NP)
  | 'fog-1.75-75'         // 1.75" fog nozzle, 75 psi, ~175 GPM
  | 'fog-1.75-100'        // 1.75" fog nozzle, 100 psi, ~200 GPM
  | 'fog-2.5-100'         // 2.5" fog nozzle, 100 psi, ~250 GPM
  | 'smooth-bore-monitor' // Deck gun/monitor with smooth bore (80 psi NP)
  | 'blitz-monitor'       // Blitz fire monitor (~500 GPM at 100 psi)
  | 'deck-gun'            // Deck gun (~1000 GPM at 100 psi)
  | 'water-cannon'        // Fictitious max-flow device for testing limits

/**
 * Nozzle specifications
 */
export interface NozzleSpec {
  id: NozzleType
  name: string
  description: string
  nozzlePressurePsi: number  // Operating pressure at nozzle
  flowGpm: number           // Flow at rated pressure (for constant-flow)
  tipInches?: number        // For smooth bore nozzles
  isConstantFlow: boolean   // True for fog, false for smooth bore
}

/**
 * Library of available nozzles
 */
export const NOZZLE_LIBRARY: Record<NozzleType, NozzleSpec> = {
  'smooth-bore-1.75': {
    id: 'smooth-bore-1.75',
    name: '1.75" Smooth Bore',
    description: '1.75" handline with 15/16" tip',
    nozzlePressurePsi: 50,
    flowGpm: 185,
    tipInches: 15/16,
    isConstantFlow: false
  },
  'smooth-bore-2.5': {
    id: 'smooth-bore-2.5',
    name: '2.5" Smooth Bore',
    description: '2.5" handline with 1-1/8" tip',
    nozzlePressurePsi: 50,
    flowGpm: 265,
    tipInches: 1.125,
    isConstantFlow: false
  },
  'fog-1.75-75': {
    id: 'fog-1.75-75',
    name: '1.75" Fog (75 PSI)',
    description: '1.75" combination nozzle, 175 GPM @ 75 PSI',
    nozzlePressurePsi: 75,
    flowGpm: 175,
    isConstantFlow: true
  },
  'fog-1.75-100': {
    id: 'fog-1.75-100',
    name: '1.75" Fog (100 PSI)',
    description: '1.75" combination nozzle, 200 GPM @ 100 PSI',
    nozzlePressurePsi: 100,
    flowGpm: 200,
    isConstantFlow: true
  },
  'fog-2.5-100': {
    id: 'fog-2.5-100',
    name: '2.5" Fog (100 PSI)',
    description: '2.5" combination nozzle, 250 GPM @ 100 PSI',
    nozzlePressurePsi: 100,
    flowGpm: 250,
    isConstantFlow: true
  },
  'smooth-bore-monitor': {
    id: 'smooth-bore-monitor',
    name: 'Smooth Bore Monitor',
    description: 'Master stream with 1.5" tip @ 80 PSI',
    nozzlePressurePsi: 80,
    flowGpm: 800,
    tipInches: 1.5,
    isConstantFlow: false
  },
  'blitz-monitor': {
    id: 'blitz-monitor',
    name: 'Blitz Monitor',
    description: 'Portable monitor, ~500 GPM @ 100 PSI',
    nozzlePressurePsi: 100,
    flowGpm: 500,
    isConstantFlow: true
  },
  'deck-gun': {
    id: 'deck-gun',
    name: 'Deck Gun',
    description: 'Deck-mounted master stream, ~1000 GPM',
    nozzlePressurePsi: 100,
    flowGpm: 1000,
    isConstantFlow: true
  },
  'water-cannon': {
    id: 'water-cannon',
    name: 'Water Cannon',
    description: 'Fictitious max-flow device for testing pump limits',
    nozzlePressurePsi: 100,
    flowGpm: 5000,  // Intentionally high to test limits
    isConstantFlow: true
  }
}

/**
 * Discharge line configuration
 */
export interface DischargeLine {
  id: string
  hoseDiameterIn: 1.75 | 2.5 | 3 | 4 | 5
  hoseLengthFt: number
  nozzleType: NozzleType
  gateOpen: boolean
  calculatedGpm: number  // Actual flow delivered
  requiredGpm: number    // Flow demanded by nozzle
  frictionLossPsi: number
}

type LabState = {
  staticPsi: number
  hydrantResidualPsi: number
  legs: Record<PortId, Leg | null>
  hav: Hav
  engineIntakePsi: number
  totalInflowGpm: number
  governorPsi: number
  
  // Discharge system
  dischargeLines: DischargeLine[]
  pumpDischargePressurePsi: number  // PDP setpoint
  totalDischargeDemandGpm: number   // Sum of all discharge demands
  totalDischargeFlowGpm: number     // Actual flow being delivered
  pumpCavitating: boolean
  governorLimited: boolean
  
  // NEW: Discharge bench for testing evolutions
  dischargeBench: {
    enabled: boolean
    evolutionId: string
    gatePercent: number
    lengthFtOverride?: number
  }
  
  setGovernor: (psi: number) => void
  setLeg: (id: PortId, mut: (l: Leg) => void) => void
  toggleGate: (id: 'sideA' | 'sideB') => void
  attachLeg: (id: PortId, size: 3 | 5) => void
  detachLeg: (id: PortId) => void
  setStatic: (psi: number) => void
  setHavEnabled: (enabled: boolean) => void
  setHavMode: (mode: 'bypass' | 'boost') => void
  setHavOutlets: (outlets: 1 | 2) => void
  setHavBoost: (psi: number) => void
  
  // Discharge methods
  setPDP: (psi: number) => void
  addDischargeLine: (nozzleType: NozzleType, hoseDiameter: DischargeLine['hoseDiameterIn'], hoseLength: number) => void
  removeDischargeLine: (id: string) => void
  updateDischargeLine: (id: string, mut: (line: DischargeLine) => void) => void
  toggleDischargeGate: (id: string) => void
  
  // NEW: Discharge bench methods
  setDischargeBench: (partial: Partial<LabState['dischargeBench']>) => void
  
  recompute: () => void
}

export const useHydrantLab = create<LabState>((set, get) => ({
  staticPsi: 80,
  hydrantResidualPsi: 78,
  legs: { 
    sideA: null, 
    steamer: { id: 'steamer', sizeIn: 5, lengthFt: 100, gpm: 0 }, 
    sideB: null 
  },
  hav: { enabled: false, mode: 'bypass', outlets: 1, boostPsi: 0 },
  engineIntakePsi: 34,
  totalInflowGpm: 0,
  governorPsi: 150,
  
  // Discharge system initial state
  dischargeLines: [],
  pumpDischargePressurePsi: 150,
  totalDischargeDemandGpm: 0,
  totalDischargeFlowGpm: 0,
  pumpCavitating: false,
  governorLimited: false,
  
  // NEW: Discharge bench initial state
  dischargeBench: {
    enabled: true,
    evolutionId: '25-sb-1-18',  // default to 2½" SB 1⅛"
    gatePercent: 100,
  },
  
  setGovernor: (psi) => {
    set({ governorPsi: Math.max(50, Math.min(300, psi)) })
    get().recompute()
  },
  
  setStatic: (psi) => {
    set({ staticPsi: Math.max(20, Math.min(200, psi)) })
    get().recompute()
  },
  
  attachLeg: (id, size) => {
    const isGated = id !== 'steamer'
    const adapterPsi = (id !== 'steamer' && size === 5) ? 3 : 0
    set(s => ({
      legs: {
        ...s.legs,
        [id]: {
          id,
          sizeIn: size,
          lengthFt: 100,
          gateOpen: isGated ? true : undefined,
          adapterPsi,
          gpm: 0
        }
      }
    }))
    get().recompute()
  },
  
  detachLeg: (id) => {
    set(s => ({
      legs: { ...s.legs, [id]: null }
    }))
    get().recompute()
  },
  
  setLeg: (id, mut) => {
    set(s => {
      const leg = s.legs[id]
      if (!leg) return s
      
      const updated = { ...leg }
      mut(updated)
      
      return {
        legs: { ...s.legs, [id]: updated }
      }
    })
    get().recompute()
  },
  
  toggleGate: (id) => {
    set(s => {
      const leg = s.legs[id]
      if (!leg || !('gateOpen' in leg)) return s
      
      return {
        legs: {
          ...s.legs,
          [id]: { ...leg, gateOpen: !leg.gateOpen }
        }
      }
    })
    get().recompute()
  },
  
  setHavEnabled: (enabled) => {
    set(s => ({ hav: { ...s.hav, enabled } }))
    get().recompute()
  },
  
  setHavMode: (mode) => {
    set(s => ({ hav: { ...s.hav, mode } }))
    get().recompute()
  },
  
  setHavOutlets: (outlets) => {
    set(s => ({ hav: { ...s.hav, outlets } }))
    get().recompute()
  },
  
  setHavBoost: (psi) => {
    const clamped = Math.max(0, Math.min(50, psi))
    set(s => ({ hav: { ...s.hav, boostPsi: clamped } }))
    get().recompute()
  },
  
  // Discharge system methods
  setPDP: (psi) => {
    set({ pumpDischargePressurePsi: Math.max(50, Math.min(300, psi)) })
    get().recompute()
  },
  
  addDischargeLine: (nozzleType, hoseDiameter, hoseLength) => {
    const newLine: DischargeLine = {
      id: `discharge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      hoseDiameterIn: hoseDiameter,
      hoseLengthFt: hoseLength,
      nozzleType,
      gateOpen: true,
      calculatedGpm: 0,
      requiredGpm: 0,
      frictionLossPsi: 0
    }
    
    set(s => ({
      dischargeLines: [...s.dischargeLines, newLine]
    }))
    get().recompute()
  },
  
  removeDischargeLine: (id) => {
    set(s => ({
      dischargeLines: s.dischargeLines.filter(line => line.id !== id)
    }))
    get().recompute()
  },
  
  updateDischargeLine: (id, mut) => {
    set(s => ({
      dischargeLines: s.dischargeLines.map(line => {
        if (line.id !== id) return line
        const updated = { ...line }
        mut(updated)
        return updated
      })
    }))
    get().recompute()
  },
  
  toggleDischargeGate: (id) => {
    set(s => ({
      dischargeLines: s.dischargeLines.map(line =>
        line.id === id ? { ...line, gateOpen: !line.gateOpen } : line
      )
    }))
    get().recompute()
  },
  
  // NEW: Discharge bench method
  setDischargeBench: (partial) => {
    set(s => ({
      dischargeBench: { ...s.dischargeBench, ...partial }
    }))
    get().recompute()
  },
  
  recompute: () => {
    const s = get()
    
    // Compute supply side (hydrant to pump intake)
    const { engineIntakePsi, totalInflowGpm, hydrantResidualPsi } =
      solveHydrantSystem(s)
    
    // Compute discharge side (pump to nozzles)
    const { 
      totalDemand, 
      totalFlow, 
      cavitating, 
      governorLimited,
      updatedLines 
    } = computeDischarges(
      s.dischargeLines,
      s.pumpDischargePressurePsi,
      totalInflowGpm,
      engineIntakePsi,
      s.governorPsi
    )
    
    set({ 
      engineIntakePsi, 
      totalInflowGpm, 
      hydrantResidualPsi,
      totalDischargeDemandGpm: totalDemand,
      totalDischargeFlowGpm: totalFlow,
      pumpCavitating: cavitating,
      governorLimited,
      dischargeLines: updatedLines
    })
  }
}))

/**
 * Calculate friction loss in discharge hose
 * Using standard fire service friction loss formula: FL = C × (Q/100)² × (L/100)
 * Coefficients from IFSTA/NFPA standards (Utah Valley University reference)
 */
function dischargeFrictionLoss(
  gpm: number, 
  diameterIn: number, 
  lengthFt: number
): number {
  // Standard fire service coefficients per IFSTA/NFPA
  const coefficients: Record<number, number> = {
    1.75: 15.5,  // 1.75" handline per IFSTA
    2.5: 2.0,    // 2.5" hose standard coefficient
    3: 0.8,      // 3" hose per technical guide
    4: 0.2,      // 4" LDH standard coefficient
    5: 0.08      // 5" LDH per IFSTA/NFPA standards
  }
  
  const C = coefficients[diameterIn] || 2.0
  const Q = gpm / 100
  const L = lengthFt / 100
  return C * Q * Q * L
}

/**
 * Compute discharge line flows and pump limits
 * 
 * Key Facts:
 * - Pump is rated at 1500 GPM from DRAFT
 * - When hydrant-supplied, the HYDRANT provides the flow (up to ~2500 GPM)
 * - Pump's job: boost pressure without cavitating
 * - Cavitation occurs when intake pressure drops too low (< 10 psi)
 * - Governor limits pump based on PDP and NFPA 1911 curve
 */
function computeDischarges(
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
  // Filter to open discharge lines
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
  
  // Calculate demand for each line
  let totalDemand = 0
  const updatedLines = lines.map(line => {
    if (!line.gateOpen) {
      return { ...line, calculatedGpm: 0, requiredGpm: 0, frictionLossPsi: 0 }
    }
    
    const nozzle = NOZZLE_LIBRARY[line.nozzleType]
    
    // Calculate required flow at nozzle
    let requiredGpm = nozzle.flowGpm
    
    // Calculate friction loss in hose
    const fl = dischargeFrictionLoss(requiredGpm, line.hoseDiameterIn, line.hoseLengthFt)
    
    // Pressure available at nozzle = PDP - FL - appliances
    const nozzlePressure = Math.max(0, pdpPsi - fl - 10) // 10 psi for appliances/fittings
    
    // For smooth bore, adjust flow based on actual pressure
    if (!nozzle.isConstantFlow && nozzle.tipInches) {
      // Q = 29.7 × d² × √P
      requiredGpm = 29.7 * nozzle.tipInches * nozzle.tipInches * Math.sqrt(nozzlePressure)
    }
    
    totalDemand += requiredGpm
    
    return {
      ...line,
      requiredGpm,
      frictionLossPsi: fl,
      calculatedGpm: 0  // Will be set below based on available supply
    }
  })
  
  // Check cavitation risk: intake pressure must be positive
  // Net Positive Suction Head (NPSH) requirement
  // When pumping at high PDP, need higher intake pressure
  const minIntakeForPDP = pdpPsi > 200 ? 15 : pdpPsi > 150 ? 10 : 5
  const cavitating = intakePsi < minIntakeForPDP
  
  // Check governor limit (based on NFPA 1911 pump curve)
  // At 150 psi: 100% of rated capacity = 1500 GPM
  // At 200 psi: 70% of rated capacity = 1050 GPM
  // At 250 psi: 50% of rated capacity = 750 GPM
  const pumpDraftRating = 1500
  let governorPercentage = 1.0
  if (governorPsi > 250) {
    governorPercentage = 0.50
  } else if (governorPsi > 200) {
    governorPercentage = 0.50 + (250 - governorPsi) / 250 * 0.20
  } else if (governorPsi > 150) {
    governorPercentage = 0.70 + (200 - governorPsi) / 200 * 0.30
  }
  const governorLimit = pumpDraftRating * governorPercentage
  
  const governorLimited = totalDemand > governorLimit
  
  // Determine actual deliverable flow
  // Limited by: supply from hydrant, governor, or cavitation
  let actualFlow = Math.min(totalDemand, supplyGpm, governorLimit)
  
  // If cavitating, pump cannot maintain flow
  if (cavitating) {
    actualFlow = Math.min(actualFlow, supplyGpm * 0.5)
  }
  
  // Distribute flow to discharge lines proportionally
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