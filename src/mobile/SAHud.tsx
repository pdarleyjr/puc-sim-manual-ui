import { useStore } from '../state/store'
import { useShallow } from 'zustand/react/shallow'
import { 
  selectTankPct, 
  selectFoamPct, 
  selectMasterIntakePsi, 
  selectMasterDischargePsi
} from '../state/selectors'
import { useCollapseHeader } from './hooks/useCollapseHeader'

export default function SAHud() {
  const tankPct = useStore(selectTankPct)
  const foamPct = useStore(selectFoamPct)
  const intakePsi = useStore(selectMasterIntakePsi)
  const dischargePsi = useStore(selectMasterDischargePsi)
  
  const { governorMode, governorSetpoint, setGovernorSetPsi, setGovernorSetRpm } = useStore(
    useShallow(state => ({
      governorMode: state.governor.mode === 'pressure' ? 'PDP' : 'RPM',
      governorSetpoint: state.governor.mode === 'pressure' ? state.governor.setPsi : state.governor.setRpm,
      setGovernorSetPsi: state.setGovernorSetPsi,
      setGovernorSetRpm: state.setGovernorSetRpm
    }))
  )
  
  const isCompact = useCollapseHeader('mobile-main')
  
  // Color coding for warnings (HMI best practice - calm until out of range)
  const tankColor = tankPct < 10 ? 'text-red-400' : tankPct < 25 ? 'text-amber-400' : 'text-slate-100'
  const foamColor = foamPct < 10 ? 'text-red-400' : 'text-slate-100'
  const intakeColor = intakePsi < 10 ? 'text-red-400' : intakePsi < 20 ? 'text-amber-400' : 'text-slate-100'
  const dischargeColor = dischargePsi > 300 ? 'text-red-400' : dischargePsi > 250 ? 'text-amber-400' : 'text-slate-100'
  
  const handleGovBump = (direction: 'up' | 'down', amount: number) => {
    if (governorMode === 'PDP') {
      const newVal = governorSetpoint + (direction === 'up' ? amount : -amount)
      setGovernorSetPsi(newVal)
    } else {
      const newVal = governorSetpoint + (direction === 'up' ? amount : -amount)
      setGovernorSetRpm(newVal)
    }
  }

  return (
    <header 
      className={`sticky top-0 z-40 bg-[#0f141a] border-b border-[#232b35] transition-[height] duration-200 ${
        isCompact ? 'h-[48px]' : 'h-[72px]'
      }`}
      data-compact={isCompact}
    >
      <div className="grid grid-cols-5 gap-1 h-full items-center px-2 font-mono text-[11px] tabular-nums">
        {/* Water % */}
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wide">Water</div>
          <div className={`text-[14px] font-bold ${tankColor}`}>{tankPct}%</div>
        </div>
        
        {/* Foam % */}
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wide">Foam</div>
          <div className={`text-[14px] font-bold ${foamColor}`}>{foamPct}%</div>
        </div>
        
        {/* Intake PSI */}
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wide">Intake</div>
          <div className={`text-[14px] font-bold ${intakeColor}`}>{intakePsi}</div>
        </div>
        
        {/* Discharge PSI */}
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wide">Disch</div>
          <div className={`text-[14px] font-bold ${dischargeColor}`}>{dischargePsi}</div>
        </div>
        
        {/* Governor with bumpers */}
        <div className="text-center">
          <div className="text-[9px] text-slate-400 uppercase tracking-wide">{governorMode}</div>
          <div className="flex items-center justify-center gap-0.5">
            <button
              onClick={() => handleGovBump('down', 5)}
              className="w-5 h-5 flex items-center justify-center rounded bg-[#232b35] active:bg-[#2a3441] text-[10px]"
              aria-label={`Decrease ${governorMode} by 5`}
            >
              −
            </button>
            <div className="text-[14px] font-bold text-sky-400 min-w-[40px]">{governorSetpoint}</div>
            <button
              onClick={() => handleGovBump('up', 5)}
              className="w-5 h-5 flex items-center justify-center rounded bg-[#232b35] active:bg-[#2a3441] text-[10px]"
              aria-label={`Increase ${governorMode} by 5`}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}