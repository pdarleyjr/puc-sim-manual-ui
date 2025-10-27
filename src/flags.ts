// Feature flag utility with query parameter override support
type FlagName = 'MOBILE_APP_UI' | 'HYDRANT_LAB_V2' | 'CALC_ENGINE_V2';

const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
const qp = (name: FlagName) => q?.get('flag:' + name.toLowerCase()) ?? null;

export function featureFlag(name: FlagName, fallback = false): boolean {
  const key = `VITE_${name}`;
  const override = qp(name);
  if (override === '1' || override === 'true') return true;
  if (override === '0' || override === 'false') return false;
  const val = (import.meta as any).env?.[key];
  return typeof val === 'string' ? val === 'true' : fallback;
}