import type { AppState } from './store'

export const selectMasterIntake = (st: AppState) => st.gauges.masterIntake

export const selectRpm = (st: AppState) => st.gauges.rpm

export const selectPumpEngaged = (st: AppState) => st.pumpEngaged

export const selectSource = (st: AppState) => st.source