import { useHydrantLab } from '../../features/hydrant-lab/store'
import type { PortId } from '../../features/hydrant-lab/store'
import { useState } from 'react'

export default function HydrantTiles() {
  const legs = useHydrantLab(state => state.legs)
  const hav = useHydrantLab(state => state.hav)
  const staticPsi = useHydrantLab(state => state.staticPsi)
  const attachLeg = useHydrantLab(state => state.attachLeg)
  const detachLeg = useHydrantLab(state => state.detachLeg)
  const toggleGate = useHydrantLab(state => state.toggleGate)
  const setHavEnabled = useHydrantLab(state => state.setHavEnabled)
  const setHavMode = useHydrantLab(state => state.setHavMode)
  const setHavBoost = useHydrantLab(state => state.setHavBoost)
  const setStatic = useHydrantLab(state => state.setStatic)
  
  const [showHavDetails, setShowHavDetails] = useState(false)
  
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
  
  const handleHavCycle = () => {
    if (!hav.enabled) {
      setHavEnabled(true)
      setHavMode('bypass')
    } else if (hav.mode === 'bypass') {
      setHavMode('boost')
    } else {
      setHavEnabled(false)
    }
  }
  
  const handleStaticPreset = (psi: number) => {
    setStatic(psi)
  }
  
  const handleSupplyPreset = (config: 'single' | 'double' | 'triple') => {
    // Clear all legs first
    if (legs.sideA) detachLeg('sideA')
    if (legs.sideB) detachLeg('sideB')
    if (legs.steamer) detachLeg('steamer')
    
    // Apply preset configuration
    switch (config) {
      case 'single':
        attachLeg('steamer', 5)
        break
      case 'double':
        attachLeg('steamer', 5)
        attachLeg('sideA', 3)
        break
      case 'triple':
        attachLeg('steamer', 5)
        attachLeg('sideA', 3)
        attachLeg('sideB', 3)
        break
    }
  }
  
  const openAllGates = () => {
    if (legs.sideA && !legs.sideA.gateOpen) toggleGate('sideA')
    if (legs.sideB && !legs.sideB.gateOpen) toggleGate('sideB')
  }
  
  const closeAllGates = () => {
    if (legs.sideA?.gateOpen) toggleGate('sideA')
    if (legs.sideB?.gateOpen) toggleGate('sideB')
  }
  
  return (
    <div className="flex flex-col gap-3 py-2">
      {/* HAV Control Section */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">HAV Control</div>
        <div className="grid grid-cols-2 gap-2">
          <ToggleTile
            title="HAV Mode"
            sub={!hav.enabled ? 'Off' : hav.mode === 'bypass' ? 'Bypass' : `Boost ${hav.boostPsi} PSI`}
            onClick={handleHavCycle}
            onHold={() => setShowHavDetails(!showHavDetails)}
            active={hav.enabled}
          />
          {hav.enabled && hav.mode === 'boost' && (
            <div className="col-span-2 bg-[#0f141a] border border-[#232b35] rounded-xl px-3 py-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-slate-400">Boost Pressure</span>
                <span className="text-[12px] font-bold text-sky-400">{hav.boostPsi} PSI</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={hav.boostPsi}
                onChange={(e) => setHavBoost(Number(e.target.value))}
                className="w-full h-2 bg-[#232b35] rounded-lg appearance-none cursor-pointer accent-sky-500"
                aria-label="HAV boost pressure"
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Gate Control Section */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">Supply Gates</div>
        <div className="grid grid-cols-2 gap-2">
          <ToggleTile
            title="Side A"
            sub={getLegStatus('sideA')}
            onClick={() => handleLegTap('sideA')}
            onHold={() => {/* TODO: Open size/length modal */}}
            active={!!legs.sideA && legs.sideA.gateOpen}
          />
          
          <ToggleTile
            title="Side B"
            sub={getLegStatus('sideB')}
            onClick={() => handleLegTap('sideB')}
            onHold={() => {/* TODO: Open size/length modal */}}
            active={!!legs.sideB && legs.sideB.gateOpen}
          />
          
          <ToggleTile
            title="Steamer"
            sub={getLegStatus('steamer')}
            onClick={() => handleLegTap('steamer')}
            onHold={() => {/* TODO: Open size/length modal */}}
            active={!!legs.steamer}
          />
          
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={openAllGates}
              className="h-[56px] rounded-xl bg-green-900/20 border border-green-700/50 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Open all gates"
            >
              <div className="text-[11px] font-medium text-green-400">Open All</div>
            </button>
            <button
              onClick={closeAllGates}
              className="h-[56px] rounded-xl bg-red-900/20 border border-red-700/50 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Close all gates"
            >
              <div className="text-[11px] font-medium text-red-400">Close All</div>
            </button>
          </div>
        </div>
      </div>
      
      {/* Static Pressure Presets */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">Hydrant Static Pressure</div>
        <div className="grid grid-cols-4 gap-2">
          {[40, 60, 80, 100].map(psi => (
            <button
              key={psi}
              onClick={() => handleStaticPreset(psi)}
              className={`h-[48px] rounded-xl px-2 active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors ${
                staticPsi === psi
                  ? 'bg-sky-900/30 border border-sky-700'
                  : 'bg-[#0f141a] border border-[#232b35]'
              }`}
              aria-label={`Set static pressure to ${psi} PSI`}
              aria-pressed={staticPsi === psi}
            >
              <div className={`text-[13px] font-bold ${staticPsi === psi ? 'text-sky-400' : 'text-slate-100'}`}>
                {psi}
              </div>
              <div className="text-[9px] text-slate-400">PSI</div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Supply Configuration Presets */}
      <div>
        <div className="text-[9px] text-slate-400 uppercase tracking-wide mb-1.5 px-1">Supply Config</div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleSupplyPreset('single')}
            className="h-[56px] rounded-xl px-2 bg-[#0f141a] border border-[#232b35] active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Single 5 inch steamer configuration"
          >
            <div className="text-[11px] font-medium text-slate-100">Single</div>
            <div className="text-[9px] text-slate-400">5" Only</div>
          </button>
          <button
            onClick={() => handleSupplyPreset('double')}
            className="h-[56px] rounded-xl px-2 bg-[#0f141a] border border-[#232b35] active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Double tap configuration"
          >
            <div className="text-[11px] font-medium text-slate-100">Double</div>
            <div className="text-[9px] text-slate-400">5" + 3"</div>
          </button>
          <button
            onClick={() => handleSupplyPreset('triple')}
            className="h-[56px] rounded-xl px-2 bg-[#0f141a] border border-[#232b35] active:scale-[.99] focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Triple tap configuration"
          >
            <div className="text-[11px] font-medium text-slate-100">Triple</div>
            <div className="text-[9px] text-slate-400">All Ports</div>
          </button>
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