import { useStore } from '../state/store'
import { selectHydrantResiduals, selectResidualBadges, selectHydrantAdvice } from '../state/selectors'
import type { TapMode, HydrantOutlet, HoseSizeSupply } from '../state/store'

export function HydrantSupplyCard() {
  const hydrant = useStore(state => state.hydrant)
  const source = useStore(state => state.source)
  const setHydrantTapMode = useStore(state => state.setHydrantTapMode)
  const setHydrantLeg = useStore(state => state.setHydrantLeg)
  const setHydrantGauge = useStore(state => state.setHydrantGauge)
  
  const hydrantResidual = useStore(s => selectHydrantResiduals(s).hydrantResidual)
  const hydrantBadge = useStore(s => selectResidualBadges(s).hydrantBadge)
  const suggestAddLDH = useStore(s => selectHydrantAdvice(s).suggestAddLDH)
  const suggestUpsizeTo5 = useStore(s => selectHydrantAdvice(s).suggestUpsizeTo5)
  
  // Only show when source is hydrant
  if (source !== 'hydrant') return null
  
  const handleTapModeChange = (mode: TapMode) => {
    setHydrantTapMode(mode)
  }
  
  const handleSizeChange = (outlet: HydrantOutlet, size: HoseSizeSupply) => {
    setHydrantLeg(outlet, { size })
  }
  
  const handleLengthChange = (outlet: HydrantOutlet, lengthFt: number) => {
    setHydrantLeg(outlet, { lengthFt: Math.max(0, lengthFt) })
  }
  
  const badgeColor = hydrantBadge === 'green' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                   : hydrantBadge === 'amber' ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                   : 'bg-red-500/20 text-red-400 border-red-500/50'
  
  return (
    <div className="puc-card relative">
      <span id="anchor-hydrant-card" className="absolute -right-2 top-4 h-0 w-0" aria-hidden="true" />
      
      <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide uppercase mb-3 text-center opacity-80 drop-shadow-md">
        HYDRANT SUPPLY
      </h3>
      
      {/* Tap Mode Selector */}
      <div className="mb-4">
        <label className="text-xs opacity-60 mb-2 block">Tap Configuration</label>
        <div className="flex gap-2">
          {(['single', 'double', 'triple'] as TapMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => handleTapModeChange(mode)}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all capitalize ${
                hydrant.tapMode === mode
                  ? 'bg-sky-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>
      
      {/* Steamer (always active) */}
      <div className="mb-3 p-3 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">Steamer (5″ Storz)</span>
          {hydrant.hoses.steamer.size === '3' && (
            <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">Higher FL</span>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <label className="text-xs opacity-60">Size</label>
            <div className="flex gap-1 mt-1">
              {(['5', '3'] as HoseSizeSupply[]).map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeChange('steamer', size)}
                  className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                    hydrant.hoses.steamer.size === size
                      ? 'bg-sky-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {size}″
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1">
            <label className="text-xs opacity-60">Length (ft)</label>
            <input
              type="number"
              min="0"
              step="50"
              value={hydrant.hoses.steamer.lengthFt}
              onChange={(e) => handleLengthChange('steamer', Number(e.target.value))}
              className="w-full mt-1 px-3 py-2 bg-white/10 rounded text-sm border border-white/20 focus:border-sky-500 focus:outline-none tabular-nums"
            />
          </div>
        </div>
      </div>
      
      {/* Side A (active in double/triple) */}
      {hydrant.tapMode !== 'single' && (
        <div className="mb-3 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Side A (2½″ port)</span>
            {hydrant.hoses.sideA.size === '3' && (
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">Higher FL</span>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs opacity-60">Size</label>
              <div className="flex gap-1 mt-1">
                {(['5', '3'] as HoseSizeSupply[]).map(size => (
                  <button
                    key={size}
                    onClick={() => handleSizeChange('sideA', size)}
                    className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                      hydrant.hoses.sideA.size === size
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {size}″
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <label className="text-xs opacity-60">Length (ft)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={hydrant.hoses.sideA.lengthFt}
                onChange={(e) => handleLengthChange('sideA', Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-white/10 rounded text-sm border border-white/20 focus:border-sky-500 focus:outline-none tabular-nums"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Side B (active in triple only) */}
      {hydrant.tapMode === 'triple' && (
        <div className="mb-3 p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Side B (2½″ port)</span>
            {hydrant.hoses.sideB.size === '3' && (
              <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">Higher FL</span>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <label className="text-xs opacity-60">Size</label>
              <div className="flex gap-1 mt-1">
                {(['5', '3'] as HoseSizeSupply[]).map(size => (
                  <button
                    key={size}
                    onClick={() => handleSizeChange('sideB', size)}
                    className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                      hydrant.hoses.sideB.size === size
                        ? 'bg-sky-500 text-white'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {size}″
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1">
              <label className="text-xs opacity-60">Length (ft)</label>
              <input
                type="number"
                min="0"
                step="50"
                value={hydrant.hoses.sideB.lengthFt}
                onChange={(e) => handleLengthChange('sideB', Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-white/10 rounded text-sm border border-white/20 focus:border-sky-500 focus:outline-none tabular-nums"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Hydrant Gauge Toggle & Display */}
      <div className="mt-4 p-3 bg-black/20 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Hydrant Gate w/ Gauge</label>
          <button
            onClick={() => setHydrantGauge(!hydrant.hydrantGaugeEnabled)}
            className={`px-3 py-1 rounded font-semibold text-xs transition-all ${
              hydrant.hydrantGaugeEnabled
                ? 'bg-emerald-500 text-white'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {hydrant.hydrantGaugeEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {hydrant.hydrantGaugeEnabled && (
          <div className={`mt-2 p-3 rounded border ${badgeColor}`}>
            <div className="text-xs opacity-60">Hydrant Main Residual</div>
            <div className="text-2xl font-bold tabular-nums">{Math.round(hydrantResidual)} PSI</div>
            <div className="text-xs mt-1 opacity-80">
              {hydrantBadge === 'green' && '✓ RES ≥20'}
              {hydrantBadge === 'amber' && '⚠ RES 10-19'}
              {hydrantBadge === 'red' && '✗ RES <10'}
            </div>
          </div>
        )}
      </div>
      
      {/* Advisor Chips */}
      {(suggestAddLDH || suggestUpsizeTo5) && (
        <div className="mt-4 space-y-2">
          {suggestAddLDH && (
            <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded text-xs text-sky-300">
              💡 Add side <strong>5″</strong> to raise intake
            </div>
          )}
          {suggestUpsizeTo5 && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-300">
              💡 Upsize 3″ leg(s) to <strong>5″</strong> for high flow
            </div>
          )}
        </div>
      )}
    </div>
  )
}