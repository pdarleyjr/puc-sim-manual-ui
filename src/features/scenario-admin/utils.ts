import { v4 as uuidv4 } from 'uuid';
import type { Scenario, EvoSpec, EvoKind, IncidentType } from './types';

/**
 * Generate a new UUID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Create a new empty evolution with sensible defaults
 */
export function createEmptyEvolution(kind: EvoKind = 'deploy_crosslay'): EvoSpec {
  return {
    id: generateId(),
    kind,
    timeLimitSec: 120, // 2 minutes default
    hoseLengthFt: 200,
    options: {},
    hiddenGoals: {
      minHydrantResidualPsi: 20, // NFPA guideline
    },
  };
}

/**
 * Create a new empty scenario
 */
export function createEmptyScenario(): Scenario {
  return {
    id: generateId(),
    name: 'New Scenario',
    unitDesignation: 'Engine 1',
    incidentType: 'structure',
    evolutions: [createEmptyEvolution()],
    builtIn: false,
    locked: false,
    source: 'user',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
  };
}

/**
 * Duplicate a scenario with new ID and timestamp
 */
export function duplicateScenario(scenario: Scenario): Scenario {
  return {
    ...scenario,
    id: generateId(),
    name: `${scenario.name} (Copy)`,
    evolutions: scenario.evolutions.map(evo => ({
      ...evo,
      id: generateId(),
    })),
    builtIn: false,      // User copies are not built-in
    locked: false,       // User copies are editable
    source: 'user',      // Always user when duplicated
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Get human-readable label for evolution kind
 */
export function getEvoKindLabel(kind: EvoKind): string {
  const labels: Record<EvoKind, string> = {
    deploy_crosslay: 'Deploy Crosslay',
    deploy_skid_load: 'Deploy Skid Load',
    standpipe_fdc: 'Standpipe/FDC',
    exposure_monitor: 'Exposure Monitor',
    draft: 'Draft Operations',
    relief_valve_test: 'Relief Valve Test',
  };
  return labels[kind];
}

/**
 * Get human-readable label for incident type
 */
export function getIncidentTypeLabel(type: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    structure: 'Structure Fire',
    vehicle: 'Vehicle Fire',
    wildland: 'Wildland Fire',
    standby: 'Standby/Coverage',
    other: 'Other',
  };
  return labels[type];
}

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}