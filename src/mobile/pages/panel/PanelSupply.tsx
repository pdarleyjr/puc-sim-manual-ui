import { useStore } from '../../../state/store'

export default function PanelSupply() {
  const source = useStore(state => state.source)
  const setSource = useStore(state => state.setSource)
  const tankFillPct = useStore(state => state.tankFillPct)
  const setTankFillPct = useStore(state => state.setTankFillPct)
  const pumpEngaged = useStore(state => state.pumpEngaged)
  
  const handleToggleSource = (newSource: 'tank' | 'hydrant') => {
    setSource(newSource)
  }
  
  return (
    <div className="h-full p-3 overflow-hidden">
      <div className="grid grid-cols-2 gap-3 h-full content-start">
        {/* Tank to Pump */}
        <button
          onClick={() => handleToggleSource('tank')}
          disabled={!pumpEngaged}
          className={`
            p-4 rounded-xl border-2 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2
            ${source === 'tank' 
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-300' 
              : 'bg-[#1a2332] border-[#2a3340] text-slate-300'
            }
            ${!pumpEngaged ? 'opacity-50' : 'active:scale-95'}
          `}
          aria-pressed={source === 'tank'}
        >
          <span className="text-3xl">🚰</span>
          <div className="text-sm font-bold text-center">Tank to Pump</div>
          <div className="text-xs opacity-70">
            {source === 'tank' ? 'Active' : 'Off'}
          </div>
        </button>
        
        {/* Hydrant Supply */}
        <button
          onClick={() => handleToggleSource('hydrant')}
          disabled={!pumpEngaged}
          className={`
            p-4 rounded-xl border-2 transition-all min-h-[120px] flex flex-col items-center justify-center gap-2
            ${source === 'hydrant' 
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
              : 'bg-[#1a2332] border-[#2a3340] text-slate-300'
            }
            ${!pumpEngaged ? 'opacity-50' : 'active:scale-95'}
          `}
          aria-pressed={source === 'hydrant'}
        >
          <span className="text-3xl">🔥</span>
          <div className="text-sm font-bold text-center">Hydrant Supply</div>
          <div className="text-xs opacity-70">
            {source === 'hydrant' ? 'Active' : 'Off'}
          </div>
        </button>
        
        {/* Tank Fill / Recirculate */}
        <div className="col-span-2 p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold">Tank Fill / Recirc</div>
            <div className="text-xs text-teal-400 font-mono">{tankFillPct}%</div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={tankFillPct}
            onChange={(e) => setTankFillPct(Number(e.target.value))}
            disabled={source !== 'hydrant' || !pumpEngaged}
            className="w-full h-2 bg-[#0b1220] rounded-lg appearance-none cursor-pointer disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${tankFillPct}%, #0b1220 ${tankFillPct}%, #0b1220 100%)`
            }}
          />
          <div className="flex justify-between mt-2 text-[10px] opacity-60">
            <span>Off</span>
            <span>Max</span>
          </div>
        </div>
        
        {/* Supply Status */}
        <div className="col-span-2 p-4 rounded-xl bg-[#0b1220] border border-[#2a3340]">
          <div className="text-xs font-semibold mb-2 opacity-70">SUPPLY STATUS</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] opacity-60">Source</div>
              <div className="text-sm font-bold">
                {source === 'tank' ? 'Tank' : source === 'hydrant' ? 'Hydrant' : 'None'}
              </div>
            </div>
            <div>
              <div className="text-[10px] opacity-60">Fill</div>
              <div className="text-sm font-bold">{tankFillPct}%</div>
            </div>
            <div>
              <div className="text-[10px] opacity-60">Pump</div>
              <div className="text-sm font-bold">{pumpEngaged ? 'On' : 'Off'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}