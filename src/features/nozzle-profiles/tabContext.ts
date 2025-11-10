import type { TabId } from './types';

/**
 * Derive TabId from route pathname
 * Used for per-tab nozzle override resolution
 */
export function getTabIdFromRoute(pathname: string): TabId {
  if (pathname.includes('/hydrant-lab') || pathname.includes('/hydrant')) return 'hydrant_lab';
  if (pathname.includes('/scenarios/run') || pathname.includes('/scenario-runner')) return 'scenarios_runner';
  if (pathname.includes('/scenarios') || pathname.includes('/scenario-admin')) return 'admin_scenarios';
  if (pathname.includes('/admin/nozzles') || pathname.includes('/nozzle')) return 'admin_nozzles';
  return 'panel';  // default
}