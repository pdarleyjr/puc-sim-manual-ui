import { TWO_FIVE_EVOS } from './evolutions';
import type { EvolutionSpec } from './evolutions';

/**
 * Standard fire service friction loss coefficients (C × (Q/100)² × (L/100))
 * Coefficients from IFSTA/NFPA standards
 */
const FRICTION_COEFFICIENTS: Record<number, number> = {
  1.75: 15.5,  // 1.75" handline per IFSTA
  2.5: 2.0,    // 2.5" hose standard coefficient
  3: 0.8,      // 3" hose per technical guide
  4: 0.2,      // 4" LDH standard coefficient
  5: 0.08      // 5" LDH per IFSTA/NFPA standards
};

/**
 * Calculate friction loss in discharge hose
 */
function frictionLoss(diameterIn: number, gpm: number, lengthFt: number): number {
  const C = FRICTION_COEFFICIENTS[diameterIn] || 2.0;
  const Q = gpm / 100;
  const L = lengthFt / 100;
  return C * Q * Q * L;
}

/**
 * Calculate smooth bore flow using Freeman formula
 * GPM = 29.7 × d² × √NP
 */
function smoothboreGpm(tipInches: number, nozzlePressurePsi: number): number {
  return 29.7 * tipInches * tipInches * Math.sqrt(Math.max(0, nozzlePressurePsi));
}

/**
 * Get evolution spec by ID
 */
export function getEvo(id?: string): EvolutionSpec | null {
  return id ? TWO_FIVE_EVOS.find(e => e.id === id) ?? null : null;
}

/**
 * Compute evolution performance at a given valve percentage and governor pressure
 * 
 * @param evo - Evolution specification
 * @param valvePct - Valve opening percentage (0-100)
 * @param governorPsi - Available pump discharge pressure
 * @returns Computed flow and pressure metrics
 */
export function computeEvolutionAtValve(
  evo: EvolutionSpec, 
  valvePct: number, 
  governorPsi: number
) {
  // 1) Target nozzle NP / tip flow
  const np = evo.nozzle.npPsi ?? 50;
  
  // 2) Calculate ideal flow for this nozzle at full opening
  let idealGpm: number;
  if (evo.nozzle.kind === 'sb' && evo.nozzle.tipIn) {
    // Smooth bore: calculate from tip size and NP
    idealGpm = smoothboreGpm(evo.nozzle.tipIn, np);
  } else {
    // Fog/constant flow: use rated GPM
    idealGpm = evo.nozzle.ratedGpm ?? 150;
  }
  
  // 3) Apply valve throttle - simple linear relationship
  const demandedGpm = idealGpm * (valvePct / 100);
  
  // 4) Calculate friction loss in hose
  const fl = frictionLoss(evo.hose.dia, demandedGpm, evo.hose.lengthFt);
  
  // 5) Calculate appliance losses
  const appl = (evo.appliances ?? []).reduce((sum, a) => sum + a.lossPsi, 0);
  
  // 6) Required PDP = NP + FL + appliances
  const requiredPdp = np + fl + appl;
  
  // 7) Actual PDP limited by governor
  const actualPdp = Math.min(governorPsi, requiredPdp);
  
  // 8) If limited by governor, solve for actual achievable flow
  let flow = demandedGpm;
  if (actualPdp < requiredPdp) {
    // We're pressure-limited, need to solve for reduced flow
    // For smooth bore: NP varies with flow, so we need to iterate
    // For fog: flow is constant until we can't maintain NP, then drops to zero
    if (evo.nozzle.kind === 'sb' && evo.nozzle.tipIn) {
      // Iteratively solve: actualPdp = NP(Q) + FL(Q) + appliances
      // Start with linear approximation
      const availableForHoseAndNozzle = actualPdp - appl;
      
      // Newton iteration to solve for Q
      let Q = demandedGpm;
      for (let i = 0; i < 5; i++) {
        const currentFl = frictionLoss(evo.hose.dia, Q, evo.hose.lengthFt);
        const currentNp = availableForHoseAndNozzle - currentFl;
        
        if (currentNp <= 0) {
          Q = 0;
          break;
        }
        
        // Q = 29.7 × d² × √NP
        const newQ = smoothboreGpm(evo.nozzle.tipIn, currentNp);
        
        if (Math.abs(newQ - Q) < 1) break;
        Q = newQ;
      }
      flow = Math.max(0, Q);
    } else {
      // Fog nozzle: either full flow or nothing if we can't maintain pressure
      if (actualPdp < (np + appl)) {
        flow = 0;
      }
    }
  }
  
  return { 
    requiredPdp, 
    actualPdp, 
    flow, 
    np, 
    fl, 
    appl 
  };
}

/**
 * Solve for GPM given a target PDP (inverse problem)
 * Used when you know the PDP and want to find the flow
 */
export function solveGpmForPdp(evo: EvolutionSpec, targetPdp: number): number {
  const np = evo.nozzle.npPsi ?? 50;
  const appl = (evo.appliances ?? []).reduce((sum, a) => sum + a.lossPsi, 0);
  const availableForHoseAndNozzle = targetPdp - appl;
  
  if (availableForHoseAndNozzle <= np) {
    return 0;
  }
  
  if (evo.nozzle.kind === 'sb' && evo.nozzle.tipIn) {
    // Smooth bore: iterate to find Q where PDP = NP + FL + appliances
    let Q = 100; // start guess
    
    for (let i = 0; i < 10; i++) {
      const fl = frictionLoss(evo.hose.dia, Q, evo.hose.lengthFt);
      const currentNp = availableForHoseAndNozzle - fl;
      
      if (currentNp <= 0) return 0;
      
      const newQ = smoothboreGpm(evo.nozzle.tipIn, currentNp);
      
      if (Math.abs(newQ - Q) < 1) break;
      Q = newQ;
    }
    
    return Math.max(0, Q);
  } else {
    // Fog: constant flow if pressure is sufficient
    const ratedGpm = evo.nozzle.ratedGpm ?? 150;
    const fl = frictionLoss(evo.hose.dia, ratedGpm, evo.hose.lengthFt);
    
    if (availableForHoseAndNozzle >= (np + fl)) {
      return ratedGpm;
    }
    return 0;
  }
}