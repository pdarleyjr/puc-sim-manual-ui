import type { AppState } from './store'

export const selectMasterDischarge = (st: AppState) =>
  Math.min(
    Math.max(...Object.values(st.discharges).map(d => d.open ? d.setPsi : 0), 0),
    400
  )

export const selectMasterIntake = (st: AppState) => st.gauges.masterIntake

export const selectRpm = (st: AppState) => st.gauges.rpm

export const selectPumpEngaged = (st: AppState) => st.pumpEngaged

export const selectSource = (st: AppState) => st.source