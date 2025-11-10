import type { DischargeDefault, EquipmentDefaults } from './types'

export const FACTORY_DEFAULTS: DischargeDefault[] = [
  {
    id: 'xlay1',
    label: 'Primary Crosslay',
    category: 'crosslay',
    hose: {
      diameter: 1.75,
      lengthFt: 200,
      presetId: 'key_combat_ready_175'  // From hose_fl_presets.json
    },
    nozzle: {
      kind: 'fog_fixed',
      ratedGPM: 175,
      ratedNPpsi: 75
    },
    defaultEvolutionType: 'deploy_crosslay'
  },
  {
    id: 'trashline',
    label: 'Trash Line',
    category: 'trash',
    hose: {
      diameter: 1.75,
      lengthFt: 100,
      presetId: 'key_combat_ready_175'
    },
    nozzle: {
      kind: 'fog_fixed',
      ratedGPM: 175,
      ratedNPpsi: 75
    }
  },
  {
    id: 'xlay2',
    label: 'Crosslay 2',
    category: 'crosslay',
    hose: {
      diameter: 1.75,
      lengthFt: 200,
      presetId: 'key_combat_ready_175'
    },
    nozzle: {
      kind: 'fog_fixed',
      ratedGPM: 175,
      ratedNPpsi: 75
    }
  },
  {
    id: 'xlay3',
    label: 'Crosslay 3',
    category: 'crosslay',
    hose: {
      diameter: 1.75,
      lengthFt: 200,
      presetId: 'key_combat_ready_175'
    },
    nozzle: {
      kind: 'fog_fixed',
      ratedGPM: 175,
      ratedNPpsi: 75
    }
  },
  {
    id: 'twohalfA',
    label: '2½″ Discharge - Skid Load',
    category: 'twohalf',
    hose: {
      diameter: 3.0,
      lengthFt: 100,  // Default setback
      presetId: null  // User-configurable length
    },
    nozzle: {
      kind: 'smooth_bore',
      tipDiameterIn: 0.875,  // 7/8"
      ratedNPpsi: 50,
      ratedGPM: 150
    },
    defaultEvolutionType: 'deploy_skid_load'
  },
  {
    id: 'twohalfB',
    label: '2½″ Discharge - Portable Standpipe',
    category: 'twohalf',
    hose: {
      diameter: 3.0,
      lengthFt: 100,
      presetId: null
    },
    nozzle: {
      kind: 'smooth_bore',
      tipDiameterIn: 0.875,
      ratedNPpsi: 50,
      ratedGPM: 150
    },
    defaultEvolutionType: 'standpipe_fdc'
  },
  {
    id: 'twohalfC',
    label: '2½″ Discharge - FDC',
    category: 'twohalf',
    hose: {
      diameter: 3.0,
      lengthFt: 0,  // Supply hose only, no attack line
      presetId: null
    },
    nozzle: null,  // FDC has no nozzle at pump
    defaultEvolutionType: 'standpipe_fdc'
  },
  {
    id: 'twohalfD',
    label: '2½″ Discharge D',
    category: 'twohalf',
    hose: {
      diameter: 2.5,
      lengthFt: 150,
      presetId: 'key_2.5in'
    },
    nozzle: {
      kind: 'fog_fixed',
      ratedGPM: 150,
      ratedNPpsi: 100
    }
  }
]

export function getFactoryDefaults(): EquipmentDefaults {
  const discharges: Record<string, DischargeDefault> = {}
  
  // Deep copy each discharge to prevent mutation
  for (const discharge of FACTORY_DEFAULTS) {
    discharges[discharge.id] = {
      ...discharge,
      hose: { ...discharge.hose },
      nozzle: discharge.nozzle ? { ...discharge.nozzle } : null
    }
  }
  
  return {
    discharges,
    version: 1,
    updatedAt: Date.now()
  }
}