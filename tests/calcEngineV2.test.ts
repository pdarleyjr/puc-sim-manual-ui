import { describe, it, expect } from 'vitest';
import {
  calcFrictionLoss,
  calcNozzleFlow,
  calcApplianceLoss,
  calcRequiredPDP,
  calcHydrantFlow,
  calcPumpPerformance,
  type HoseConfig,
  type NozzleConfig,
  type DischargeConfig
} from '../src/engine/calcEngineV2';

describe('CalcEngineV2 - Friction Loss', () => {
  it('calculates 5" hose friction correctly', () => {
    const hose: HoseConfig = { diameter: 5.0, length: 100 };
    const flow = 1000;
    const loss = calcFrictionLoss(flow, hose);
    
    // FL = 0.025 × (1000/100)² × (100/100) = 0.025 × 100 × 1 = 2.5 PSI
    expect(loss).toBeCloseTo(2.5, 1);
  });
  
  it('calculates 2.5" attack line friction correctly', () => {
    const hose: HoseConfig = { diameter: 2.5, length: 200 };
    const flow = 150;
    const loss = calcFrictionLoss(flow, hose);
    
    // FL = 2.0 × (150/100)² × (200/100) = 2.0 × 2.25 × 2 = 9.0 PSI
    expect(loss).toBeCloseTo(9.0, 1);
  });
});

describe('CalcEngineV2 - Nozzle Flow', () => {
  it('calculates smooth bore flow using Freeman formula', () => {
    const nozzle: NozzleConfig = {
      type: 'smooth_bore',
      diameter: 1.5,
      pressure: 50
    };
    
    const flow = calcNozzleFlow(nozzle);
    // Q = 29.7 × 1.5² × √50 = 29.7 × 2.25 × 7.07 ≈ 472 GPM
    expect(flow).toBeGreaterThan(450);
    expect(flow).toBeLessThan(500);
  });
  
  it('returns rated flow for fog nozzles', () => {
    const nozzle: NozzleConfig = {
      type: 'fog',
      ratedFlow: 150,
      pressure: 100
    };
    
    expect(calcNozzleFlow(nozzle)).toBe(150);
  });
});

describe('CalcEngineV2 - Hydrant Flow', () => {
  it('calculates available flow using NFPA 291 formula', () => {
    // Example: 60 static, 50 residual @ 500 GPM
    const flow = calcHydrantFlow(60, 50, 500, 20);
    
    // Q₂ = 500 × √((60-20)/(50-20)) = 500 × √(40/30) = 500 × 1.15 ≈ 577 GPM
    expect(flow).toBeGreaterThan(550);
    expect(flow).toBeLessThan(600);
  });
});

describe('CalcEngineV2 - Pump Performance', () => {
  it('provides 110% pressure at 50% flow', () => {
    const pressure = calcPumpPerformance(1500, 750, 150);
    expect(pressure).toBeCloseTo(165, 0);
  });
  
  it('provides 100% pressure at rated flow', () => {
    const pressure = calcPumpPerformance(1500, 1500, 150);
    expect(pressure).toBeCloseTo(150, 0);
  });
  
  it('provides 65% pressure at 150% flow', () => {
    const pressure = calcPumpPerformance(1500, 2250, 150);
    expect(pressure).toBeCloseTo(97.5, 0);
  });
});

describe('CalcEngineV2 - Integration', () => {
  it('calculates complete discharge pressure', () => {
    const discharge: DischargeConfig = {
      nozzle: { type: 'fog', ratedFlow: 150, pressure: 100 },
      hose: { diameter: 2.5, length: 200 },
      appliances: ['generic_discharge_loss']
    };
    
    const pdp = calcRequiredPDP(discharge);
    // PDP = 100 (nozzle) + ~9 (friction) + 10 (appliance) ≈ 119 PSI
    expect(pdp).toBeGreaterThan(115);
    expect(pdp).toBeLessThan(125);
  });
});