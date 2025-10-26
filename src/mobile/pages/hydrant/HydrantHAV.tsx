import { useHydrantLab } from '../../../features/hydrant-lab/store'

export default function HydrantHAV() {
  const hav = useHydrantLab(state => state.hav)
  const setHavEnabled = useHydrantLab(state => state.setHavEnabled)
  const setHavMode = useHydrantLab(state => state.setHavMode)
  const setHavOutlets = useHydrantLab(state => state.setHavOutlets)
  const setHavBoost = useHydrantLab(state => state.setHavBoost)
  
  return (
    <div className="h-full p-3 overflow-hidden">
      <div className="space-y-4">
        {/* HAV Enable/Disable */}
        <div className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
          <div className="text-xs font-semibold mb-3 opacity-70">HIGH-RISE APPLIANCE VALVE (HAV)</div>
          <button
            onClick={() => setHavEnabled(!hav.enabled)}
            className={`w-full py-3 rounded-lg font-bold text-lg transition-all ${
              hav.enabled
                ? 'bg-emerald-500/20 text-emerald-300 border-2 border-emerald-500/50'
                : 'bg-[#0b1220] text-slate-400 border-2 border-[#2a3340]'
            }`}
            aria-pressed={hav.enabled}
          >
            {hav.enabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>
        
        {/* HAV Controls (only when enabled) */}
        {hav.enabled && (
          <>
            {/* Mode Selection */}
            <div className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
              <div className="text-xs font-semibold mb-3 opacity-70">HAV MODE</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHavMode('bypass')}
                  className={hav.mode === 'bypass' ? 'btn-on py-3' : 'btn-off py-3'}
                  aria-pressed={hav.mode === 'bypass'}
                >
                  <div className="font-bold">Bypass</div>
                  <div className="text-[10px] opacity-70 mt-1">Direct Flow</div>
                </button>
                <button
                  onClick={() => setHavMode('boost')}
                  className={hav.mode === 'boost' ? 'btn-on py-3' : 'btn-off py-3'}
                  aria-pressed={hav.mode === 'boost'}
                >
                  <div className="font-bold">Boost</div>
                  <div className="text-[10px] opacity-70 mt-1">Add Pressure</div>
                </button>
              </div>
            </div>
            
            {/* Outlets Selection */}
            <div className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
              <div className="text-xs font-semibold mb-3 opacity-70">OUTLETS</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setHavOutlets(1)}
                  className={hav.outlets === 1 ? 'btn-on py-3' : 'btn-off py-3'}
                  aria-pressed={hav.outlets === 1}
                >
                  <div className="text-2xl mb-1">1</div>
                  <div className="text-[10px] opacity-70">Single Outlet</div>
                </button>
                <button
                  onClick={() => setHavOutlets(2)}
                  className={hav.outlets === 2 ? 'btn-on py-3' : 'btn-off py-3'}
                  aria-pressed={hav.outlets === 2}
                >
                  <div className="text-2xl mb-1">2</div>
                  <div className="text-[10px] opacity-70">Dual Outlets</div>
                </button>
              </div>
            </div>
            
            {/* Boost Pressure (only in boost mode) */}
            {hav.mode === 'boost' && (
              <div className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold opacity-70">BOOST PRESSURE</div>
                  <div className="text-lg font-mono text-teal-400">{hav.boostPsi} PSI</div>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={hav.boostPsi}
                  onChange={(e) => setHavBoost(Number(e.target.value))}
                  className="w-full h-3 bg-[#0b1220] rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${(hav.boostPsi / 50) * 100}%, #0b1220 ${(hav.boostPsi / 50) * 100}%, #0b1220 100%)`
                  }}
                />
                
                <div className="flex justify-between mt-2 text-[10px] opacity-60">
                  <span>0 PSI</span>
                  <span>50 PSI</span>
                </div>
                
                {/* Quick Presets */}
                <div className="grid grid-cols-5 gap-2 mt-3">
                  {[0, 10, 20, 30, 50].map(psi => (
                    <button
                      key={psi}
                      onClick={() => setHavBoost(psi)}
                      className="py-1.5 rounded-lg bg-[#0b1220] border border-[#2a3340] text-xs font-medium hover:bg-[#17202b]"
                    >
                      {psi}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Status Display */}
        <div className="p-4 rounded-xl bg-[#0b1220] border border-[#2a3340]">
          <div className="text-xs font-semibold mb-3 opacity-70">STATUS</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[10px] opacity-60 mb-1">Mode</div>
              <div className="text-sm font-bold capitalize">
                {hav.enabled ? hav.mode : 'Off'}
              </div>
            </div>
            <div>
              <div className="text-[10px] opacity-60 mb-1">Outlets</div>
              <div className="text-sm font-bold">
                {hav.enabled ? hav.outlets : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}