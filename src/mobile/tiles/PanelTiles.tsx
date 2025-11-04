import { useStore } from '../../state/store'
import { useShallow } from 'zustand/react/shallow'
import type { DischargeId } from '../../state/store'

export default function PanelTiles() {
  const discharges = useStore(state => state.discharges)
  const setLine = useStore(state => state.setLine)
  const { 
    tankPct, 
    foamPct, 
    foamEnabled,
    governorSetPsi,
    setGovernorSetPsi
  } = useStore(
    useShallow(state => ({
      tankPct: Math.round((state.gauges.waterGal / state.capacities.water) * 100),
      foamPct: Math.round((state.gauges.foamGal / state.capacities.foam) * 100),
      foamEnabled: state.foamEnabled,
      governorSetPsi: state.governor.setPsi,
      setGovernorSetPsi: state.setGovernorSetPsi
    }))
  )
  
  // Active discharges first, then intakes, then foam
  const activeLines = Object.values(discharges).filter(d => d.open)
  const inactiveLines = Object.values(discharges).filter(d => !d.open)
  
  const handleGovernorPreset = (psi: number) => {
    setGovernorSetPsi(psi)
  }
  
  const openAllDischarges = () => {
    Object.keys(discharges).forEach(id => {
      setLine(id as DischargeId, { open: true })
    })
  }
  
  const closeAllDischarges = () => {
    Object.keys(discharges).forEach(id => {
      setLine(id as DischargeId, { open: false })
    })
  }
  
  return (
    <div className="flex flex-col gap-3 py-2">
      {/* Discharge Gate Controls */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">Discharge Gates</div>
        <div className="grid grid-cols-2 gap-2">
          {/* Active discharges */}
          {activeLines.map(discharge => (
            <ToggleTile
              key={discharge.id}
              title={discharge.label}
              sub={`${Math.round(discharge.gpmNow)} GPM`}
              onClick={() => setLine(discharge.id, { open: false })}
              onHold={() => {/* TODO: Open details modal */}}
              active={true}
            />
          ))}
          
          {/* Inactive discharges */}
          {inactiveLines.map(discharge => (
            <ToggleTile
              key={discharge.id}
              title={discharge.label}
              sub="Closed"
              onClick={() => setLine(discharge.id, { open: true })}
              onHold={() => {/* TODO: Open details modal */}}
              active={false}
            />
          ))}
        </div>
      </div>
      
      {/* Master Discharge Control */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">Master Control</div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={openAllDischarges}
            className="h-[56px] rounded-xl bg-green-900/20 border border-green-700/50 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-green-500"
            aria-label="Open all discharge gates"
          >
            <div className="text-[12px] font-medium text-green-400">Open All</div>
            <div className="text-[9px] text-green-400/70">Discharges</div>
          </button>
          <button
            onClick={closeAllDischarges}
            className="h-[56px] rounded-xl bg-red-900/20 border border-red-700/50 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Close all discharge gates"
          >
            <div className="text-[12px] font-medium text-red-400">Close All</div>
            <div className="text-[9px] text-red-400/70">Safety Stop</div>
          </button>
        </div>
      </div>
      
      {/* Governor Presets */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">Governor Pressure (PDP)</div>
        <div className="grid grid-cols-4 gap-2">
          {[50, 100, 150, 200].map(psi => (
            <button
              key={psi}
              onClick={() => handleGovernorPreset(psi)}
              className={`h-[48px] rounded-xl px-2 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                governorSetPsi === psi
                  ? 'bg-sky-900/30 border border-sky-700'
                  : 'bg-[#0f141a] border border-[#232b35]'
              }`}
              aria-label={`Set governor to ${psi} PSI`}
              aria-pressed={governorSetPsi === psi}
            >
              <div className={`text-[13px] font-bold ${governorSetPsi === psi ? 'text-sky-400' : 'text-slate-100'}`}>
                {psi}
              </div>
              <div className="text-[9px] text-slate-400">PSI</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Tank & Foam Status */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">Tank Status</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-[56px] rounded-xl bg-[#0f141a] border border-[#232b35] px-3 flex flex-col justify-center">
            <div className="text-[9px] text-slate-400 uppercase">Water Tank</div>
            <div className="flex items-baseline gap-1">
              <div className={`text-[18px] font-bold tabular-nums ${
                tankPct < 10 ? 'text-red-400' : tankPct < 25 ? 'text-amber-400' : 'text-green-400'
              }`}>
                {tankPct}
              </div>
              <div className="text-[11px] text-slate-400">%</div>
            </div>
          </div>
          
          {foamEnabled && (
            <div className="h-[56px] rounded-xl bg-[#0f141a] border border-[#232b35] px-3 flex flex-col justify-center">
              <div className="text-[9px] text-slate-400 uppercase">Foam Tank</div>
              <div className="flex items-baseline gap-1">
                <div className={`text-[18px] font-bold tabular-nums ${
                  foamPct < 10 ? 'text-red-400' : 'text-purple-400'
                }`}>
                  {foamPct}
                </div>
                <div className="text-[11px] text-slate-400">%</div>
              </div>
            </div>
          )}
          
          {!foamEnabled && (
            <div className="h-[56px] rounded-xl bg-[#0f141a] border border-[#232b35] px-3 flex items-center justify-center">
              <div className="text-[10px] text-slate-500 italic">Foam Inactive</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface ToggleTileProps {
  title: string
  sub: string
  onClick: () => void
  onHold?: () => void
  active?: boolean
}

function ToggleTile({ title, sub, onClick, onHold, active }: ToggleTileProps) {
  return (
    <button
      className={`h-[56px] min-w-[92px] rounded-xl px-2 text-left active:scale-[.99] 
        focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
        active 
          ? 'bg-sky-900/30 border border-sky-700' 
          : 'bg-[#0f141a] border border-[#232b35]'
      }`}
      aria-label={`${title} ${sub}`}
      aria-pressed={active}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault()
        onHold?.()
      }}
    >
      <div className="text-[12px] font-medium text-slate-100">{title}</div>
      <div className={`text-[10px] ${active ? 'text-sky-400' : 'text-slate-400'}`}>{sub}</div>
    </button>
  )
}