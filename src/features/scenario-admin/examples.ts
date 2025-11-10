import type { Scenario } from './types';
import { generateId } from './utils';

/**
 * Example scenarios per original spec
 * Ref: NFPA-1410 training evolutions
 */

export const EXAMPLE_SCENARIOS: Scenario[] = [
  {
    id: generateId(),
    name: 'Initial Attack - Crosslay 200′',
    unitDesignation: 'Engine 1',
    incidentType: 'structure',
    evolutions: [
      {
        id: generateId(),
        kind: 'deploy_crosslay',
        label: 'Deploy 1¾" Crosslay - 200ft',
        hoseLengthFt: 200,
        timeLimitSec: 150, // 2.5 minutes
        options: {
          allowFoam: false,
          elevationGainFt: 0,
        },
        hiddenGoals: {
          targetPDPpsi: 150,
          minHydrantResidualPsi: 20, // Per NFPA/USFA guidance
          requiredHoseLengthFt: 200,
        },
      },
    ],
    builtIn: false,
    locked: false,
    source: 'user',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  },
  {
    id: generateId(),
    name: 'Exposure Monitor - 200′',
    unitDesignation: 'Engine 2',
    incidentType: 'structure',
    evolutions: [
      {
        id: generateId(),
        kind: 'exposure_monitor',
        label: 'Deploy Master Stream Monitor',
        hoseLengthFt: 200,
        timeLimitSec: 120, // 2 minutes
        options: {
          allowFoam: true,
          elevationGainFt: 0,
        },
        hiddenGoals: {
          targetPDPpsi: 180, // Higher for master stream
          minHydrantResidualPsi: 20,
          requiredHoseLengthFt: 200,
        },
      },
    ],
    builtIn: false,
    locked: false,
    source: 'user',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  },
];