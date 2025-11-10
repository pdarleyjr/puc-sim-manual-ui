// Feature flag utility with query parameter override support
type FlagName = 'MOBILE_APP_UI' | 'HYDRANT_LAB_V2' | 'CALC_ENGINE_V2' | 'SCENARIO_ADMIN' | 'SCENARIOS_UNIFIED';

const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const qp = (name: FlagName) => q?.get('flag:' + name.toLowerCase()) ?? null;

export function featureFlag(name: FlagName, fallback = false): boolean {
  const key = `VITE_${name}`;
  const override = qp(name);
  if (override === '1' || override === 'true') return true;
  if (override === '0' || override === 'false') return false;
  
  // SCENARIOS_UNIFIED defaults to true if SCENARIO_ADMIN is enabled
  if (name === 'SCENARIOS_UNIFIED') {
    const scenariosUnifiedVal = (import.meta as any).env?.['VITE_SCENARIOS_UNIFIED'];
    const scenarioAdminVal = (import.meta as any).env?.['VITE_SCENARIO_ADMIN'];
    
    if (typeof scenariosUnifiedVal === 'string' && scenariosUnifiedVal === 'true') return true;
    if (typeof scenarioAdminVal === 'string' && scenarioAdminVal === 'true') return true;
    return fallback;
  }
  
  const val = (import.meta as any).env?.[key];
  return typeof val === 'string' ? val === 'true' : fallback;
}