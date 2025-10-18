import { create } from 'zustand'

export type Source = 'tank' | 'hydrant'
export type DischargeId = 'xlay1' | 'xlay2' | 'xlay3' | 'trashline' | 'twohalfA'

// Hydraulics constants
const HOSE_COEFF_C = 6.59                 // Key Combat Ready 1¾″
const NOZZLE_RATED_GPM = 175
const NOZZLE_RATED_NP = 75
const K_FACTOR = NOZZLE_RATED_GPM / Math.sqrt(NOZZLE_RATED_NP)

const LEN_CROSSLAY = 200
const LEN_TRASHLINE = 100
const LEN_TWOHALF_A = 200

export interface Discharge {
  id: DischargeId
  label: string
  open: boolean
  setPsi: number
  foamCapable: boolean
  lengthFt: number
  gpmNow: number
  gallonsThisEng: number
}

export interface Gauges {
  masterIntake: number      // -10..200, display clamps to 0..200 when hydrant
  masterDischarge: number   // 0..400 (highest open line)
  rpm: number               // 650..2200
  waterGal: number          // 0..720
  foamGal: number           // 0..30
}

export interface Totals {
  gpmTotalNow: number
  gallonsPumpThisEng: number
}

export interface AppState {
  pumpEngaged: boolean
  source: Source
  foamEnabled: boolean
  discharges: Record<DischargeId, Discharge>
  gauges: Gauges
  totals: Totals
  capacities: { water: 720; foam: 30 }
  soundOn: boolean
  targetRpm: number
  lastSimTick: number

  // Actions
  engagePump: (mode: 'water' | 'foam') => void
  disengagePump: () => void
  setSource: (s: Source) => void
  setIntakePsi: (psi: number) => void
  setLine: (id: DischargeId, patch: Partial<Discharge>) => void
  recomputeMasters: () => void
  tickRpm: () => void
  setSoundOn: (on: boolean) => void
  simTick: () => void
}

const ENGINE_IDLE = 650
const PUMP_BASE = 750
const MAX_RPM = 2200
const A = 0.6   // rpm per psi of master discharge
const B = 0.15  // rpm relief per psi of hydrant intake

function targetRpm(state: AppState): number {
  if (!state.pumpEngaged) return ENGINE_IDLE
  const md = Math.max(
    ...Object.values(state.discharges).map(d => d.open ? d.setPsi : 0),
    0
  )
  const relief = state.source === 'hydrant' ? B * state.gauges.masterIntake : 0
  return Math.max(ENGINE_IDLE, Math.min(MAX_RPM, Math.round(PUMP_BASE + A * md - relief)))
}

// Flow computation from PDP
function computeFogFlowFromPdp(pdp: number, lengthFt: number): { gpm: number; np: number; fl: number } {
  if (pdp <= 0) return { gpm: 0, np: 0, fl: 0 }
  const a = (1 / (K_FACTOR * K_FACTOR)) + (HOSE_COEFF_C * (lengthFt / 1_000_000))
  const q2 = pdp / a
  const gpm = Math.sqrt(Math.max(0, q2))
  const np = (gpm / K_FACTOR) ** 2
  const fl = pdp - np
  return { gpm, np, fl }
}

export const useStore = create<AppState>((set, get) => ({
  pumpEngaged: false,
  source: 'tank',
  foamEnabled: false,
  discharges: {
    xlay1: { id: 'xlay1', label: 'Crosslay 1', open: false, setPsi: 0, foamCapable: true, lengthFt: LEN_CROSSLAY, gpmNow: 0, gallonsThisEng: 0 },
    xlay2: { id: 'xlay2', label: 'Crosslay 2', open: false, setPsi: 0, foamCapable: true, lengthFt: LEN_CROSSLAY, gpmNow: 0, gallonsThisEng: 0 },
    xlay3: { id: 'xlay3', label: 'Crosslay 3', open: false, setPsi: 0, foamCapable: true, lengthFt: LEN_CROSSLAY, gpmNow: 0, gallonsThisEng: 0 },
    trashline: { id: 'trashline', label: 'Front Trashline', open: false, setPsi: 0, foamCapable: false, lengthFt: LEN_TRASHLINE, gpmNow: 0, gallonsThisEng: 0 },
    twohalfA: { id: 'twohalfA', label: '2½″ A', open: false, setPsi: 0, foamCapable: true, lengthFt: LEN_TWOHALF_A, gpmNow: 0, gallonsThisEng: 0 },
  },
  gauges: {
    masterIntake: 0,
    masterDischarge: 0,
    rpm: ENGINE_IDLE,
    waterGal: 720,
    foamGal: 30,
  },
  totals: {
    gpmTotalNow: 0,
    gallonsPumpThisEng: 0,
  },
  capacities: { water: 720, foam: 30 },
  soundOn: false,
  targetRpm: ENGINE_IDLE,
  lastSimTick: 0,

  engagePump: (mode) => {
    set({
      pumpEngaged: true,
      source: 'tank',
      foamEnabled: mode === 'foam',
      gauges: { ...get().gauges, rpm: PUMP_BASE, masterIntake: 0 },
      targetRpm: PUMP_BASE,
      lastSimTick: performance.now(),
    })
  },

  disengagePump: () => {
    // Reset all "this engagement" counters
    const state = get()
    const resetDischarges = Object.fromEntries(
      Object.entries(state.discharges).map(([id, d]) => [
        id,
        { ...d, gpmNow: 0, gallonsThisEng: 0 }
      ])
    ) as Record<DischargeId, Discharge>

    set({
      pumpEngaged: false,
      discharges: resetDischarges,
      totals: { gpmTotalNow: 0, gallonsPumpThisEng: 0 },
      gauges: { ...state.gauges, rpm: ENGINE_IDLE },
      targetRpm: ENGINE_IDLE,
    })
  },

  setSource: (s) => {
    const state = get()
    const newIntake = s === 'hydrant' && state.gauges.masterIntake === 0 ? 50 : state.gauges.masterIntake
    set({
      source: s,
      gauges: {
        ...state.gauges,
        masterIntake: s === 'tank' ? 0 : newIntake,
      },
    })
    get().recomputeMasters()
  },

  setIntakePsi: (psi) => {
    if (get().source === 'hydrant') {
      set({ gauges: { ...get().gauges, masterIntake: Math.max(0, Math.min(200, psi)) } })
      get().recomputeMasters()
    }
  },

  setLine: (id, patch) => {
    set({
      discharges: {
        ...get().discharges,
        [id]: { ...get().discharges[id], ...patch },
      },
    })
    get().recomputeMasters()
  },

  recomputeMasters: () => {
    const state = get()
    const masterDischarge = Math.min(
      Math.max(...Object.values(state.discharges).map(d => d.open ? d.setPsi : 0), 0),
      400
    )
    const newTargetRpm = targetRpm({ ...state, gauges: { ...state.gauges, masterDischarge } })
    set({
      gauges: { ...state.gauges, masterDischarge },
      targetRpm: newTargetRpm,
    })
  },

  tickRpm: () => {
    const state = get()
    const current = state.gauges.rpm
    const target = state.targetRpm
    if (current === target) return
    const delta = target > current ? Math.min(50, target - current) : Math.max(-50, target - current)
    set({ gauges: { ...state.gauges, rpm: current + delta } })
  },

  setSoundOn: (on) => set({ soundOn: on }),

  simTick: () => {
    const state = get()
    if (!state.pumpEngaged) return

    const now = performance.now()
    const dtMs = state.lastSimTick > 0 ? now - state.lastSimTick : 100
    set({ lastSimTick: now })

    // 1) Per-line flows
    let totalGpm = 0
    const updatedDischarges = { ...state.discharges }

    for (const id of Object.keys(state.discharges) as DischargeId[]) {
      const d = updatedDischarges[id]
      const supplyPdp = d.open ? d.setPsi : 0
      const { gpm } = computeFogFlowFromPdp(supplyPdp, d.lengthFt)

      // Tank empty logic: if on tank and water==0 → no flow
      const effectiveGpm = (state.source === 'tank' && state.gauges.waterGal <= 0) ? 0 : gpm

      d.gpmNow = effectiveGpm
      d.gallonsThisEng += effectiveGpm * (dtMs / 60000)   // GPM × minutes

      totalGpm += effectiveGpm
    }

    // 2) Global totals
    const newTotals = {
      gpmTotalNow: totalGpm,
      gallonsPumpThisEng: state.totals.gallonsPumpThisEng + totalGpm * (dtMs / 60000),
    }

    // 3) Tank depletion (manual-only rule)
    let newWaterGal = state.gauges.waterGal
    if (state.source === 'tank') {
      newWaterGal = Math.max(0, state.gauges.waterGal - totalGpm * (dtMs / 60000))
    }

    set({
      discharges: updatedDischarges,
      totals: newTotals,
      gauges: { ...state.gauges, waterGal: newWaterGal },
    })
  },
}))