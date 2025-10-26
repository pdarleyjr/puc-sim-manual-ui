import { useState, useMemo } from 'react'
import { useStore } from '../../../state/store'
import type { DischargeId } from '../../../state/store'
import { TWO_FIVE_EVOS } from '../../../state/evolutions'
import { getEvo, computeEvolutionAtValve } from '../../../state/evoMath'

export default function PanelDischarges() {
  const discharges = useStore(state => state.discharges)
  const setLine = useStore(state => state.setLine)
  const setLineEvolution = useStore(state => state.setLineEvolution)
  const governor = useStore(state => state.governor)
  
  // Available discharge lines - now includes 2½" lines
  const lines: { id: DischargeId; label: string }[] = [
    { id: 'xlay1', label: 'Xlay 1' },
    { id: 'xlay2', label: 'Xlay 2' },
    { id: 'xlay3', label: 'Xlay 3' },
    { id: 'trashline', label: 'Trash' },
    { id: 'deckgun', label: 'Deck' },
    { id: 'twohalfA', label: '2½ A' },
    { id: 'twohalfB', label: '2½ B' },
    { id: 'twohalfC', label: '2½ C' },
  ]
  
  const [activeLineId, setActiveLineId] = useState<DischargeId>('xlay1')
  const activeLine = discharges[activeLineId]
  
  // Get evolution for current line
  const evo = useMemo(
    () => getEvo(activeLine.evolutionId),
    [activeLine.evolutionId]
  )
  
  // Compute evolution stats for 2½" lines
  const evoStats = useMemo(() => {
    if (!evo || !activeLineId.startsWith('twohalf')) return null
    
    const governorPsi = governor.mode === 'pressure' ? governor.setPsi : 150
    return computeEvolutionAtValve(evo, activeLine.valvePercent, governorPsi)
  }, [evo, activeLine.valvePercent, governor.mode, governor.setPsi, activeLineId])
  
  const handleToggleOpen = () => {
    setLine(activeLineId, { open: !activeLine.open })
  }
  
  const handleValveChange = (percent: number) => {
    setLine(activeLineId, { valvePercent: percent })
  }
  
  // Check if current line is 2½" or deck/monitor (evolution-capable)
  const isEvolutionCapable = activeLineId.startsWith('twohalf') || activeLineId === 'deckgun'
  
  // Filter evolutions based on line type
  const availableEvos = useMemo(() => {
    if (activeLineId === 'deckgun') {
      return TWO_FIVE_EVOS.filter(e => e.id.includes('monitor') || e.id.includes('cannon'))
    }
    if (activeLineId.startsWith('twohalf')) {
      return TWO_FIVE_EVOS.filter(e => 
        e.hose.dia === 2.5 || e.hose.dia === 3 || e.id.includes('monitor')
      )
    }
    return []
  }, [activeLineId])
  
  return (
    <div className="h-full p-3 overflow-hidden flex flex-col gap-3">
      {/* Segmented Control - Extended Grid */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-[#0b1220] rounded-lg overflow-x-auto">
        {lines.map(line => (
          <button
            key={line.id}
            onClick={() => setActiveLineId(line.id)}
            className={`
              py-2 px-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap
              ${activeLineId === line.id
                ? 'bg-[#17202b] text-teal-400'
                : 'bg-transparent text-slate-400'
              }
            `}
            aria-pressed={activeLineId === line.id}
          >
            {line.label}
          </button>
        ))}
      </div>
      
      {/* Active Line Card */}
      <div className="flex-1 rounded-xl bg-[#1a2332] border-2 border-[#2a3340] p-4 flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{activeLine.label}</h3>
          <button
            onClick={handleToggleOpen}
            className={`
              px-4 py-2 rounded-lg font-bold text-sm transition-all
              ${activeLine.open
                ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50'
                : 'bg-[#0b1220] text-slate-400 border-2 border-[#2a3340]'
              }
            `}
            aria-pressed={activeLine.open}
          >
            {activeLine.open ? 'OPEN' : 'CLOSED'}
          </button>
        </div>
        
        {/* Evolution Picker - Only for 2½" and deck lines */}
        {isEvolutionCapable && availableEvos.length > 0 && (
          <div className="mb-4">
            <div className="text-xs opacity-70 mb-2">Evolution</div>
            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto">
              {availableEvos.map(evolution => (
                <button
                  key={evolution.id}
                  onClick={() => setLineEvolution(activeLineId, evolution.id)}
                  className={`
                    py-2 px-2 text-xs rounded-lg transition-colors text-left
                    ${activeLine.evolutionId === evolution.id
                      ? 'bg-teal-500/20 text-teal-300 border-2 border-teal-500/50'
                      : 'bg-[#0b1220] text-slate-300 border border-[#2a3340] hover:bg-[#17202b]'
                    }
                  `}
                >
                  {evolution.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Valve Control */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Valve Position</div>
            <div className="text-lg font-mono text-teal-400">{activeLine.valvePercent}%</div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={activeLine.valvePercent}
            onChange={(e) => handleValveChange(Number(e.target.value))}
            disabled={!activeLine.open}
            className="w-full h-3 bg-[#0b1220] rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${activeLine.valvePercent}%, #0b1220 ${activeLine.valvePercent}%, #0b1220 100%)`
            }}
          />
          <div className="flex justify-between mt-1 text-[10px] opacity-60">
            <span>Closed</span>
            <span>Full Open</span>
          </div>
        </div>
        
        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              onClick={() => handleValveChange(pct)}
              disabled={!activeLine.open}
              className="py-2 rounded-lg bg-[#0b1220] border border-[#2a3340] text-xs font-medium hover:bg-[#17202b] active:bg-[#232b35] disabled:opacity-50"
            >
              {pct}%
            </button>
          ))}
        </div>
        
        {/* Stats - Use evolution stats if available */}
        <div className="mt-auto grid grid-cols-2 gap-3 p-3 bg-[#0b1220] rounded-lg">
          <div>
            <div className="text-[10px] opacity-60 mb-1">Pressure (PDP)</div>
            <div className="text-xl font-bold font-mono">
              {Math.round(evoStats?.actualPdp ?? activeLine.displayPsi)}
              <span className="text-xs ml-1 opacity-70">PSI</span>
            </div>
            {evoStats && evoStats.requiredPdp > evoStats.actualPdp && (
              <div className="text-[9px] text-amber-400 mt-1">
                Req: {Math.round(evoStats.requiredPdp)} PSI
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] opacity-60 mb-1">Flow</div>
            <div className="text-xl font-bold font-mono">
              {Math.round(evoStats?.flow ?? activeLine.gpmNow)}
              <span className="text-xs ml-1 opacity-70">GPM</span>
            </div>
          </div>
        </div>
        
        {/* Evolution Details - Show for 2½" lines with evolution selected */}
        {evoStats && evo && (
          <div className="mt-3 p-3 bg-[#0b1220]/50 rounded-lg text-xs">
            <div className="grid grid-cols-3 gap-2 opacity-80">
              <div>
                <div className="opacity-60">Hose FL</div>
                <div className="font-mono">{Math.round(evoStats.fl)} psi</div>
              </div>
              <div>
                <div className="opacity-60">Nozzle NP</div>
                <div className="font-mono">{Math.round(evoStats.np)} psi</div>
              </div>
              <div>
                <div className="opacity-60">Appliance</div>
                <div className="font-mono">{Math.round(evoStats.appl)} psi</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] opacity-60">
              {evo.hose.dia}″ × {evo.hose.lengthFt}ft
            </div>
          </div>
        )}
      </div>
    </div>
  )
}