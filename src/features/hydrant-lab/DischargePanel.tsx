import { useHydrantLab, NOZZLE_LIBRARY, type NozzleType, type DischargeLine } from './store'

export function DischargePanel() {
  const s = useHydrantLab()
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold opacity-70 uppercase tracking-wide">Discharge Lines</h3>
        <div className="text-xs opacity-60">
          Flow: <span className="font-bold text-emerald-300">{s.totalDischargeFlowGpm}</span> / 
          <span className="font-bold text-amber-300"> {s.totalDischargeDemandGpm}</span> GPM
        </div>
      </div>
      
      {/* PDP Control */}
      <div className="border border-white/10 rounded-lg p-3">
        <label className="text-xs opacity-60 mb-2 block">Pump Discharge Pressure (PDP)</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={s.pumpDischargePressurePsi}
            onChange={(e) => s.setPDP(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-bold tabular-nums w-12">{s.pumpDischargePressurePsi}</span>
          <span className="text-xs opacity-60">PSI</span>
        </div>
      </div>
      
      {/* Status Indicators */}
      {(s.pumpCavitating || s.governorLimited) && (
        <div className="space-y-2">
          {s.pumpCavitating && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 text-xs">
              <div className="font-bold text-red-300 mb-1">⚠️ CAVITATION RISK</div>
              <div className="text-red-200/80">
                Intake pressure too low. Reduce discharge demand or increase supply.
              </div>
            </div>
          )}
          {s.governorLimited && (
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-lg px-3 py-2 text-xs">
              <div className="font-bold text-amber-300 mb-1">⚠️ GOVERNOR LIMITED</div>
              <div className="text-amber-200/80">
                Engine RPM governor preventing additional flow. Increase governor setpoint or reduce PDP.
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Add Discharge Line Button */}
      <AddDischargeButton />
      
      {/* Discharge Lines List */}
      <div className="space-y-2">
        {s.dischargeLines.length === 0 ? (
          <div className="text-center py-8 text-sm opacity-40">
            No discharge lines configured.
            <br />
            Click "Add Discharge Line" to begin.
          </div>
        ) : (
          s.dischargeLines.map(line => (
            <DischargeLineCard key={line.id} line={line} />
          ))
        )}
      </div>
    </div>
  )
}

function AddDischargeButton() {
  const s = useHydrantLab()
  
  return (
    <div className="border border-white/10 rounded-lg p-3">
      <div className="text-xs font-semibold opacity-70 mb-2">Add Discharge Line</div>
      <div className="grid grid-cols-3 gap-2">
        {/* Quick presets */}
        <button
          onClick={() => s.addDischargeLine('fog-1.75-100', 1.75, 200)}
          className="px-3 py-2 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs"
        >
          1.75" Fog
          <div className="text-[10px] opacity-60">200ft</div>
        </button>
        <button
          onClick={() => s.addDischargeLine('smooth-bore-2.5', 2.5, 200)}
          className="px-3 py-2 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs"
        >
          2.5" SB
          <div className="text-[10px] opacity-60">200ft</div>
        </button>
        <button
          onClick={() => s.addDischargeLine('deck-gun', 5, 50)}
          className="px-3 py-2 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs"
        >
          Deck Gun
          <div className="text-[10px] opacity-60">50ft</div>
        </button>
        <button
          onClick={() => s.addDischargeLine('blitz-monitor', 3, 100)}
          className="px-3 py-2 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs"
        >
          Blitz
          <div className="text-[10px] opacity-60">100ft</div>
        </button>
        <button
          onClick={() => s.addDischargeLine('smooth-bore-monitor', 5, 50)}
          className="px-3 py-2 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors text-xs"
        >
          Monitor
          <div className="text-[10px] opacity-60">50ft</div>
        </button>
        <button
          onClick={() => s.addDischargeLine('water-cannon', 5, 20)}
          className="px-3 py-2 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors text-xs"
        >
          🚀 Cannon
          <div className="text-[10px] opacity-60">Max Flow</div>
        </button>
      </div>
    </div>
  )
}

function DischargeLineCard({ line }: { line: DischargeLine }) {
  const s = useHydrantLab()
  const nozzle = NOZZLE_LIBRARY[line.nozzleType]
  
  const flowRatio = line.requiredGpm > 0 ? (line.calculatedGpm / line.requiredGpm) * 100 : 100
  const flowColor = flowRatio >= 95 ? 'text-emerald-300' : flowRatio >= 80 ? 'text-amber-300' : 'text-red-300'
  
  return (
    <div className="border border-white/10 rounded-lg p-3">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="text-sm font-semibold">{nozzle.name}</div>
          <div className="text-xs opacity-60">{nozzle.description}</div>
        </div>
        <button
          onClick={() => s.removeDischargeLine(line.id)}
          className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
        >
          Remove
        </button>
      </div>
      
      {/* Hose Configuration */}
      <div className="space-y-2 mb-3">
        <div>
          <label className="text-xs opacity-60 mb-1 block">Hose Size</label>
          <div className="flex gap-2">
            {[1.75, 2.5, 3, 5].map(size => (
              <button
                key={size}
                onClick={() => s.updateDischargeLine(line.id, l => { l.hoseDiameterIn = size as any })}
                className={`flex-1 py-1 rounded text-xs ${
                  line.hoseDiameterIn === size 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-white/5'
                }`}
              >
                {size}"
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-xs opacity-60 mb-1 block">Length: {line.hoseLengthFt} ft</label>
          <input
            type="range"
            min="50"
            max="400"
            step="50"
            value={line.hoseLengthFt}
            onChange={(e) => s.updateDischargeLine(line.id, l => { l.hoseLengthFt = parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="text-xs opacity-60 mb-1 block">Nozzle Type</label>
          <select
            value={line.nozzleType}
            onChange={(e) => s.updateDischargeLine(line.id, l => { l.nozzleType = e.target.value as NozzleType })}
            className="w-full px-2 py-1 rounded bg-white/5 text-xs"
          >
            {Object.values(NOZZLE_LIBRARY).map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Gate Control */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
        <span className="text-xs opacity-60">Discharge Gate</span>
        <button
          onClick={() => s.toggleDischargeGate(line.id)}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
            line.gateOpen 
              ? 'bg-emerald-500/20 text-emerald-300' 
              : 'bg-red-500/20 text-red-300'
          }`}
        >
          {line.gateOpen ? 'OPEN' : 'CLOSED'}
        </button>
      </div>
      
      {/* Flow Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs opacity-60">Required</div>
          <div className="text-sm font-bold tabular-nums">{Math.round(line.requiredGpm)}</div>
          <div className="text-[10px] opacity-60">GPM</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Actual</div>
          <div className={`text-sm font-bold tabular-nums ${flowColor}`}>{Math.round(line.calculatedGpm)}</div>
          <div className="text-[10px] opacity-60">GPM</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Friction</div>
          <div className="text-sm font-bold tabular-nums">{Math.round(line.frictionLossPsi)}</div>
          <div className="text-[10px] opacity-60">PSI</div>
        </div>
      </div>
      
      {/* Flow ratio indicator */}
      {line.gateOpen && flowRatio < 95 && (
        <div className="mt-2 text-xs opacity-70 bg-amber-500/10 px-2 py-1 rounded">
          ⚠️ {Math.round(flowRatio)}% of required flow (supply limited)
        </div>
      )}
    </div>
  )
}