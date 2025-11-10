export type DischargeId = 
  | 'xlay1'      // Primary Crosslay
  | 'xlay2'      // Crosslay 2
  | 'xlay3'      // Crosslay 3
  | 'trashline'  // Trash Line
  | 'twohalfA'   // 2.5" Discharge A (Skid Load)
  | 'twohalfB'   // 2.5" Discharge B (Portable Standpipe)
  | 'twohalfC'   // 2.5" Discharge C (FDC)
  | 'twohalfD'   // 2.5" Discharge D

export interface HoseConfig {
  diameter: 1.75 | 2.5 | 3.0 | 4.0 | 5.0
  lengthFt: number
  presetId: string | null  // Reference to hose_fl_presets.json, null means user-length
}

export interface NozzleConfig {
  kind: 'smooth_bore' | 'fog_fixed' | 'fog_selectable' | 'fog_automatic'
  ratedGPM?: number
  ratedNPpsi?: number
  tipDiameterIn?: number  // For smooth bore (e.g., 7/8 = 0.875)
}

export interface DischargeDefault {
  id: DischargeId
  label: string
  hose: HoseConfig
  nozzle: NozzleConfig | null  // null for FDC (no nozzle at pump)
  
  // These determine evolution assignment behavior
  defaultEvolutionType?: string
  
  // Visual/UX
  icon?: string
  category: 'crosslay' | 'trash' | 'twohalf'
}

export interface EquipmentDefaults {
  discharges: Record<DischargeId, DischargeDefault>
  version: number
  updatedAt: number
}