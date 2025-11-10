/**
 * Flexible Discharge Line Types for Hydrant Lab
 * 
 * Provides complete freedom to mix ANY hose size/length with ANY nozzle type
 * and ANY appliance combination for experimental hydraulic testing.
 */

export type NozzleKind = 
  | 'smooth_bore' 
  | 'fog_fixed' 
  | 'fog_selectable' 
  | 'fog_automatic' 
  | 'monitor' 
  | 'master_stream'

/**
 * Flexible nozzle configuration - can be null for supply lines
 */
export interface FlexibleNozzle {
  kind: NozzleKind
  tipDiameterIn?: number      // For smooth bore (0.5" - 2.0")
  ratedGPM?: number           // For fog/fixed/automatic nozzles
  ratedNPpsi?: number         // Nozzle pressure (20-150 PSI)
}

/**
 * Flexible hose configuration
 */
export interface FlexibleHose {
  diameter: 1.75 | 2.5 | 3.0 | 4.0 | 5.0  // Any standard diameter
  lengthFt: number                         // Any length
  frictionCoeff?: number                   // Optional custom coefficient
}

/**
 * Optional appliances and modifiers
 */
export interface FlexibleAppliances {
  wye?: boolean
  gatedWye?: boolean
  siamese?: boolean
  reducer?: { from: number; to: number }
  monitor?: boolean
  elevationFt?: number
}

/**
 * Complete flexible discharge line configuration
 * Allows experimentation with ANY equipment combination
 */
export interface FlexibleDischargeLine {
  id: string
  
  // Fully customizable hose
  hose: FlexibleHose
  
  // Fully customizable nozzle (or null for supply line)
  nozzle: FlexibleNozzle | null
  
  // Optional appliances
  appliances?: FlexibleAppliances
  
  // Control state
  isOpen: boolean
  
  // Calculated values (updated during recompute)
  flowGPM: number
  frictionLossPsi: number
  nozzlePressurePsi: number
  requiredGPM: number  // What the nozzle demands at rated pressure
  
  // Warnings for unusual configurations
  warnings?: string[]
}

/**
 * Configuration object for adding a new flexible discharge line
 */
export interface FlexibleDischargeConfig {
  hoseDiameter: 1.75 | 2.5 | 3.0 | 4.0 | 5.0
  hoseLengthFt: number
  nozzleKind?: NozzleKind
  nozzleSpecs?: {
    tipDiameterIn?: number
    ratedGPM?: number
    ratedNPpsi?: number
  }
  appliances?: FlexibleAppliances
}