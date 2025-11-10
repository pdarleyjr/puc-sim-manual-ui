import { useState, useMemo } from 'react'
import { useStore } from '../../../state/store'
import type { DischargeId } from '../../../state/store'
import { TWO_FIVE_EVOS } from '../../../state/evolutions'
import { getEvo, computeEvolutionAtValve } from '../../../state/evoMath'
import { NozzlePill } from '../../../features/nozzle-profiles/components/NozzlePill'
import { NozzlePicker } from '../../../features/nozzle-profiles/components/NozzlePicker'
import type { NozzleCategory } from '../../../features/nozzle-profiles/types'
import { useDischargeCalc } from '../../../features/nozzle-profiles/hooks/useDischargeCalc'

// Map discharge IDs to nozzle categories
function getDischargeCategory(dischargeId: DischargeId): NozzleCategory {
  if (dischargeId.startsWith('xlay')) return 'crosslay';
  if (dischargeId === 'trashline') return 'trash';
  if (dischargeId.startsWith('twohalf')) return 'leader'; // 2½" typically for leader lines
  if (dischargeId === 'deckgun') return 'other';
  return 'other';
}

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
  const [showNozzlePicker, setShowNozzlePicker] = useState(false)
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
  
  // Compute nozzle-aware discharge calculations
  // Maps discharge IDs to hose configurations for nozzle calculations
  const nozzleCalc = useDischargeCalc({
    tabId: 'panel',
    category: getDischargeCategory(activeLineId),
    hoseLengthFt: activeLineId.startsWith('twohalf') ? (evo?.hose.lengthFt ?? 200) : 
                  activeLineId === 'trashline' ? 100 :
                  activeLineId === 'deckgun' ? 50 : 200,
    hoseDiameterIn: activeLineId.startsWith('twohalf') ? (evo?.hose.dia ?? 2.5) :
                    activeLineId === 'trashline' ? 1.5 :
                    activeLineId === 'deckgun' ? 5 : 1.75,
    elevationGainFt: 0,
    applianceLossPsi: 0
  })
  
  // Determine display values with precedence: nozzle calc → evolution stats → line state
  const displayGpm = nozzleCalc?.gpm ?? evoStats?.flow ?? activeLine.gpmNow
  const displayPdp = nozzleCalc?.pdp ?? evoStats?.actualPdp ?? activeLine.displayPsi
  const displayNp = nozzleCalc?.np ?? evoStats?.np ?? 0
  
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
        {/* Header with Status Display */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h3 className="text-lg font-bold mb-1">{activeLine.label}</h3>
              <NozzlePill
                tabId="panel"
                category={getDischargeCategory(activeLineId)}
                onClick={() => setShowNozzlePicker(true)}
              />
            </div>
            <div className="text-4xl font-mono text-white font-bold">
              {activeLine.valvePercent}%
            </div>
          </div>
          <div>
            {activeLine.open ? (
              <div className="text-green-400 font-semibold text-lg">
                ● FLOWING {Math.round(activeLine.gpmNow)} GPM
              </div>
            ) : (
              <div className="text-gray-500 text-sm">○ Closed</div>
            )}
          </div>
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
        
        {/* Large Touch-Friendly Lever */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>CLOSED</span>
            <span>Valve Position</span>
            <span>OPEN</span>
          </div>
          
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={activeLine.valvePercent}
            onChange={(e) => handleValveChange(Number(e.target.value))}
            className="w-full h-6 bg-[#0b1220] rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${activeLine.valvePercent}%, #0b1220 ${activeLine.valvePercent}%, #0b1220 100%)`,
              WebkitAppearance: 'none',
            }}
          />
        </div>
        
        {/* Quick-set buttons - Larger for mobile */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          <button
            onClick={() => handleValveChange(0)}
            className="py-3 text-sm bg-red-900/30 border-2 border-red-700 text-red-300 rounded-lg font-semibold active:bg-red-900/60"
          >
            OFF
          </button>
          {[25, 50, 75, 100].map(pct => (
            <button
              key={pct}
              onClick={() => handleValveChange(pct)}
              className={`py-3 text-sm border-2 rounded-lg font-semibold active:scale-95 transition ${
                activeLine.valvePercent === pct
                  ? 'bg-blue-900/50 border-blue-600 text-blue-300'
                  : 'bg-gray-700 border-gray-600 text-gray-300'
              }`}
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
              {Math.round(displayPdp)}
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
              {Math.round(displayGpm)}
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
                <div className="font-mono">{Math.round(displayNp)} psi</div>
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
        
        {/* Nozzle Calculation Details - Show when nozzle calc is active */}
        {nozzleCalc && !evoStats && (
          <div className="mt-3 p-3 bg-[#0b1220]/50 rounded-lg text-xs">
            <div className="grid grid-cols-3 gap-2 opacity-80">
              <div>
                <div className="opacity-60">Friction</div>
                <div className="font-mono">{Math.round(nozzleCalc.fl)} psi</div>
              </div>
              <div>
                <div className="opacity-60">Nozzle NP</div>
                <div className="font-mono">{Math.round(nozzleCalc.np)} psi</div>
              </div>
              <div>
                <div className="opacity-60">Elevation</div>
                <div className="font-mono">{Math.round(nozzleCalc.elevation)} psi</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Nozzle Picker Modal */}
      {showNozzlePicker && (
        <NozzlePicker
          tabId="panel"
          category={getDischargeCategory(activeLineId)}
          onClose={() => setShowNozzlePicker(false)}
        />
      )}
    </div>
  )
}