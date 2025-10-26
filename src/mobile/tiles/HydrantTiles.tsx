import { useHydrantLab } from '../../features/hydrant-lab/store'
import type { PortId } from '../../features/hydrant-lab/store'

export default function HydrantTiles() {
  const legs = useHydrantLab(state => state.legs)
  const hav = useHydrantLab(state => state.hav)
  const attachLeg = useHydrantLab(state => state.attachLeg)
  const detachLeg = useHydrantLab(state => state.detachLeg)
  const toggleGate = useHydrantLab(state => state.toggleGate)
  const setHavEnabled = useHydrantLab(state => state.setHavEnabled)
  
  const handleLegTap = (id: PortId) => {
    const leg = legs[id]
    
    if (!leg) {
      // Not connected - attach with default 5" size
      attachLeg(id, 5)
    } else if (id === 'steamer') {
      // Steamer - detach
      detachLeg(id)
    } else {
      // Side port - toggle gate
      toggleGate(id as 'sideA' | 'sideB')
    }
  }
  
  const getLegStatus = (id: PortId): string => {
    const leg = legs[id]
    if (!leg) return 'Not Connected'
    if (id === 'steamer') return `${leg.sizeIn}" • ${leg.lengthFt}ft`
    return leg.gateOpen ? `${leg.sizeIn}" • Open` : `${leg.sizeIn}" • Closed`
  }
  
  return (
    <div className="grid grid-cols-2 gap-2 py-2">
      {/* Side A */}
      <ToggleTile
        title="Side A"
        sub={getLegStatus('sideA')}
        onClick={() => handleLegTap('sideA')}
        onHold={() => {/* TODO: Open size/length modal */}}
        active={!!legs.sideA && legs.sideA.gateOpen}
      />
      
      {/* Steamer */}
      <ToggleTile
        title="Steamer"
        sub={getLegStatus('steamer')}
        onClick={() => handleLegTap('steamer')}
        onHold={() => {/* TODO: Open size/length modal */}}
        active={!!legs.steamer}
      />
      
      {/* Side B */}
      <ToggleTile
        title="Side B"
        sub={getLegStatus('sideB')}
        onClick={() => handleLegTap('sideB')}
        onHold={() => {/* TODO: Open size/length modal */}}
        active={!!legs.sideB && legs.sideB.gateOpen}
      />
      
      {/* HAV */}
      <ToggleTile
        title="HAV"
        sub={hav.enabled ? `${hav.mode} • ${hav.boostPsi}psi` : 'Disabled'}
        onClick={() => setHavEnabled(!hav.enabled)}
        onHold={() => {/* TODO: Open HAV mode/boost modal */}}
        active={hav.enabled}
      />
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