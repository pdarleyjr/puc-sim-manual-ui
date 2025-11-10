/**
 * Evolution kind types per NFPA-1410 training patterns
 */
export type EvoKind =
  | 'deploy_crosslay'
  | 'deploy_skid_load'
  | 'standpipe_fdc'
  | 'exposure_monitor'
  | 'draft'
  | 'relief_valve_test';

/**
 * Incident type classification
 */
export type IncidentType = 'structure' | 'vehicle' | 'wildland' | 'standby' | 'other';

/**
 * Evolution specification within a scenario
 */
export interface EvoSpec {
  id: string;                      // uuid
  kind: EvoKind;
  label?: string;                  // optional display name
  hoseLengthFt?: number;           // e.g., 200
  nozzleProfileId?: string;        // Optional link to nozzle preset from nozzle profiles system
  targetGpm?: number;              // optional hint
  timeLimitSec: number;            // required per evolution
  options?: {
    allowFoam?: boolean;
    elevationGainFt?: number;
  };
  hiddenGoals?: {
    targetPDPpsi?: number;         // e.g., 150
    minHydrantResidualPsi?: number;// e.g., 20 (advisory per NFPA guidance)
    requiredHoseLengthFt?: number; // e.g., 200 for monitor
  };
}

/**
 * Complete scenario definition
 * Persists to IndexedDB via localForage
 */
export interface Scenario {
  id: string;
  name: string;
  unitDesignation: string;         // Engine 1, etc.
  incidentType: IncidentType;
  evolutions: EvoSpec[];
  
  // Built-in scenario metadata
  builtIn: boolean;                // true for seeded scenarios
  locked: boolean;                 // true prevents editing
  source: 'seed' | 'user';         // origin tracking
  
  createdAt: number;               // Unix timestamp
  updatedAt: number;               // Unix timestamp
  version: 1;                      // Schema version for future migrations
}

/**
 * Schema for scenario seeds
 * Used to populate built-in scenarios on first launch
 */
export interface ScenarioSeed {
  id: string;                      // stable ID for upgrades
  name: string;
  unitDesignation: string;
  incidentType: IncidentType;
  evolutions: EvoSpec[];
}

/**
 * Run history record for a scenario execution
 * Tracks performance metrics per NFPA-1401 compliance
 */
export interface RunHistory {
  id: string;
  scenarioId: string;
  scenarioName: string;
  startTime: number;
  endTime: number;
  evolutions: {
    evoId: string;
    evoKind: EvoKind;
    timeTaken: number;             // seconds
    passed: boolean;
    metrics?: {
      pdp?: number;
      gpm?: number;
      residual?: number;
      hoseLengthFt?: number;
    };
  }[];
  overallPassed: boolean;
}