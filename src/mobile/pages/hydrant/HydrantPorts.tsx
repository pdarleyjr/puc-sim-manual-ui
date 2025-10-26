import { useHydrantLab } from '../../../features/hydrant-lab/store'
import type { PortId } from '../../../features/hydrant-lab/store'

export default function HydrantPorts() {
  const legs = useHydrantLab(state => state.legs)
  const attachLeg = useHydrantLab(state => state.attachLeg)
  const detachLeg = useHydrantLab(state => state.detachLeg)
  const toggleGate = useHydrantLab(state => state.toggleGate)
  const setLeg = useHydrantLab(state => state.setLeg)
  
  const ports: { id: PortId; label: string; emoji: string }[] = [
    { id: 'sideA', label: 'Side A', emoji: '🔵' },
    { id: 'steamer', label: 'Steamer', emoji: '🔴' },
    { id: 'sideB', label: 'Side B', emoji: '🟢' }
  ]
  
  return (
    <div className="h-full p-3 overflow-auto">
      <div className="space-y-3">
        {ports.map(port => {
          const leg = legs[port.id]
          const hasGate = port.id !== 'steamer'
          
          return (
            <div key={port.id} className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{port.emoji}</span>
                  <h3 className="text-lg font-bold">{port.label}</h3>
                </div>
                {!leg ? (
                  <button
                    onClick={() => attachLeg(port.id, 5)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-sm font-medium"
                  >
                    Attach 5"
                  </button>
                ) : (
                  <button
                    onClick={() => detachLeg(port.id)}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-sm font-medium"
                  >
                    Detach
                  </button>
                )}
              </div>
              
              {leg && (
                <div className="space-y-3">
                  {/* Size Selection */}
                  <div>
                    <div className="text-xs font-semibold mb-2 opacity-70">Hose Size</div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setLeg(port.id, l => { l.sizeIn = 3 })}
                        className={leg.sizeIn === 3 ? 'btn-on' : 'btn-off'}
                        aria-pressed={leg.sizeIn === 3}
                      >
                        3"
                      </button>
                      <button
                        onClick={() => setLeg(port.id, l => { l.sizeIn = 5 })}
                        className={leg.sizeIn === 5 ? 'btn-on' : 'btn-off'}
                        aria-pressed={leg.sizeIn === 5}
                      >
                        5"
                      </button>
                    </div>
                  </div>
                  
                  {/* Length */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold opacity-70">Length</div>
                      <div className="text-sm font-mono text-teal-400">{leg.lengthFt} ft</div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[50, 100, 150, 200].map(len => (
                        <button
                          key={len}
                          onClick={() => setLeg(port.id, l => { l.lengthFt = len })}
                          className={`py-1.5 rounded-lg text-xs font-medium ${
                            leg.lengthFt === len
                              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                              : 'bg-[#0b1220] border border-[#2a3340] text-slate-400'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Gate (for side ports only) */}
                  {hasGate && 'gateOpen' in leg && (
                    <div>
                      <div className="text-xs font-semibold mb-2 opacity-70">Gate Valve</div>
                      <button
                        onClick={() => toggleGate(port.id as 'sideA' | 'sideB')}
                        className={`w-full py-2 rounded-lg font-medium ${
                          leg.gateOpen
                            ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50'
                            : 'bg-[#0b1220] text-slate-400 border-2 border-[#2a3340]'
                        }`}
                        aria-pressed={leg.gateOpen}
                      >
                        {leg.gateOpen ? 'OPEN' : 'CLOSED'}
                      </button>
                    </div>
                  )}
                  
                  {/* Flow Display */}
                  <div className="p-3 bg-[#0b1220] rounded-lg">
                    <div className="text-[10px] opacity-60 mb-1">Current Flow</div>
                    <div className="text-xl font-bold font-mono">
                      {Math.round(leg.gpm)}
                      <span className="text-xs ml-1 opacity-70">GPM</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}