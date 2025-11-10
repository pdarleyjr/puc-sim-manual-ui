import { z } from 'zod';

/**
 * Zod schemas for runtime validation and type inference
 * References NFPA-1410 standard for training evolutions
 */

export const EvoKindSchema = z.enum([
  'deploy_crosslay',
  'deploy_skid_load',
  'standpipe_fdc',
  'exposure_monitor',
  'draft',
  'relief_valve_test',
]);

export const IncidentTypeSchema = z.enum([
  'structure',
  'vehicle',
  'wildland',
  'standby',
  'other',
]);

export const EvoSpecSchema = z.object({
  id: z.string().uuid(),
  kind: EvoKindSchema,
  label: z.string().optional(),
  hoseLengthFt: z.number().positive().optional(),
  nozzleProfileId: z.string().uuid().optional(),
  targetGpm: z.number().positive().optional(),
  timeLimitSec: z.number().positive(), // Required, must be > 0
  options: z.object({
    allowFoam: z.boolean().optional(),
    elevationGainFt: z.number().optional(),
  }).optional(),
  hiddenGoals: z.object({
    targetPDPpsi: z.number().positive().optional(),
    minHydrantResidualPsi: z.number().nonnegative().optional(), // Per NFPA, typically 20 psi
    requiredHoseLengthFt: z.number().positive().optional(),
  }).optional(),
});

export const ScenarioSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Scenario name required'),
  unitDesignation: z.string().min(1, 'Unit designation required'), // e.g., "Engine 1"
  incidentType: IncidentTypeSchema,
  evolutions: z.array(EvoSpecSchema).min(1, 'At least one evolution required'),
  builtIn: z.boolean(),
  locked: z.boolean(),
  source: z.enum(['seed', 'user']),
  createdAt: z.number(),
  updatedAt: z.number(),
  version: z.literal(1), // Schema version for future migrations
});

/**
 * Type inference from Zod schemas
 */
export type ValidatedEvoSpec = z.infer<typeof EvoSpecSchema>;
export type ValidatedScenario = z.infer<typeof ScenarioSchema>;

/**
 * Validation helper functions
 */
export function validateScenario(data: unknown): ValidatedScenario {
  return ScenarioSchema.parse(data);
}

export function validateEvoSpec(data: unknown): ValidatedEvoSpec {
  return EvoSpecSchema.parse(data);
}