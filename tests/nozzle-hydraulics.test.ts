import { describe, it, expect, beforeEach } from 'vitest';
import { computeDischargeWithNozzle, calcNozzleFlow } from '../src/engine/calcEngineV2';
import { useNozzleProfiles } from '../src/features/nozzle-profiles/store';
import { generateDefaultPresets } from '../src/features/nozzle-profiles/presets';
import type { NozzlePreset } from '../src/features/nozzle-profiles/types';

describe('Nozzle Hydraulics', () => {
  beforeEach(async () => {
    // Reset store and load defaults
    const store = useNozzleProfiles.getState();
    
    // Clear existing data
    const existingPresets = store.presets;
    for (const preset of existingPresets) {
      await store.deletePreset(preset.id);
    }
    
    // Load default presets
    await store.seedDefaultPresets();
  });

  describe('Freeman Formula (Smooth-Bore)', () => {
    it('should calculate 15/16" @ 50 psi ≈ 185 GPM', () => {
      // Find the 15/16" smooth bore preset
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'smooth_bore' && 
        p.tipDiameterIn === 15/16
      );
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(
        preset!,
        200,  // 200 ft hose
        1.75, // 1.75" diameter
        0,    // no elevation
        0     // no appliance loss
      );
      
      // Freeman: Q = 29.7 × (15/16)² × √50 ≈ 185 GPM
      // Allow ±5 GPM tolerance for rounding
      expect(result.gpm).toBeCloseTo(185, -1);
    });

    it('should calculate 1.125" @ 50 psi ≈ 265 GPM', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'smooth_bore' && 
        p.tipDiameterIn === 1.125
      );
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(
        preset!,
        200,
        2.5,
        0,
        0
      );
      
      // Freeman: Q = 29.7 × 1.125² × √50 ≈ 265 GPM
      expect(result.gpm).toBeCloseTo(265, -1);
    });

    it('should increase GPM when NP increases (monotonic)', () => {
      // Test Freeman formula behavior: higher pressure = higher flow
      const tipDiameter = 15/16;
      
      // Calculate at different nozzle pressures
      const gpm50 = 29.7 * Math.pow(tipDiameter, 2) * Math.sqrt(50);
      const gpm60 = 29.7 * Math.pow(tipDiameter, 2) * Math.sqrt(60);
      const gpm80 = 29.7 * Math.pow(tipDiameter, 2) * Math.sqrt(80);
      
      expect(gpm60).toBeGreaterThan(gpm50);
      expect(gpm80).toBeGreaterThan(gpm60);
    });

    it('should use rated NP from preset', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'smooth_bore' && 
        p.tipDiameterIn === 15/16
      );
      
      expect(preset).toBeDefined();
      expect(preset!.ratedNPpsi).toBe(50);
      
      const result = computeDischargeWithNozzle(preset!, 200, 1.75, 0, 0);
      expect(result.np).toBe(50);
    });
  });

  describe('Friction Loss', () => {
    it('should increase FL with longer hose', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'smooth_bore' && 
        p.tipDiameterIn === 15/16
      );
      
      expect(preset).toBeDefined();
      
      const short = computeDischargeWithNozzle(preset!, 100, 1.75, 0, 0);
      const long = computeDischargeWithNozzle(preset!, 300, 1.75, 0, 0);
      
      expect(long.fl).toBeGreaterThan(short.fl);
      expect(long.pdp).toBeGreaterThan(short.pdp);
    });

    it('should decrease FL with larger hose diameter', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'smooth_bore' && 
        p.tipDiameterIn === 1.125
      );
      
      expect(preset).toBeDefined();
      
      const small = computeDischargeWithNozzle(preset!, 200, 1.75, 0, 0);
      const large = computeDischargeWithNozzle(preset!, 200, 2.5, 0, 0);
      
      // Larger diameter = less friction loss
      expect(large.fl).toBeLessThan(small.fl);
    });

    it('should include elevation gain in PDP', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'smooth_bore' && 
        p.tipDiameterIn === 15/16
      );
      
      expect(preset).toBeDefined();
      
      const flat = computeDischargeWithNozzle(preset!, 200, 1.75, 0, 0);
      const elevated = computeDischargeWithNozzle(preset!, 200, 1.75, 30, 0);
      
      // 30 ft elevation = 30 × 0.434 ≈ 13 psi
      const expectedElevationPsi = 30 * 0.434;
      expect(elevated.elevation).toBeCloseTo(expectedElevationPsi, 1);
      expect(elevated.pdp - flat.pdp).toBeCloseTo(expectedElevationPsi, 1);
    });

    it('should include appliance loss in PDP', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'smooth_bore' && 
        p.tipDiameterIn === 15/16
      );
      
      expect(preset).toBeDefined();
      
      const noAppliance = computeDischargeWithNozzle(preset!, 200, 1.75, 0, 0);
      const withAppliance = computeDischargeWithNozzle(preset!, 200, 1.75, 0, 15);
      
      expect(withAppliance.appliance).toBe(15);
      expect(withAppliance.pdp - noAppliance.pdp).toBeCloseTo(15, 1);
    });
  });

  describe('Fog Nozzles', () => {
    it('should use rated GPM for fog nozzles', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'fog_fixed' && 
        p.ratedGPM === 150
      );
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(preset!, 200, 2.5, 0, 0);
      
      // Fog nozzles use rated GPM regardless of pressure
      expect(result.gpm).toBe(150);
    });

    it('should use rated NP for fog nozzles', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'fog_fixed' && 
        p.ratedGPM === 150
      );
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(preset!, 200, 2.5, 0, 0);
      
      // Should use fog rated NP (typically 100 psi)
      expect(result.np).toBe(preset!.ratedNPpsiFog ?? 100);
    });

    it('should maintain constant flow regardless of PDP', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => 
        p.kind === 'fog_fixed' && 
        p.ratedGPM === 150
      );
      
      expect(preset).toBeDefined();
      
      const short = computeDischargeWithNozzle(preset!, 100, 2.5, 0, 0);
      const long = computeDischargeWithNozzle(preset!, 300, 2.5, 0, 0);
      
      // Flow should be constant (rated GPM) even with different friction losses
      expect(short.gpm).toBe(150);
      expect(long.gpm).toBe(150);
      
      // But PDP should vary with friction loss
      expect(long.pdp).toBeGreaterThan(short.pdp);
    });
  });

  describe('calcNozzleFlow Legacy Function', () => {
    it('should calculate smooth bore flow using Freeman formula', () => {
      const flow = calcNozzleFlow({
        type: 'smooth_bore',
        diameter: 15/16,
        pressure: 50
      });
      
      // Q = 29.7 × d² × √P
      const expected = 29.7 * Math.pow(15/16, 2) * Math.sqrt(50);
      expect(flow).toBeCloseTo(expected, 1);
    });

    it('should return rated flow for fog nozzles', () => {
      const flow = calcNozzleFlow({
        type: 'fog',
        ratedFlow: 175,
        pressure: 100
      });
      
      expect(flow).toBe(175);
    });

    it('should default to 150 GPM if no rated flow specified', () => {
      const flow = calcNozzleFlow({
        type: 'fog',
        pressure: 100
      });
      
      expect(flow).toBe(150);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null preset gracefully', () => {
      const result = computeDischargeWithNozzle(null, 200, 1.75, 0, 0);
      
      expect(result.gpm).toBe(0);
      expect(result.pdp).toBe(0);
      expect(result.np).toBe(0);
      expect(result.fl).toBe(0);
    });

    it('should handle zero hose length', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => p.kind === 'smooth_bore');
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(preset!, 0, 1.75, 0, 0);
      
      expect(result.fl).toBe(0);
      expect(result.pdp).toBe(result.np); // PDP = NP when no friction
    });

    it('should handle negative elevation (downhill)', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => p.kind === 'smooth_bore');
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(preset!, 200, 1.75, -20, 0);
      
      // Negative elevation reduces required PDP
      const expectedElevationPsi = -20 * 0.434;
      expect(result.elevation).toBeCloseTo(expectedElevationPsi, 1);
      expect(result.elevation).toBeLessThan(0);
    });
  });

  describe('PDP Calculation', () => {
    it('should calculate PDP as NP + FL + Elevation + Appliance', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => p.kind === 'smooth_bore');
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(preset!, 200, 1.75, 30, 10);
      
      const calculatedPdp = result.np + result.fl + result.elevation + result.appliance;
      expect(result.pdp).toBeCloseTo(calculatedPdp, 1);
    });

    it('should show all PDP components separately', () => {
      const presets = useNozzleProfiles.getState().presets;
      const preset = presets.find(p => p.kind === 'smooth_bore');
      
      expect(preset).toBeDefined();
      
      const result = computeDischargeWithNozzle(preset!, 200, 1.75, 30, 10);
      
      // All components should be present
      expect(result.np).toBeGreaterThan(0);
      expect(result.fl).toBeGreaterThan(0);
      expect(result.elevation).toBeGreaterThan(0);
      expect(result.appliance).toBe(10);
    });
  });
});