import type { AppState } from './store'
import { CAVITATION_INTAKE_THRESHOLD, CAVITATION_RPM_THRESHOLD, CAVITATION_DISCHARGE_THRESHOLD } from './constants'

export const selectMasterIntake = (st: AppState) => st.gauges.masterIntake

export const selectMasterDischarge = (st: AppState) => st.gauges.masterDischarge

export const selectRpm = (st: AppState) => st.gauges.rpm

export const selectPumpEngaged = (st: AppState) => st.pumpEngaged

export const selectSource = (st: AppState) => st.source

// Cavitation detection
export const selectCavitating = (st: AppState) => {
  const nearDry = st.gauges.masterIntake <= CAVITATION_INTAKE_THRESHOLD
  const negSuction = st.gauges.masterIntake < 0
  const highDemand = st.gauges.rpm >= CAVITATION_RPM_THRESHOLD || selectMasterDischarge(st) >= CAVITATION_DISCHARGE_THRESHOLD
  return (nearDry || negSuction) && highDemand
}

// Residual pressure badge (hydrant only)
export const selectResidualBadge = (st: AppState): 'green' | 'amber' | 'red' | null => {
  if (st.source !== 'hydrant') return null
  const intake = st.gauges.masterIntake
  if (intake >= 20) return 'green'
  if (intake >= 10) return 'amber'
  return 'red'
}