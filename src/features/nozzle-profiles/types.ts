/**
 * Nozzle Profile Types
 * Per NFPA hydraulics formulas and training patterns
 */

export type TabId = 
  | 'panel' 
  | 'hydrant_lab' 
  | 'scenarios_runner' 
  | 'admin_scenarios' 
  | 'admin_nozzles';

export type NozzleKind = 
  | 'smooth_bore'      // Freeman: Q = 29.7 × d² × √NP
  | 'fog_fixed'        // Rated GPM @ rated NP
  | 'fog_selectable'   // User-selectable GPM
  | 'fog_automatic';   // Auto-adjusting

export type NozzleCategory = 
  | 'crosslay'         // 1¾″ handlines
  | 'trash'            // Front trash line
  | 'leader'           // Skid load/leader
  | 'highrise'         // 2½″/FDC/standpipe
  | 'other';           // Deck gun, specialty

/**
 * Admin-managed global nozzle preset
 */
export interface NozzlePreset {
  id: string;
  name: string;
  category: NozzleCategory;
  kind: NozzleKind;
  
  // Smooth-bore specific
  tipDiameterIn?: number;         // e.g., 0.9375 for 15/16″
  ratedNPpsi?: number;            // Typically 50 (handline) or 80 (master)
  
  // Fog nozzle specific
  ratedGPM?: number;              // e.g., 150
  ratedNPpsiFog?: number;         // Typically 100 (or 50 for low-pressure)
  
  notes?: string;
  isDefault?: boolean;            // Ship with system
  createdAt: number;
  updatedAt: number;
}

/**
 * Per-tab local override
 */
export interface LocalOverride {
  tabId: TabId;
  category: NozzleCategory;
  presetId: string;
  timestamp: number;              // For invalidation detection
}

/**
 * Export format for Admin presets
 */
export interface NozzleExport {
  version: 1;
  exportedAt: number;
  presets: NozzlePreset[];
}