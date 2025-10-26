import { useState } from 'react'
import { useStore } from '../../../state/store'
import type { DischargeId } from '../../../state/store'

export default function PanelDischarges() {
  const discharges = useStore(state => state.discharges)
  const setLine = useStore(state => state.setLine)
  
  // Available discharge lines
  const lines: { id: DischargeId; label: string }[] = [
    { id: 'xlay1', label: 'Xlay 1' },
    { id: 'xlay2', label: 'Xlay 2' },
    { id: 'xlay3', label: 'Xlay 3' },
    { id: 'trashline', label: 'Trash' },
    { id: 'deckgun', label: 'Deck' }
  ]
  
  const [activeLineId, setActiveLineId] = useState<DischargeId>('xlay1')
  const activeLine = discharges[activeLineId]
  
  const handleToggleOpen = () => {
    setLine(activeLineId, { open: !activeLine.open })
  }
  
  const handleValveChange = (percent: number) => {
    setLine(activeLineId, { valvePercent: percent })
  }
  
  return (
    <div className="h-full p-3 overflow-hidden flex flex-col gap-3">
      {/* Segmented Control */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-[#0b1220] rounded-lg">
        {lines.map(line => (
          <button
            key={line.id}
            onClick={() => setActiveLineId(line.id)}
            className={`
              py-2 rounded-md text-xs font-medium transition-colors
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
      <div className="flex-1 rounded-xl bg-[#1a2332] border-2 border-[#2a3340] p-4 flex flex-col">
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
        
        {/* Stats */}
        <div className="mt-auto grid grid-cols-2 gap-3 p-3 bg-[#0b1220] rounded-lg">
          <div>
            <div className="text-[10px] opacity-60 mb-1">Pressure (PDP)</div>
            <div className="text-xl font-bold font-mono">
              {Math.round(activeLine.displayPsi)}
              <span className="text-xs ml-1 opacity-70">PSI</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-60 mb-1">Flow</div>
            <div className="text-xl font-bold font-mono">
              {Math.round(activeLine.gpmNow)}
              <span className="text-xs ml-1 opacity-70">GPM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}