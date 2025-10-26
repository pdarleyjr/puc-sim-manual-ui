import type { AppState } from './store'
import { CAVITATION_INTAKE_THRESHOLD, CAVITATION_RPM_THRESHOLD, CAVITATION_DISCHARGE_THRESHOLD } from './constants'
import { useLauncher } from './launcher'

export const selectMasterIntake = (st: AppState) => st.gauges.masterIntake

export const selectMasterDischarge = (st: AppState) => st.gauges.masterDischarge

export const selectRpm = (st: AppState) => st.gauges.rpm

export const selectPumpEngaged = (st: AppState) => st.pumpEngaged

export const selectSource = (st: AppState) => st.source

// Cavitation detection
export const selectCavitating = (st: AppState) => {
  const nearDry = st.gauges.masterIntake <= CAVITATION_INTAKE_THRESHOLD
  const negSuction = st.gauges.masterIntake < 0
  const highDemand = st.gauges.rpm >= CAVITATION_RPM_THRESHOLD || selectMasterDischarge(st) >= CAVITATION_DISCHARGE_THRESHOLD
  return (nearDry || negSuction) && highDemand
}

// Residual pressure badge (hydrant only)
export const selectResidualBadge = (st: AppState): 'green' | 'amber' | 'red' | null => {
  if (st.source !== 'hydrant') return null
  const intake = st.gauges.masterIntake
  if (intake >= 20) return 'green'
  if (intake >= 10) return 'amber'
  return 'red'
}

// Tutorial context detection
export function getEngageContext(): 'panel-only' | 'scenario-prearmed' | 'foam' {
  const m = useLauncher.getState().chosenMode
  if (m === 'scenario') return 'scenario-prearmed'
  if (m === 'foam') return 'foam'
  return 'panel-only'
}

// Hydrant supply selectors
import { K_SUPPLY_5IN, K_SUPPLY_3IN, LOSS_HYDRANT_BODY, K_INTAKE_PLUMB, F_STEAMER_WEIGHT } from './constants'
import type { HydrantOutlet, HoseSizeSupply } from './store'

// Total discharge GPM (helper for hydrant calculations)
export const selectTotalDischargeGpm = (st: AppState) => {
  // Test override support (NODE_ENV === 'test' only)
  if (process.env.NODE_ENV === 'test' && st.__test?.Q_total_override != null) {
    return st.__test.Q_total_override
  }
  return Object.values(st.discharges).reduce((sum, d) => sum + d.gpmNow, 0)
}

// Active legs from tap mode
export const selectActiveLegs = (st: AppState) => {
  const { tapMode, hoses } = st.hydrant
  return {
    steamer: true,
    sideA: tapMode !== 'single',
    sideB: tapMode === 'triple',
    hoses,
  }
}

// Split - size-aware and geometry-weighted with guardrails
export function selectHydrantSplit(st: AppState) {
  const { hoses } = st.hydrant
  
  // Use the connected property from each hose (set by tapMode via normalizeHydrantConnections)
  const useSteamer = hoses.steamer.connected
  const useSideA = hoses.sideA.connected
  const useSideB = hoses.sideB.connected

  const dia = (s: '3' | '5') => (s === '5' ? 5 : 3)
  const legs: Array<{ id: HydrantOutlet; k: number; use: boolean }> = [
    { id: 'steamer', k: F_STEAMER_WEIGHT * Math.pow(dia(hoses.steamer.size), 2), use: useSteamer },
    { id: 'sideA', k: Math.pow(dia(hoses.sideA.size), 2), use: useSideA },
    { id: 'sideB', k: Math.pow(dia(hoses.sideB.size), 2), use: useSideB },
  ]

  const active = legs.filter(l => l.use)
  const K = active.reduce((s, l) => s + l.k, 0)
  const safeK = K > 0 ? K : 1

  const sharesObj = Object.fromEntries(
    active.map(l => [l.id, l.k / safeK])
  ) as Record<HydrantOutlet, number>

  const steamerShare = sharesObj.steamer ?? 1
  const sideShare = (sharesObj.sideA ?? 0) + (sharesObj.sideB ?? 0)

  return { steamer: steamerShare, side: sideShare, perLeg: sharesObj }
}

// Per-leg supply friction
export const supplyLegFL = (size: HoseSizeSupply, lengthFt: number, qGpm: number) => {
  const K = size === '5' ? K_SUPPLY_5IN : K_SUPPLY_3IN
  return K * qGpm * qGpm * (lengthFt / 100)
}

// Residuals given current total system flow Q_total (with Q² intake plumbing loss)
export const selectHydrantResiduals = (st: AppState) => {
  if (st.source !== 'hydrant') {
    return { hydrantResidual: 0, engineIntake: 0 }
  }

  const Q_total = selectTotalDischargeGpm(st)
  const split = selectHydrantSplit(st)
  const { hoses, hydrantStaticPsi } = st.hydrant

  // Per-leg flows
  const qSteamer = Q_total * split.steamer
  const qSideA = Q_total * (split.perLeg.sideA ?? 0)
  const qSideB = Q_total * (split.perLeg.sideB ?? 0)

  // Friction per leg
  const flSteamer = supplyLegFL(hoses.steamer.size, hoses.steamer.lengthFt, qSteamer)
  const flSideA = split.perLeg.sideA ? supplyLegFL(hoses.sideA.size, hoses.sideA.lengthFt, qSideA) : 0
  const flSideB = split.perLeg.sideB ? supplyLegFL(hoses.sideB.size, hoses.sideB.lengthFt, qSideB) : 0

  const totalFL = flSteamer + flSideA + flSideB + LOSS_HYDRANT_BODY
  
  // Q² intake plumbing loss (apparatus intake piping)
  const intakePlumbLoss = K_INTAKE_PLUMB * Q_total * Q_total

  const hydrantResidual = Math.max(0, hydrantStaticPsi - totalFL)
  const engineIntake = Math.max(0, hydrantResidual - intakePlumbLoss)

  return { hydrantResidual, engineIntake }
}

// Badges and advice
export const selectResidualBadges = (st: AppState) => {
  const { hydrantResidual, engineIntake } = selectHydrantResiduals(st)
  const color = (psi: number) => (psi >= 20 ? 'green' : psi >= 10 ? 'amber' : 'red')
  return { hydrantBadge: color(hydrantResidual), intakeBadge: color(engineIntake) }
}

export const selectHydrantAdvice = (st: AppState) => {
  const { hydrantResidual, engineIntake } = selectHydrantResiduals(st)
  const split = selectHydrantSplit(st)
  const any3 = Object.values(st.hydrant.hoses).some(h => h.size === '3' && h.connected)
  return {
    suggestAddLDH: engineIntake < 20 && hydrantResidual >= 20,
    suggestUpsizeTo5: any3 && engineIntake < 20,
    split,
  }
}

// Master intake display value (engineIntake when hydrant, otherwise masterIntake)
export const selectMasterIntakeDisplay = (st: AppState) => {
  if (st.source === 'hydrant') {
    const { engineIntake } = selectHydrantResiduals(st)
    return engineIntake
  }
  return st.gauges.masterIntake
}

// Monitor output meter selector with shallow comparison to prevent infinite loops
import { useStore } from './store'
import { useShallow } from 'zustand/react/shallow'
import {
  computeMonitorMetrics,
  type SupplyLeg as HydraulicsSupplyLeg
} from '../lib/hydraulics'

// Mobile UI selectors
export const selectTankPct = (st: AppState): number => {
  return Math.round((st.gauges.waterGal / st.capacities.water) * 100)
}

export const selectFoamPct = (st: AppState): number => {
  return Math.round((st.gauges.foamGal / st.capacities.foam) * 100)
}

export const selectMasterIntakePsi = (st: AppState): number => {
  return Math.round(st.gauges.masterIntake)
}

export const selectMasterDischargePsi = (st: AppState): number => {
  return Math.round(st.gauges.masterDischarge)
}

export const selectGovernor = (st: AppState): { mode: 'PDP' | 'RPM'; setpoint: number } => {
  return {
    mode: st.governor.mode === 'pressure' ? 'PDP' : 'RPM',
    setpoint: st.governor.mode === 'pressure' ? st.governor.setPsi : st.governor.setRpm
  }
}

export const selectActiveDischarges = (st: AppState) => {
  return Object.values(st.discharges).filter(d => d.open)
}

export function useMonitorNumbers() {
  return useStore(
    useShallow((st) => {
      // Only compute when hydrant is active
      if (st.source !== 'hydrant') {
        return { flowNowGpm: 0, truckMaxGpm: 0, residualPsi: 0 }
      }

      // Get current total discharge flow
      const totalGpm = selectTotalDischargeGpm(st)
      
      // Get flow split distribution
      const split = selectHydrantSplit(st)
      
      // Build supply legs array with assigned flows from split
      const legs: HydraulicsSupplyLeg[] = []
      const { hoses } = st.hydrant
      
      // Steamer leg (always connected)
      if (hoses.steamer.connected) {
        const qSteamer = totalGpm * split.steamer
        legs.push({
          diameterIn: hoses.steamer.size === '5' ? 5 : 3,
          lengthFt: hoses.steamer.lengthFt,
          gpm: qSteamer,
          appliancesPsi: LOSS_HYDRANT_BODY
        })
      }
      
      // Side A leg (connected in double/triple)
      if (hoses.sideA.connected) {
        const qSideA = totalGpm * (split.perLeg.sideA ?? 0)
        legs.push({
          diameterIn: hoses.sideA.size === '5' ? 5 : 3,
          lengthFt: hoses.sideA.lengthFt,
          gpm: qSideA,
          appliancesPsi: 3  // Adapter loss for 2.5″→Storz
        })
      }
      
      // Side B leg (connected in triple only)
      if (hoses.sideB.connected) {
        const qSideB = totalGpm * (split.perLeg.sideB ?? 0)
        legs.push({
          diameterIn: hoses.sideB.size === '5' ? 5 : 3,
          lengthFt: hoses.sideB.lengthFt,
          gpm: qSideB,
          appliancesPsi: 3  // Adapter loss for 2.5″→Storz
        })
      }
      
      // Monitor configuration
      const tipIn = 1.5  // 1.5″ deck gun tip
      const pdpPsi = st.gauges.masterDischarge
      const deviceLossPsi = 25  // Monitor appliance + piping losses
      
      // Pump specifications
      const ratedGpm = 1500  // Typical pumper rating
      
      // Get hydrant residual from existing calculation
      const { hydrantResidual } = selectHydrantResiduals(st)
      
      // Use the complete metrics function
      const metrics = computeMonitorMetrics(
        legs,
        tipIn,
        pdpPsi,
        deviceLossPsi,
        hydrantResidual,
        ratedGpm,
        undefined  // Optional: could add AFF_20 from hydrant test data
      )
      
      return {
        flowNowGpm: metrics.flowNowGpm,
        truckMaxGpm: metrics.truckMaxGpm,
        residualPsi: metrics.residualMainPsi
      }
    })
  )
}