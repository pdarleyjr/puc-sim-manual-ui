import { useMemo } from 'react';
import { useNozzleProfiles } from '../store';
import { computeDischargeWithNozzle } from '../../../engine/calcEngineV2';
import type { TabId, NozzleCategory } from '../types';

interface DischargeParams {
  tabId: TabId;
  category: NozzleCategory;
  hoseLengthFt: number;
  hoseDiameterIn: number;
  elevationGainFt?: number;
  applianceLossPsi?: number;
}

/**
 * Hook for computing nozzle-aware discharge calculations.
 * 
 * Integrates with the nozzle profiles system to provide NFPA-compliant
 * hydraulics. Automatically subscribes to nozzle store changes for reactive
 * recalculation when presets or overrides change.
 * 
 * Returns null if no nozzle preset is available, signaling that legacy
 * calculations should be used instead.
 * 
 * @param params - Discharge parameters including tab context and hose config
 * @returns Discharge calculation result or null for fallback
 */
export function useDischargeCalc(params: DischargeParams) {
  const { tabId, category, hoseLengthFt, hoseDiameterIn, elevationGainFt = 0, applianceLossPsi = 0 } = params;
  
  // Subscribe to store - any change to presets or overrides will trigger recalc
  const presets = useNozzleProfiles((s) => s.presets);
  const localOverrides = useNozzleProfiles((s) => s.localOverrides);
  const getEffectiveNozzle = useNozzleProfiles((s) => s.getEffectiveNozzle);
  
  return useMemo(() => {
    // Get effective nozzle for this discharge (respects precedence: local override → admin default)
    const preset = getEffectiveNozzle(tabId, category);
    
    if (!preset) {
      // No preset available - return null to signal legacy calculation should be used
      return null;
    }
    
    // Use nozzle-aware calculation
    return computeDischargeWithNozzle(
      preset,
      hoseLengthFt,
      hoseDiameterIn,
      elevationGainFt,
      applianceLossPsi
    );
  }, [tabId, category, hoseLengthFt, hoseDiameterIn, elevationGainFt, applianceLossPsi, presets, localOverrides, getEffectiveNozzle]);
}