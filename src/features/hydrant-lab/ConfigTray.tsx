import { useState } from 'react'
import { useHydrantLab, type PortId } from './store'
import { EquipmentSelector } from './components/EquipmentSelector'

export function ConfigTray() {
  const s = useHydrantLab()
  const [showSelector, setShowSelector] = useState(false)
  
  const handleAddEquipment = (config: any) => {
    s.addFlexibleDischarge(config)
    setShowSelector(false)
  }
  
  const renderLegConfig = (portId: PortId, label: string) => {
    const leg = s.legs[portId]
    const isConnected = leg !== null
    const isGated = portId !== 'steamer'
    
    return (
      <div className="border border-white/10 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold opacity-70">{label}</h4>
          {isConnected && leg ? (
            <button
              onClick={() => s.detachLeg(portId)}
              className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => s.attachLeg(portId, 3)}
                className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                3″
              </button>
              <button
                onClick={() => s.attachLeg(portId, 5)}
                className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                5″
              </button>
            </div>
          )}
        </div>
        
        {isConnected && leg && (
          <div className="space-y-3">
            {/* Size display */}
            <div className="flex gap-2">
              <div className={`flex-1 text-center py-2 rounded ${leg.sizeIn === 3 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5'}`}>
                3″
              </div>
              <div className={`flex-1 text-center py-2 rounded ${leg.sizeIn === 5 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5'}`}>
                5″
              </div>
            </div>
            
            {/* Length slider */}
            <div>
              <label className="text-xs opacity-60 mb-1 block">Length: {leg.lengthFt} ft</label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={leg.lengthFt}
                onChange={(e) => s.setLeg(portId, (l) => { l.lengthFt = parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
            
            {/* Gate toggle (sides only) */}
            {isGated && 'gateOpen' in leg && (
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-60">Gate Valve</span>
                <button
                  onClick={() => s.toggleGate(portId as 'sideA' | 'sideB')}
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    leg.gateOpen 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-red-500/20 text-red-300'
                  }`}
                >
                  {leg.gateOpen ? 'OPEN' : 'CLOSED'}
                </button>
              </div>
            )}
            
            {/* Adapter indicator */}
            {leg.adapterPsi && leg.adapterPsi > 0 && (
              <div className="text-xs opacity-60 bg-amber-500/10 px-2 py-1 rounded">
                2.5″→Storz adapter (+{leg.adapterPsi} psi)
              </div>
            )}
            
            {/* Flow display */}
            <div className="text-center pt-2 border-t border-white/10">
              <div className="text-lg font-bold tabular-nums">{Math.round(leg.gpm)}</div>
              <div className="text-xs opacity-60">GPM</div>
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold opacity-70 uppercase tracking-wide">Configuration</h3>
      
      {/* Flexible Discharge Mode Toggle */}
      <div className="border border-white/10 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold opacity-70">Equipment Mode</h4>
          <button
            onClick={() => s.setFlexibleMode(!s.useFlexibleMode)}
            className={`text-xs px-3 py-1 rounded font-semibold transition-colors ${
              s.useFlexibleMode 
                ? 'bg-blue-500/20 text-blue-300' 
                : 'bg-white/10 text-white/60'
            }`}
          >
            {s.useFlexibleMode ? 'FLEXIBLE' : 'LEGACY'}
          </button>
        </div>
        <p className="text-xs opacity-60">
          {s.useFlexibleMode 
            ? 'Custom equipment combinations enabled' 
            : 'Using preset equipment configurations'}
        </p>
      </div>
      
      {/* Flexible Discharge Configuration */}
      {s.useFlexibleMode && (
        <div className="border border-white/10 rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold opacity-70">Discharge Lines</h4>
            <button
              onClick={() => setShowSelector(true)}
              className="text-xs px-3 py-2 rounded bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors font-semibold"
              style={{ minHeight: '32px' }}
            >
              + Add Equipment
            </button>
          </div>
          
          {/* List of configured flexible discharges */}
          {s.flexibleDischarges.length === 0 ? (
            <p className="text-xs opacity-60 text-center py-4">
              No discharge lines configured. Click "Add Equipment" to start.
            </p>
          ) : (
            <div className="space-y-2">
              {s.flexibleDischarges.map(line => (
                <div key={line.id} className="bg-white/5 rounded p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold">
                        {line.hose.diameter}" × {line.hose.lengthFt}'
                      </div>
                      <div className="text-xs opacity-60">
                        {line.nozzle ? (
                          <>
                            {line.nozzle.kind.replace(/_/g, ' ').toUpperCase()}
                            {line.nozzle.tipDiameterIn && ` (${line.nozzle.tipDiameterIn}")`}
                            {line.nozzle.ratedGPM && ` @ ${line.nozzle.ratedGPM} GPM`}
                          </>
                        ) : 'Supply Line'}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => s.toggleFlexibleDischargeGate(line.id)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${
                          line.isOpen 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {line.isOpen ? 'OPEN' : 'CLOSED'}
                      </button>
                      <button
                        onClick={() => s.removeFlexibleDischarge(line.id)}
                        className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  {/* Flow display */}
                  {line.isOpen && (
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="text-xs opacity-60">Flow:</div>
                      <div className="text-sm font-bold tabular-nums">{Math.round(line.flowGPM)} GPM</div>
                    </div>
                  )}
                  
                  {/* Warnings */}
                  {line.warnings && line.warnings.length > 0 && (
                    <div className="text-xs text-yellow-300 bg-yellow-500/10 px-2 py-1 rounded">
                      ⚠️ {line.warnings[0]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Governor control */}
      <div className="border border-white/10 rounded-lg p-3">
        <label className="text-xs opacity-60 mb-2 block">Governor Setpoint</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="50"
            max="300"
            step="10"
            value={s.governorPsi}
            onChange={(e) => s.setGovernor(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-bold tabular-nums w-12">{s.governorPsi}</span>
          <span className="text-xs opacity-60">PSI</span>
        </div>
      </div>
      
      {/* Static pressure control */}
      <div className="border border-white/10 rounded-lg p-3">
        <label className="text-xs opacity-60 mb-2 block">Hydrant Static Pressure</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="20"
            max="200"
            step="5"
            value={s.staticPsi}
            onChange={(e) => s.setStatic(parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm font-bold tabular-nums w-12">{s.staticPsi}</span>
          <span className="text-xs opacity-60">PSI</span>
        </div>
      </div>
      
      {/* Leg configurations */}
      {renderLegConfig('steamer', 'Steamer (5″)')}
      {renderLegConfig('sideA', 'Side A (2.5″)')}
      {renderLegConfig('sideB', 'Side B (2.5″)')}
      
      {/* HAV Controls */}
      <div className="border border-white/10 rounded-lg p-3">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold opacity-70">HAV (Hydrant Assist Valve)</h4>
          <button
            onClick={() => s.setHavEnabled(!s.hav.enabled)}
            className={`text-xs px-3 py-1 rounded font-semibold transition-colors ${
              s.hav.enabled 
                ? 'bg-emerald-500/20 text-emerald-300' 
                : 'bg-white/10 text-white/60'
            }`}
          >
            {s.hav.enabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
        
        {s.hav.enabled && (
          <div className="space-y-3">
            {/* Mode selection */}
            <div className="flex gap-2">
              <button
                onClick={() => s.setHavMode('bypass')}
                className={`flex-1 py-2 rounded text-xs font-semibold transition-colors ${
                  s.hav.mode === 'bypass' 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-white/5'
                }`}
              >
                BYPASS
              </button>
              <button
                onClick={() => s.setHavMode('boost')}
                className={`flex-1 py-2 rounded text-xs font-semibold transition-colors ${
                  s.hav.mode === 'boost' 
                    ? 'bg-emerald-500/20 text-emerald-300' 
                    : 'bg-white/5'
                }`}
              >
                BOOST
              </button>
            </div>
            
            {/* Outlets */}
            <div>
              <label className="text-xs opacity-60 mb-2 block">Outlets</label>
              <div className="flex gap-2">
                <button
                  onClick={() => s.setHavOutlets(1)}
                  className={`flex-1 py-2 rounded text-xs font-semibold transition-colors ${
                    s.hav.outlets === 1 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-white/5'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => s.setHavOutlets(2)}
                  className={`flex-1 py-2 rounded text-xs font-semibold transition-colors ${
                    s.hav.outlets === 2 
                      ? 'bg-emerald-500/20 text-emerald-300' 
                      : 'bg-white/5'
                  }`}
                >
                  2
                </button>
              </div>
            </div>
            
            {/* Boost pressure (only in boost mode) */}
            {s.hav.mode === 'boost' && (
              <div>
                <label className="text-xs opacity-60 mb-2 block">Boost Pressure: {s.hav.boostPsi} psi</label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={s.hav.boostPsi}
                  onChange={(e) => s.setHavBoost(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Equipment Selector Modal */}
      {showSelector && (
        <EquipmentSelector
          onAdd={handleAddEquipment}
          onCancel={() => setShowSelector(false)}
        />
      )}
    </div>
  )
}