import { useStore } from '../../state/store'
import { selectTankPct, selectFoamPct, selectMasterIntakePsi, selectMasterDischargePsi } from '../../state/selectors'
import GovernorChip from './GovernorChip'

interface HUDPillProps {
  label: string
  value: string | number
  unit?: string
  tone?: 'danger' | 'warn'
}

function HUDPill({ label, value, unit, tone }: HUDPillProps) {
  const colorClass = tone === 'danger' 
    ? 'text-red-400 border-red-500/40' 
    : tone === 'warn' 
    ? 'text-amber-400 border-amber-500/40' 
    : 'text-slate-100 border-[#2a3340]'
  
  return (
    <div className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg bg-[#0b1220]/80 border ${colorClass}`}>
      <div className="text-[9px] uppercase tracking-wide opacity-60 font-medium">{label}</div>
      <div className="text-sm font-bold font-mono">
        {value}{unit && <span className="text-[10px] ml-0.5 opacity-70">{unit}</span>}
      </div>
    </div>
  )
}

export default function TopHUD() {
  const water = useStore(selectTankPct)
  const foam = useStore(selectFoamPct)
  const inPsi = useStore(selectMasterIntakePsi)
  const outPsi = useStore(selectMasterDischargePsi)
  
  return (
    <header className="h-[88px] px-3 grid grid-cols-5 items-center gap-2 bg-[#0f141a]/95 backdrop-blur border-b border-[#232b35]">
      <HUDPill label="WATER" value={`${water}%`} />
      <HUDPill label="FOAM" value={`${foam}%`} />
      <HUDPill 
        label="INTAKE" 
        value={inPsi} 
        unit="PSI" 
        tone={inPsi < 0 ? 'danger' : inPsi < 10 ? 'warn' : undefined}
      />
      <HUDPill label="DISCH" value={outPsi} unit="PSI" />
      <GovernorChip />
    </header>
  )
}