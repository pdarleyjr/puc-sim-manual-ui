import type { NozzlePreset } from './types';

/**
 * Nozzle flow calculations per NFPA formulas
 * 
 * References:
 * - Smooth-bore: Q = 29.7 × d² × √NP (Freeman formula)
 * - Fog: Rated GPM @ rated NP (manufacturer specs)
 * - Sources: wordpressstorageaccount.blob.core.windows.net, Utah Valley University
 */

/**
 * Calculate nozzle flow from preset and nozzle pressure
 * @param preset Nozzle preset configuration
 * @param npPsi Nozzle pressure in psi
 * @returns Flow in GPM
 */
export function calcNozzleFlow(preset: NozzlePreset, npPsi: number): number {
  switch (preset.kind) {
    case 'smooth_bore':
      // Freeman: Q = 29.7 × d² × √NP
      if (!preset.tipDiameterIn || npPsi < 0) return 0;
      return 29.7 * Math.pow(preset.tipDiameterIn, 2) * Math.sqrt(npPsi);
    
    case 'fog_fixed':
    case 'fog_automatic':
      // Fixed-flow fog: use rated GPM (NP controls pattern, not flow)
      return preset.ratedGPM ?? 0;
    
    case 'fog_selectable':
      // Phase 1: treat as fixed at rated GPM
      // Phase 2: add user-selectable flow settings
      return preset.ratedGPM ?? 0;
  }
}

/**
 * Calculate required nozzle pressure for a given flow
 * @param preset Nozzle preset configuration
 * @param flowGpm Desired flow in GPM
 * @returns Required NP in psi
 */
export function calcRequiredNP(preset: NozzlePreset, flowGpm: number): number {
  switch (preset.kind) {
    case 'smooth_bore':
      // Inverse Freeman: NP = (Q / (29.7 × d²))²
      if (!preset.tipDiameterIn) return 0;
      const d = preset.tipDiameterIn;
      return Math.pow(flowGpm / (29.7 * d * d), 2);
    
    case 'fog_fixed':
    case 'fog_automatic':
    case 'fog_selectable':
      // Fog nozzles: use rated NP
      return preset.ratedNPpsiFog ?? 100;
  }
}

/**
 * Get typical nozzle pressure for kind (per NFPA guidelines)
 */
export function getTypicalNP(kind: NozzlePreset['kind'], isMasterStream: boolean = false): number {
  switch (kind) {
    case 'smooth_bore':
      return isMasterStream ? 80 : 50;
    case 'fog_fixed':
    case 'fog_automatic':
    case 'fog_selectable':
      return 100;  // Standard fog, or 50 for low-pressure variants
  }
}