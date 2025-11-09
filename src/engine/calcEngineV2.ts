/**
 * Calc Engine V2 - Pure Functional Hydraulics Calculations
 * 
 * Pure, deterministic calculation functions for fire pump hydraulics.
 * All functions are side-effect free and unit-tested.
 * 
 * References:
 * - NFPA 291: Flow Testing
 * - NFPA 1901: Pump Performance
 * - IFSTA: Pump Operations
 * - Freeman Formula for smooth bore nozzles
 */

import frictionCoeffs from '../../data/friction_coeffs.json';
import appliances from '../../data/appliances.json';

// Types
export interface HoseConfig {
  diameter: number; // inches
  length: number; // feet
  coefficient?: number; // optional override
}

export interface NozzleConfig {
  type: 'smooth_bore' | 'fog';
  diameter?: number; // inches (for smooth bore)
  ratedFlow?: number; // GPM (for fog)
  pressure: number; // PSI at nozzle
}

export interface DischargeConfig {
  nozzle: NozzleConfig;
  hose: HoseConfig;
  appliances: string[]; // keys from appliances.json
}

/**
 * Calculate friction loss in a hose line
 * Formula: FL = C × (Q/100)² × (L/100)
 * 
 * @param flow - Flow rate in GPM
 * @param hose - Hose configuration
 * @returns Friction loss in PSI
 */
export function calcFrictionLoss(flow: number, hose: HoseConfig): number {
  const coeff = hose.coefficient ?? getFrictionCoefficient(hose.diameter);
  const flowHundreds = flow / 100;
  const lengthHundreds = hose.length / 100;
  return coeff * Math.pow(flowHundreds, 2) * lengthHundreds;
}

/**
 * Get friction coefficient for a given hose diameter
 */
function getFrictionCoefficient(diameter: number): number {
  // Try exact string match first
  let diameterStr = diameter.toString();
  
  // Check attack lines
  const attackLines = frictionCoeffs.attack_lines as Record<string, number>;
  if (attackLines[diameterStr]) {
    return attackLines[diameterStr];
  }
  
  // Check supply lines
  const supplyLines = frictionCoeffs.supply_lines as Record<string, number>;
  if (supplyLines[diameterStr]) {
    return supplyLines[diameterStr];
  }
  
  // Try with .toFixed(1) for cases like "5" vs "5.0"
  diameterStr = diameter.toFixed(1);
  
  if (attackLines[diameterStr]) {
    return attackLines[diameterStr];
  }
  
  if (supplyLines[diameterStr]) {
    return supplyLines[diameterStr];
  }
  
  // Default fallback
  console.warn(`No friction coefficient found for ${diameter}" hose, using default 2.0`);
  return 2.0;
}

/**
 * Calculate nozzle flow using Freeman formula for smooth bore
 * or return rated flow for fog nozzles
 * 
 * Freeman: Q = 29.7 × d² × √NP
 * 
 * @param nozzle - Nozzle configuration
 * @returns Flow in GPM
 */
export function calcNozzleFlow(nozzle: NozzleConfig): number {
  if (nozzle.type === 'fog') {
    return nozzle.ratedFlow ?? 150; // Default fog nozzle flow
  }
  
  // Smooth bore - Freeman formula
  if (!nozzle.diameter) {
    throw new Error('Smooth bore nozzle requires diameter');
  }
  
  const coefficient = 29.7;
  const diameterSquared = Math.pow(nozzle.diameter, 2);
  const pressureSqrt = Math.sqrt(nozzle.pressure);
  
  return coefficient * diameterSquared * pressureSqrt;
}

/**
 * Calculate total appliance losses
 * 
 * @param applianceKeys - Array of appliance keys from appliances.json
 * @returns Total pressure loss in PSI (negative for boost)
 */
export function calcApplianceLoss(applianceKeys: string[]): number {
  const applianceData = appliances.appliances as Record<string, number>;
  return applianceKeys.reduce((total, key) => {
    const loss = applianceData[key];
    if (loss === undefined) {
      console.warn(`Unknown appliance: ${key}, assuming 0 PSI loss`);
      return total;
    }
    return total + loss;
  }, 0);
}

/**
 * Calculate required pump discharge pressure for a discharge line
 * 
 * PDP = NP + FL + AL + EP
 * Where:
 * - NP = Nozzle Pressure
 * - FL = Friction Loss
 * - AL = Appliance Loss
 * - EP = Elevation Pressure (0.434 PSI per foot)
 * 
 * @param discharge - Discharge configuration
 * @param elevation - Elevation change in feet (positive = uphill)
 * @returns Required pump discharge pressure in PSI
 */
export function calcRequiredPDP(discharge: DischargeConfig, elevation: number = 0): number {
  const flow = calcNozzleFlow(discharge.nozzle);
  const frictionLoss = calcFrictionLoss(flow, discharge.hose);
  const applianceLoss = calcApplianceLoss(discharge.appliances);
  const elevationPressure = elevation * 0.434;
  
  return discharge.nozzle.pressure + frictionLoss + applianceLoss + elevationPressure;
}

/**
 * Calculate hydrant flow using NFPA 291 formula
 * 
 * Q₂ = Q₁ × √((P₁ - P_res) / (P₂ - P_res))
 * 
 * Where P_res is residual pressure in the main (typically 20 PSI minimum)
 * 
 * @param staticPressure - Static pressure in PSI
 * @param residualPressure - Residual pressure at test flow in PSI
 * @param testFlow - Test flow in GPM
 * @param desiredResidual - Desired residual (default 20 PSI per NFPA)
 * @returns Available flow at desired residual in GPM
 */
export function calcHydrantFlow(
  staticPressure: number,
  residualPressure: number,
  testFlow: number,
  desiredResidual: number = 20
): number {
  // NFPA 291 formula
  const numerator = staticPressure - desiredResidual;
  const denominator = residualPressure - desiredResidual;
  
  if (denominator <= 0) {
    console.warn('Invalid hydrant test data: residual <= desired residual');
    return 0;
  }
  
  return testFlow * Math.sqrt(numerator / denominator);
}

/**
 * Solve for required intake pressure given multiple discharge lines
 * This uses parallel flow principles
 * 
 * @param discharges - Array of discharge configurations
 * @param totalFlow - Total flow being supplied (GPM)
 * @param supplyHose - Intake hose configuration
 * @returns Required intake pressure in PSI
 */
export function solveIntakePressure(
  discharges: DischargeConfig[],
  totalFlow: number,
  supplyHose: HoseConfig
): number {
  // Calculate max PDP needed
  const maxPDP = Math.max(...discharges.map(d => calcRequiredPDP(d)));
  
  // Calculate friction loss in supply line
  const supplyFriction = calcFrictionLoss(totalFlow, supplyHose);
  
  // Required intake pressure to overcome friction and maintain PDP
  return maxPDP + supplyFriction;
}

/**
 * Pump performance curve calculation per NFPA 1901
 * 
 * @param ratedGPM - Rated capacity (e.g., 1500 GPM)
 * @param currentGPM - Current flow
 * @param ratedPSI - Rated pressure at 100% capacity (150 PSI)
 * @returns Maximum available pressure at current flow
 */
export function calcPumpPerformance(
  ratedGPM: number,
  currentGPM: number,
  ratedPSI: number = 150
): number {
  const flowPercent = currentGPM / ratedGPM;
  
  if (flowPercent <= 0.5) {
    // 50% flow or less: 165 PSI (110% of rated)
    return ratedPSI * 1.1;
  } else if (flowPercent <= 1.0) {
    // 50-100% flow: interpolate from 165 PSI to 150 PSI
    const slope = (ratedPSI - ratedPSI * 1.1) / 0.5;
    const intercept = ratedPSI * 1.1;
    return slope * (flowPercent - 0.5) + intercept;
  } else {
    // 100-150% flow: interpolate from 150 PSI to 100 PSI (65% of rated)
    const slope = (ratedPSI * 0.65 - ratedPSI) / 0.5;
    const intercept = ratedPSI;
    return slope * (flowPercent - 1.0) + intercept;
  }
}

/**
 * Friction loss calculation parameters.
 * Supports two modes:
 * 1. 'psi_per100': Direct psi/100' value (from preset or override)
 * 2. 'coefficient': Uses standard FL formula with C coefficient
 * 
 * Formula: FL = C × (Q/100)² × (L/100)
 * Reference: Task Force Tips - Hydraulic Calculations Every Firefighter Needs to Know
 * https://tft.com/hydraulic-calculations-every-firefighter-needs-to-know/
 */
export interface FrictionLossParams {
  gpm: number
  lengthFt: number
  mode: 'psi_per100' | 'coefficient'
  value: number  // psi/100' value or C coefficient, depending on mode
}

/**
 * Friction loss calculation result with detailed breakdown
 */
export interface FrictionLossResult {
  totalPsi: number      // Total friction loss for the entire line
  psiPer100: number     // Friction loss per 100 feet
  coeffUsed: number     // C coefficient used (calculated if in psi_per100 mode)
  formula: string       // Human-readable formula used
}

/**
 * Compute friction loss for a hose line.
 * Supports both preset (psi/100') and coefficient-based calculation modes.
 * 
 * @param params - Friction loss parameters
 * @returns Detailed friction loss result
 */
export function computeLineFrictionLoss(params: FrictionLossParams): FrictionLossResult {
  const { gpm, lengthFt, mode, value } = params
  const L100 = lengthFt / 100
  
  if (mode === 'psi_per100') {
    // Direct psi/100' mode (from preset or user override)
    const psiPer100 = value
    const totalPsi = psiPer100 * L100
    // Back-calculate coefficient for transparency
    const Q100 = gpm / 100
    const coeffUsed = Q100 > 0 ? psiPer100 / (Q100 * Q100) : 0
    
    return {
      totalPsi,
      psiPer100,
      coeffUsed,
      formula: `FL = ${psiPer100.toFixed(1)} psi/100' × ${L100.toFixed(2)} = ${totalPsi.toFixed(1)} psi`
    }
  } else {
    // Coefficient mode: FL = C × (Q/100)² × (L/100)
    const C = value
    const Q100 = gpm / 100
    const totalPsi = C * Q100 * Q100 * L100
    const psiPer100 = gpm > 0 ? totalPsi / L100 : 0
    
    return {
      totalPsi,
      psiPer100,
      coeffUsed: C,
      formula: `FL = ${C} × (${gpm}/100)² × ${L100.toFixed(2)} = ${totalPsi.toFixed(1)} psi`
    }
  }
}

/**
 * Convert a psi/100' value to its equivalent C coefficient at a given flow rate.
 * Useful for allowing users to input psi/100' while maintaining internal consistency.
 * 
 * Formula: C = (psi/100') / (Q/100)²
 * 
 * @param psiPer100 - Friction loss in psi per 100 feet
 * @param referenceGpm - Reference flow rate in GPM
 * @returns C coefficient
 */
export function convertPsiPer100ToCoefficient(
  psiPer100: number,
  referenceGpm: number
): number {
  if (referenceGpm <= 0) return 0
  const Q100 = referenceGpm / 100
  return psiPer100 / (Q100 * Q100)
}

/**
 * Convert a C coefficient to psi/100' at a given flow rate.
 * 
 * Formula: psi/100' = C × (Q/100)²
 * 
 * @param coefficient - Friction loss coefficient
 * @param referenceGpm - Reference flow rate in GPM
 * @returns Friction loss in psi per 100 feet
 */
export function convertCoefficientToPsiPer100(
  coefficient: number,
  referenceGpm: number
): number {
  const Q100 = referenceGpm / 100
  return coefficient * Q100 * Q100
}