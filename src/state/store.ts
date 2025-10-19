import { create } from 'zustand'
import {
  C_175_FOG,
  C_3IN_BIG10,
  NP_SMOOTHBORE_HAND,
  BLITZ_NP_STD,
  BLITZ_NP_LOW,
  BLITZ_APPLIANCE_LOSS_500,
  BLITZFIRE_MAX_GPM,
  STANDPIPE_ALLOWANCE,
  FEET_PER_FLOOR,
  PSI_PER_FOOT,
  HRP_LENGTH,
  HRP_TARGET_GPM,
  NP_MASTER,
  K_MONITOR,
  K_PIPED,
  TIP_DIAMETERS,
} from './constants'

export type Source = 'none' | 'tank' | 'hydrant'
export type DischargeId = 'xlay1' | 'xlay2' | 'xlay3' | 'trashline' | 'twohalfA' | 'twohalfB' | 'twohalfC' | 'twohalfD'
export type GovernorMode = 'pressure' | 'rpm'

// Assignment types
export type AssignmentType = 'handline_175_fog' | 'fdc_standpipe' | 'skid_leader' | 'blitzfire' | 'portable_standpipe' | 'deck_gun'

export type AssignmentConfig =
  | { type: 'handline_175_fog' }
  | { type: 'fdc_standpipe'; floors: number }
  | { type: 'skid_leader'; setbackFt: number }
  | { type: 'blitzfire'; mode: 'low55' | 'std100'; len3inFt: number }
  | { type: 'portable_standpipe'; floors: number; len3inFt: number }
  | { type: 'deck_gun'; tip: '1_3/8' | '1_1/2' | '1_3/4' }

// Event logging types
export type LogEvent = {
  ts: number
  t: string
  meta?: Record<string, unknown>
}

export type Session = {
  active: boolean
  startTs?: number
  endTs?: number
  events: LogEvent[]
}

// UI preferences
export type UiPrefs = {
  compactMode: boolean
}

// Hydraulics constants
const HOSE_COEFF_C = 6.59                 // Key Combat Ready 1¾″
const NOZZLE_RATED_GPM = 175
const NOZZLE_RATED_NP = 75
const K_FACTOR = NOZZLE_RATED_GPM / Math.sqrt(NOZZLE_RATED_NP)

const LEN_CROSSLAY = 200
const LEN_TRASHLINE = 100
const LEN_TWOHALF_A = 200

// Governor & Engine constants
const ENGINE_IDLE = 650
const PUMP_BASE = 750
const MAX_RPM = 2200
const RPM_PER_PSI = 0.6     // A: ~0.6 rpm per PSI
const IDLE_PUMP_DELTA_PSI = 50  // "idle pump pressure" contribution (50 + 50 = 100 rule)

export interface GovernorState {
  enabled: boolean        // true once the user selects a mode
  mode: GovernorMode      // 'pressure' or 'rpm'
  setPsi: number          // Pressure mode setpoint, PSI (default 50)
  setRpm: number          // RPM mode setpoint, RPM (default 1200)
}

export interface Discharge {
  id: DischargeId
  label: string
  open: boolean
  valvePercent: number    // 0-100 (valve % open)
  foamCapable: boolean
  lengthFt: number
  assignment: AssignmentConfig  // NEW: assignment configuration
  gpmNow: number
  gallonsThisEng: number
}

export interface Gauges {
  masterIntake: number      // -10..200, display clamps to 0..200 when hydrant
  masterDischarge: number   // 0..400 (highest open line)
  rpm: number               // 650..2200
  waterGal: number          // 0..720
  foamGal: number           // 0..30
  pumpTempF: number         // 120..240 (pump casing/seal temperature)
}

export interface Totals {
  gpmTotalNow: number
  gallonsPumpThisEng: number
}

export interface AppState {
  pumpEngaged: boolean
  source: Source
  foamEnabled: boolean
  governor: GovernorState
  discharges: Record<DischargeId, Discharge>
  gauges: Gauges
  totals: Totals
  capacities: { water: 720; foam: 30 }
  soundOn: boolean
  targetRpm: number
  lastSimTick: number
  warnings: string[]
  session: Session
  uiPrefs: UiPrefs
  lastRedlineCross: number  // timestamp of last redline crossing for edge detection

  // Actions
  engagePump: (mode: 'water' | 'foam') => void
  disengagePump: () => void
  setSource: (s: Source) => void
  setIntakePsi: (psi: number) => void
  setGovernorMode: (mode: GovernorMode) => void
  setGovernorSetPsi: (psi: number) => void
  setGovernorSetRpm: (rpm: number) => void
  setLine: (id: DischargeId, patch: Partial<Discharge>) => void
  recomputeMasters: () => void
  tickRpm: () => void
  setSoundOn: (on: boolean) => void
  simTick: () => void
  ackWarning: (code: string) => void
  log: (t: string, meta?: Record<string, unknown>) => void
  startSession: () => void
  endSession: () => void
  setCompactMode: (on: boolean) => void
}

// Compute P_base (hydrant intake + idle pump contribution)
function computePBase(state: AppState): number {
  if (state.source === 'none' || state.source === 'tank') return IDLE_PUMP_DELTA_PSI
  return state.gauges.masterIntake + IDLE_PUMP_DELTA_PSI
}

// Compute system discharge pressure based on governor mode and P_base threshold
function computeSystemPressure(state: AppState): number {
  // Dry pump guard: no water available means P_system = 0
  const waterAvailable =
    (state.source === 'hydrant' && state.gauges.masterIntake > 0) ||
    (state.source === 'tank' && state.gauges.waterGal > 0)
  
  if (!waterAvailable) return 0
  
  const P_base = computePBase(state)
  
  if (!state.governor.enabled) {
    return P_base
  }
  
  if (state.governor.mode === 'pressure') {
    // Pressure mode: target is governor setPsi, but at least P_base
    return Math.min(400, Math.max(state.governor.setPsi, P_base))
  } else {
    // RPM mode: compute pressure from target RPM
    const extraPsi = Math.max(0, (state.targetRpm - PUMP_BASE) / RPM_PER_PSI)
    return Math.min(400, P_base + extraPsi)
  }
}

// Compute target engine RPM based on governor mode and P_base threshold
function computeTargetRpm(state: AppState): number {
  if (!state.pumpEngaged) return ENGINE_IDLE
  
  if (!state.governor.enabled) return PUMP_BASE
  
  const P_base = computePBase(state)
  
  if (state.governor.mode === 'pressure') {
    // Pressure mode: only add RPM above base if setpoint exceeds P_base
    const extraPsi = Math.max(0, state.governor.setPsi - P_base)
    return Math.max(ENGINE_IDLE, Math.min(MAX_RPM, Math.round(PUMP_BASE + extraPsi * RPM_PER_PSI)))
  } else {
    // RPM mode: target is governor setRpm
    return Math.max(ENGINE_IDLE, Math.min(MAX_RPM, state.governor.setRpm))
  }
}

// Flow computation from PDP (for handline_175_fog only)
function computeFogFlowFromPdp(pdp: number, lengthFt: number): { gpm: number; np: number; fl: number } {
  if (pdp <= 0) return { gpm: 0, np: 0, fl: 0 }
  const a = (1 / (K_FACTOR * K_FACTOR)) + (HOSE_COEFF_C * (lengthFt / 1_000_000))
  const q2 = pdp / a
  const gpm = Math.sqrt(Math.max(0, q2))
  const np = (gpm / K_FACTOR) ** 2
  const fl = pdp - np
  return { gpm, np, fl }
}

// Assignment-specific flow computation
function computeAssignmentFlow(P_line_at_panel: number, assignment: AssignmentConfig): number {
  if (P_line_at_panel <= 0) return 0

  switch (assignment.type) {
    case 'handline_175_fog': {
      // Use existing fog nozzle computation (K-factor based)
      const { gpm } = computeFogFlowFromPdp(P_line_at_panel, LEN_CROSSLAY)
      return gpm
    }

    case 'fdc_standpipe': {
      // FDC: 3″ supply + elevation + standpipe + 200' HRP (1¾″) + smooth bore
      const elevPsi = assignment.floors * FEET_PER_FLOOR * PSI_PER_FOOT
      const A_pack = C_175_FOG * (HRP_LENGTH / 100) / 10000
      const B = NP_SMOOTHBORE_HAND + elevPsi + STANDPIPE_ALLOWANCE
      const Q = Math.sqrt(Math.max(0, (P_line_at_panel - B) / A_pack))
      return Math.min(HRP_TARGET_GPM, Q)
    }

    case 'skid_leader': {
      // Skid: 3″ supply + 200' HRP (1¾″) + smooth bore
      const A_3in = C_3IN_BIG10 * (assignment.setbackFt / 100) / 10000
      const A_pack = C_175_FOG * (HRP_LENGTH / 100) / 10000
      const A_total = A_3in + A_pack
      const B = NP_SMOOTHBORE_HAND
      const Q = Math.sqrt(Math.max(0, (P_line_at_panel - B) / A_total))
      return Math.min(HRP_TARGET_GPM, Q)
    }

    case 'blitzfire': {
      // Blitzfire: 3″ supply + appliance loss + NP (55 or 100)
      const NP = assignment.mode === 'std100' ? BLITZ_NP_STD : BLITZ_NP_LOW
      const A_3in = C_3IN_BIG10 * (assignment.len3inFt / 100) / 10000
      const k_app = BLITZ_APPLIANCE_LOSS_500 / (500 * 500)
      const A_total = A_3in + k_app
      const B = NP
      let Q = Math.sqrt(Math.max(0, (P_line_at_panel - B) / A_total))
      Q = Math.min(Q, BLITZFIRE_MAX_GPM)
      return Q
    }

    case 'portable_standpipe': {
      // Portable: 3″ supply + elevation + standpipe + 200' HRP + smooth bore
      const elevPsi = assignment.floors * FEET_PER_FLOOR * PSI_PER_FOOT
      const A_3in = C_3IN_BIG10 * (assignment.len3inFt / 100) / 10000
      const A_pack = C_175_FOG * (HRP_LENGTH / 100) / 10000
      const A_total = A_3in + A_pack
      const B = NP_SMOOTHBORE_HAND + elevPsi + STANDPIPE_ALLOWANCE
      const Q = Math.sqrt(Math.max(0, (P_line_at_panel - B) / A_total))
      return Math.min(HRP_TARGET_GPM, Q)
    }

    case 'deck_gun': {
      // Deck Gun (PIPED): no supply hose, only device + piping losses
      const K_TOTAL = K_MONITOR + K_PIPED
      const B = NP_MASTER  // 80 psi nozzle requirement
      
      // P = B + K_TOTAL * Q^2  →  Q = sqrt(max(0, (P - B) / K_TOTAL))
      let Q = Math.sqrt(Math.max(0, (P_line_at_panel - B) / K_TOTAL))
      
      // Optional: tip "natural" flow at NP=80; allow slight headroom
      const tipDiam = TIP_DIAMETERS[assignment.tip]
      const Q_tip = 29.7 * (tipDiam ** 2) * Math.sqrt(NP_MASTER)
      Q = Math.min(Q, 1250, Q_tip * 1.2)
      
      return Q
    }
  }
}

export const useStore = create<AppState>((set, get) => ({
  pumpEngaged: false,
  source: 'none',
  foamEnabled: false,
  governor: {
    enabled: false,
    mode: 'pressure',
    setPsi: 50,
    setRpm: 1200,
  },
  discharges: {
    xlay1: { 
      id: 'xlay1', 
      label: 'Crosslay 1', 
      open: false, 
      valvePercent: 0, 
      foamCapable: true, 
      lengthFt: LEN_CROSSLAY, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
    xlay2: { 
      id: 'xlay2', 
      label: 'Crosslay 2', 
      open: false, 
      valvePercent: 0, 
      foamCapable: true, 
      lengthFt: LEN_CROSSLAY, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
    xlay3: { 
      id: 'xlay3', 
      label: 'Crosslay 3', 
      open: false, 
      valvePercent: 0, 
      foamCapable: true, 
      lengthFt: LEN_CROSSLAY, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
    trashline: { 
      id: 'trashline', 
      label: 'Front Trashline', 
      open: false, 
      valvePercent: 0, 
      foamCapable: false, 
      lengthFt: LEN_TRASHLINE, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
    twohalfA: { 
      id: 'twohalfA', 
      label: '2½″ A', 
      open: false, 
      valvePercent: 0, 
      foamCapable: true, 
      lengthFt: LEN_TWOHALF_A, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
    twohalfB: { 
      id: 'twohalfB', 
      label: '2½″ B', 
      open: false, 
      valvePercent: 0, 
      foamCapable: true, 
      lengthFt: LEN_TWOHALF_A, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
    twohalfC: { 
      id: 'twohalfC', 
      label: '2½″ C', 
      open: false, 
      valvePercent: 0, 
      foamCapable: true, 
      lengthFt: LEN_TWOHALF_A, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
    twohalfD: { 
      id: 'twohalfD', 
      label: '2½″ D', 
      open: false, 
      valvePercent: 0, 
      foamCapable: true, 
      lengthFt: LEN_TWOHALF_A, 
      assignment: { type: 'handline_175_fog' },
      gpmNow: 0, 
      gallonsThisEng: 0 
    },
  },
  gauges: {
    masterIntake: 0,
    masterDischarge: 0,
    rpm: ENGINE_IDLE,
    waterGal: 720,
    foamGal: 30,
    pumpTempF: 120,
  },
  totals: {
    gpmTotalNow: 0,
    gallonsPumpThisEng: 0,
  },
  capacities: { water: 720, foam: 30 },
  soundOn: false,
  targetRpm: ENGINE_IDLE,
  lastSimTick: 0,
  warnings: [],
  session: {
    active: false,
    events: [],
  },
  uiPrefs: {
    compactMode: false,
  },
  lastRedlineCross: 0,

  engagePump: (mode) => {
    set({
      pumpEngaged: true,
      foamEnabled: mode === 'foam',
      gauges: { ...get().gauges, rpm: PUMP_BASE },
      targetRpm: PUMP_BASE,
      lastSimTick: performance.now(),
    })
    get().startSession()
    get().log('PUMP_ENGAGED', { mode })
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

    get().log('PUMP_DISENGAGED')
    get().endSession()

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
    // Mutual exclusivity: clicking same source toggles to 'none'
    const newSource = state.source === s ? 'none' : s
    const newIntake = newSource === 'hydrant' && state.gauges.masterIntake === 0 ? 50 : state.gauges.masterIntake
    
    get().log('SOURCE_CHANGE', { from: state.source, to: newSource })
    
    set({
      source: newSource,
      gauges: {
        ...state.gauges,
        masterIntake: newSource === 'tank' || newSource === 'none' ? 0 : newIntake,
      },
    })
    get().recomputeMasters()
  },

  setIntakePsi: (psi) => {
    if (get().source === 'hydrant') {
      const clamped = Math.max(0, Math.min(200, psi))
      get().log('HYDRANT_PSI_CHANGE', { psi: clamped })
      set({ gauges: { ...get().gauges, masterIntake: clamped } })
      get().recomputeMasters()
    }
  },

  setGovernorMode: (mode) => {
    get().log('GOVERNOR_MODE_CHANGE', { mode })
    set({
      governor: { ...get().governor, enabled: true, mode }
    })
    get().recomputeMasters()
  },

  setGovernorSetPsi: (psi) => {
    const clamped = Math.max(50, Math.min(300, psi))
    get().log('GOVERNOR_SETPOINT_CHANGE', { mode: 'pressure', psi: clamped })
    set({
      governor: { ...get().governor, setPsi: clamped }
    })
    get().recomputeMasters()
  },

  setGovernorSetRpm: (rpm) => {
    const clamped = Math.max(750, Math.min(2200, rpm))
    get().log('GOVERNOR_SETPOINT_CHANGE', { mode: 'rpm', rpm: clamped })
    set({
      governor: { ...get().governor, setRpm: clamped }
    })
    get().recomputeMasters()
  },

  setLine: (id, patch) => {
    const oldState = get().discharges[id]
    
    // Log significant changes
    if (patch.open !== undefined && patch.open !== oldState.open) {
      get().log('DISCHARGE_VALVE', { line: id, open: patch.open })
    }
    if (patch.valvePercent !== undefined && patch.valvePercent !== oldState.valvePercent) {
      get().log('DISCHARGE_VALVE_PCT', { line: id, percent: patch.valvePercent })
    }
    if (patch.assignment !== undefined && patch.assignment.type !== oldState.assignment.type) {
      get().log('DISCHARGE_ASSIGNMENT', { line: id, assignment: patch.assignment.type })
    }
    
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
    const P_system = computeSystemPressure(state)
    
    // Master discharge is max of all per-line pressures
    const linePressures = Object.values(state.discharges).map(d => 
      d.open ? (d.valvePercent / 100) * P_system : 0
    )
    const newMasterDischarge = Math.min(Math.max(...linePressures, 0), 400)
    
    // Redline edge detection (rising edge only)
    const oldMasterDischarge = state.gauges.masterDischarge
    if (newMasterDischarge >= 350 && oldMasterDischarge < 350) {
      const now = performance.now()
      // Only log if it's been more than 2s since last crossing
      if (now - state.lastRedlineCross > 2000) {
        get().log('REDLINE_CROSSED', { psi: Math.round(newMasterDischarge) })
        set({ lastRedlineCross: now })
      }
    }
    
    const newTargetRpm = computeTargetRpm(state)
    
    set({
      gauges: { ...state.gauges, masterDischarge: newMasterDischarge },
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

  ackWarning: (code) => {
    get().log('WARNING_CLEARED', { warning: code })
    set({ warnings: get().warnings.filter(w => w !== code) })
  },

  log: (t, meta) => {
    const state = get()
    if (!state.session.active) return
    
    const event: LogEvent = {
      ts: performance.now(),
      t,
      meta,
    }
    
    set({
      session: {
        ...state.session,
        events: [...state.session.events, event],
      }
    })
  },

  startSession: () => {
    set({
      session: {
        active: true,
        startTs: performance.now(),
        events: [{ ts: performance.now(), t: 'SESSION_START' }],
      }
    })
  },

  endSession: () => {
    const state = get()
    if (!state.session.active) return
    
    const endEvent: LogEvent = {
      ts: performance.now(),
      t: 'SESSION_END',
    }
    
    set({
      session: {
        ...state.session,
        active: false,
        endTs: performance.now(),
        events: [...state.session.events, endEvent],
      }
    })
  },

  setCompactMode: (on) => {
    set({ uiPrefs: { ...get().uiPrefs, compactMode: on } })
  },

  simTick: () => {
    const state = get()
    if (!state.pumpEngaged) return

    const now = performance.now()
    const dtMs = state.lastSimTick > 0 ? now - state.lastSimTick : 100
    set({ lastSimTick: now })

    const P_system = computeSystemPressure(state)

    // Overheating model constants
    const DRY_HEAT_RATE_F_PER_S_BASE = 0.5
    const DRY_HEAT_RATE_F_PER_S_PER_500RPM = 0.6
    const WET_COOL_RATE_F_PER_S = 1.0
    const TEMP_MIN = 120
    const TEMP_WARN = 200
    const TEMP_MAX = 240

    const isWaterAvailable =
      (state.source === 'hydrant' && state.gauges.masterIntake > 0) ||
      (state.source === 'tank' && state.gauges.waterGal > 0)

    // Update pump temperature
    let newPumpTempF = state.gauges.pumpTempF
    if (state.pumpEngaged) {
      if (!isWaterAvailable) {
        const rpm = state.gauges.rpm
        const overBase = Math.max(0, rpm - 750)
        const heatRate = DRY_HEAT_RATE_F_PER_S_BASE + DRY_HEAT_RATE_F_PER_S_PER_500RPM * (overBase / 500)
        newPumpTempF = Math.min(TEMP_MAX, newPumpTempF + heatRate * (dtMs / 1000))
      } else {
        newPumpTempF = Math.max(TEMP_MIN, newPumpTempF - WET_COOL_RATE_F_PER_S * (dtMs / 1000))
      }
    } else {
      // Pump off: cool toward ambient
      newPumpTempF = Math.max(TEMP_MIN, newPumpTempF - 0.5 * (dtMs / 1000))
    }

    // Warning injection
    const warningCode = 'PUMP OVERHEATING — NO WATER SUPPLY'
    const hot = newPumpTempF >= TEMP_WARN && !isWaterAvailable
    const exists = state.warnings.includes(warningCode)
    let newWarnings = [...state.warnings]
    if (hot && !exists) {
      newWarnings.push(warningCode)
      get().log('WARNING_RAISED', { warning: warningCode })
    }
    if (!hot && exists) {
      newWarnings = newWarnings.filter(w => w !== warningCode)
    }
    // Clear warning when pump disengaged
    if (!state.pumpEngaged) {
      newWarnings = newWarnings.filter(w => !w.startsWith('PUMP OVERHEATING'))
    }

    // 1) Per-line flows
    let totalGpm = 0
    const updatedDischarges = { ...state.discharges }

    for (const id of Object.keys(state.discharges) as DischargeId[]) {
      const d = updatedDischarges[id]
      // Per-line pressure = valve% × system pressure
      const P_line = d.open ? (d.valvePercent / 100) * P_system : 0
      
      // Use assignment-specific flow computation
      const gpm = computeAssignmentFlow(P_line, d.assignment)

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
      gauges: { ...state.gauges, waterGal: newWaterGal, pumpTempF: newPumpTempF },
      warnings: newWarnings,
    })
  },
}))