import { v4 as uuidv4 } from 'uuid';
import type { NozzlePreset } from './types';

/**
 * Default nozzle presets based on common NFPA-compliant equipment
 * Sources: Utah Valley University training materials
 */

export const DEFAULT_NOZZLE_PRESETS: Omit<NozzlePreset, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: '1¾″ Fog 150 GPM @ 100 psi',
    category: 'crosslay',
    kind: 'fog_fixed',
    ratedGPM: 150,
    ratedNPpsiFog: 100,
    notes: 'Standard crosslay fog nozzle',
    isDefault: true
  },
  {
    name: '1½″ SB 15/16″ @ 50 psi',
    category: 'crosslay',
    kind: 'smooth_bore',
    tipDiameterIn: 15/16,
    ratedNPpsi: 50,
    notes: 'Classic smooth bore handline',
    isDefault: false
  },
  {
    name: '2½″ SB 1⅛″ @ 50 psi',
    category: 'leader',
    kind: 'smooth_bore',
    tipDiameterIn: 1.125,
    ratedNPpsi: 50,
    ratedGPM: 265,
    notes: 'Medium smooth bore for leader lines',
    isDefault: false
  },
  {
    name: '2½″ SB 1¼″ @ 50 psi',
    category: 'trash',
    kind: 'smooth_bore',
    tipDiameterIn: 1.25,
    ratedNPpsi: 50,
    notes: 'Trash line / large handline',
    isDefault: true
  },
  {
    name: '1¾″ Leader 150 GPM @ 100 psi',
    category: 'leader',
    kind: 'fog_fixed',
    ratedGPM: 150,
    ratedNPpsiFog: 100,
    notes: 'Skid load leader line',
    isDefault: true
  },
  {
    name: '2½″ FDC 250 GPM @ 100 psi',
    category: 'highrise',
    kind: 'fog_fixed',
    ratedGPM: 250,
    ratedNPpsiFog: 100,
    notes: 'Standpipe / FDC',
    isDefault: true
  },
  {
    name: 'Deck Gun 1½″ SB @ 80 psi',
    category: 'other',
    kind: 'smooth_bore',
    tipDiameterIn: 1.5,
    ratedNPpsi: 80,
    notes: 'Master stream deck gun',
    isDefault: true
  }
];

/**
 * Generate default presets with UUIDs and timestamps
 */
export function generateDefaultPresets(): NozzlePreset[] {
  const now = Date.now();
  return DEFAULT_NOZZLE_PRESETS.map(preset => ({
    ...preset,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now
  }));
}