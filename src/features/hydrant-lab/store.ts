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

type LabState = {
  staticPsi: number
  hydrantResidualPsi: number
  legs: Record<PortId, Leg | null>
  hav: Hav
  engineIntakePsi: number
  totalInflowGpm: number
  governorPsi: number
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
  
  recompute: () => {
    const s = get()
    const { engineIntakePsi, totalInflowGpm, hydrantResidualPsi } =
      solveHydrantSystem(s)
    set({ engineIntakePsi, totalInflowGpm, hydrantResidualPsi })
  }
}))