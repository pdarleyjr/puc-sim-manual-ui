import { useStore } from '../../state/store'
import type { DischargeId } from '../../state/store'

export default function PanelTiles() {
  const discharges = useStore(state => state.discharges)
  const setLine = useStore(state => state.setLine)
  const foamEnabled = useStore(state => state.foamEnabled)
  
  // Active discharges first, then intakes, then foam
  const activeLines = Object.values(discharges).filter(d => d.open)
  const inactiveLines = Object.values(discharges).filter(d => !d.open)
  
  return (
    <div className="grid grid-cols-2 gap-2 py-2">
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
      
      {/* Foam tile if foam mode */}
      {foamEnabled && (
        <ToggleTile
          title="Foam System"
          sub="Active"
          onClick={() => {/* Toggle foam */}}
          active={true}
        />
      )}
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