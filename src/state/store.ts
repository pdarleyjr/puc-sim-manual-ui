import { create } from 'zustand'

export type Source = 'tank' | 'hydrant'
export type DischargeId = 'xlay1' | 'xlay2' | 'xlay3' | 'trashline' | 'twohalfA'

export interface Discharge {
  id: DischargeId
  label: string
  open: boolean
  setPsi: number
  foamCapable: boolean
}

export interface Gauges {
  masterIntake: number      // -10..200, display clamps to 0..200 when hydrant
  masterDischarge: number   // 0..400 (highest open line)
  rpm: number               // 650..2200
  waterGal: number          // 0..720
  foamGal: number           // 0..30
}

export interface AppState {
  pumpEngaged: boolean
  source: Source
  foamEnabled: boolean
  discharges: Record<DischargeId, Discharge>
  gauges: Gauges
  capacities: { water: 720; foam: 30 }
  soundOn: boolean
  targetRpm: number

  // Actions
  engagePump: (mode: 'water' | 'foam') => void
  disengagePump: () => void
  setSource: (s: Source) => void
  setIntakePsi: (psi: number) => void
  setLine: (id: DischargeId, patch: Partial<Discharge>) => void
  recomputeMasters: () => void
  tickRpm: () => void
  setSoundOn: (on: boolean) => void
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

export const useStore = create<AppState>((set, get) => ({
  pumpEngaged: false,
  source: 'tank',
  foamEnabled: false,
  discharges: {
    xlay1: { id: 'xlay1', label: 'Crosslay 1', open: false, setPsi: 0, foamCapable: true },
    xlay2: { id: 'xlay2', label: 'Crosslay 2', open: false, setPsi: 0, foamCapable: true },
    xlay3: { id: 'xlay3', label: 'Crosslay 3', open: false, setPsi: 0, foamCapable: true },
    trashline: { id: 'trashline', label: 'Front Trashline', open: false, setPsi: 0, foamCapable: false },
    twohalfA: { id: 'twohalfA', label: '2½″ A', open: false, setPsi: 0, foamCapable: true },
  },
  gauges: {
    masterIntake: 0,
    masterDischarge: 0,
    rpm: ENGINE_IDLE,
    waterGal: 720,
    foamGal: 30,
  },
  capacities: { water: 720, foam: 30 },
  soundOn: false,
  targetRpm: ENGINE_IDLE,

  engagePump: (mode) => {
    set({
      pumpEngaged: true,
      source: 'tank',
      foamEnabled: mode === 'foam',
      gauges: { ...get().gauges, rpm: PUMP_BASE, masterIntake: 0 },
      targetRpm: PUMP_BASE,
    })
  },

  disengagePump: () => {
    set({
      pumpEngaged: false,
      gauges: { ...get().gauges, rpm: ENGINE_IDLE },
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
}))