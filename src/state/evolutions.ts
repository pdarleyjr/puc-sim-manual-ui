export type NozzleKind = 'sb' | 'fog' | 'monitor' | 'cannon';
export type HoseDia = 1.75 | 2.5 | 3 | 5;

export interface EvolutionSpec {
  id: string;
  label: string;
  hose: { dia: HoseDia; lengthFt: number };
  nozzle: { kind: NozzleKind; tipIn?: number; npPsi?: number; ratedGpm?: number };
  // optional extra loss (appliance, gated wye, adapter, etc.)
  appliances?: { name: string; lossPsi: number }[];
}

/** Common 2½" evolutions (+ some crosslay/monitor recipes that reference 1¾" / 3") */
export const TWO_FIVE_EVOS: EvolutionSpec[] = [
  { 
    id: '25-sb-1-0', 
    label: '2½″ SB 1.0″ tip', 
    hose: { dia: 2.5, lengthFt: 200 }, 
    nozzle: { kind: 'sb', tipIn: 1.0, npPsi: 50 } 
  },
  { 
    id: '25-sb-1-18', 
    label: '2½″ SB 1⅛″ tip', 
    hose: { dia: 2.5, lengthFt: 200 }, 
    nozzle: { kind: 'sb', tipIn: 1.125, npPsi: 50 } 
  },
  { 
    id: '25-sb-1-14', 
    label: '2½″ SB 1¼″ tip', 
    hose: { dia: 2.5, lengthFt: 200 }, 
    nozzle: { kind: 'sb', tipIn: 1.25, npPsi: 50 } 
  },
  { 
    id: '25-fog-100', 
    label: '2½″ Fog (100 NP)', 
    hose: { dia: 2.5, lengthFt: 200 }, 
    nozzle: { kind: 'fog', ratedGpm: 250, npPsi: 100 } 
  },

  // Evolutions that really run through 3″ to reduce FL but end device is 2½″ nozzle/monitor
  { 
    id: 'leader-3in-to-25-sb-1-18', 
    label: 'Leader: 3″ → 2½″ SB 1⅛″', 
    hose: { dia: 3, lengthFt: 200 }, 
    nozzle: { kind: 'sb', tipIn: 1.125, npPsi: 50 } 
  },

  // Crosslay patterns (for reference on Discharge Test)
  { 
    id: 'xlay-175-fog-75', 
    label: '1¾″ Fog (75 NP)', 
    hose: { dia: 1.75, lengthFt: 200 }, 
    nozzle: { kind: 'fog', ratedGpm: 150, npPsi: 75 } 
  },
  { 
    id: 'xlay-175-sb-15-16', 
    label: '1¾″ SB 15/16″', 
    hose: { dia: 1.75, lengthFt: 200 }, 
    nozzle: { kind: 'sb', tipIn: 0.9375, npPsi: 50 } 
  },

  // Monitor/Deck options
  { 
    id: 'monitor-1-3-8', 
    label: 'Monitor SB 1⅜″', 
    hose: { dia: 2.5, lengthFt: 100 }, 
    nozzle: { kind: 'sb', tipIn: 1.375, npPsi: 80 }, 
    appliances: [{ name: 'appliance', lossPsi: 10 }] 
  },
  { 
    id: 'monitor-fog-350', 
    label: 'Monitor Fog 350', 
    hose: { dia: 2.5, lengthFt: 100 }, 
    nozzle: { kind: 'fog', ratedGpm: 350, npPsi: 100 }, 
    appliances: [{ name: 'appliance', lossPsi: 10 }] 
  },
];