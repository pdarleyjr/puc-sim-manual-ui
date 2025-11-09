import { useStore } from '../../../state/store'
import { computeLineFrictionLoss } from '../../../engine/calcEngineV2'
import { getEffectiveFLValue } from '../../../state/store'

export default function PanelData() {
  const totals = useStore(state => state.totals)
  const gauges = useStore(state => state.gauges)
  const foamEnabled = useStore(state => state.foamEnabled)
  const warnings = useStore(state => state.warnings)
  const discharges = useStore(state => state.discharges)
  
  return (
    <div className="h-full p-3 overflow-y-auto">
      <div className="space-y-3">
        {/* Top Grid - Flow Totals and Other Stats */}
        <div className="grid grid-cols-2 gap-3">
          {/* Flow Totals */}
          <div className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
            <div className="text-xs font-semibold mb-3 opacity-70">FLOW TOTALS</div>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] opacity-60">Current Flow</div>
                <div className="text-2xl font-bold font-mono">
                  {Math.round(totals.gpmTotalNow)}
                  <span className="text-xs ml-1 opacity-70">GPM</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] opacity-60">Total Pumped</div>
                <div className="text-lg font-bold font-mono">
                  {Math.round(totals.gallonsPumpThisEng)}
                  <span className="text-xs ml-1 opacity-70">GAL</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Foam System */}
          <div className={`p-4 rounded-xl border-2 ${
            foamEnabled 
              ? 'bg-pink-500/10 border-pink-500/30' 
              : 'bg-[#1a2332] border-[#2a3340]'
          }`}>
            <div className="text-xs font-semibold mb-3 opacity-70">FOAM SYSTEM</div>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] opacity-60">Status</div>
                <div className="text-sm font-bold">
                  {foamEnabled ? 'ACTIVE' : 'OFF'}
                </div>
              </div>
              <div>
                <div className="text-[10px] opacity-60">Remaining</div>
                <div className="text-2xl font-bold font-mono">
                  {Math.round(gauges.foamGal)}
                  <span className="text-xs ml-1 opacity-70">GAL</span>
                </div>
              </div>
              <div className="w-full bg-[#0b1220] rounded-full h-2">
                <div 
                  className="bg-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${(gauges.foamGal / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
          
          {/* Engine & Pump */}
          <div className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
            <div className="text-xs font-semibold mb-3 opacity-70">ENGINE & PUMP</div>
            <div className="space-y-2">
              <div>
                <div className="text-[10px] opacity-60">Engine RPM</div>
                <div className="text-2xl font-bold font-mono">
                  {Math.round(gauges.rpm)}
                </div>
              </div>
              <div>
                <div className="text-[10px] opacity-60">Pump Temp</div>
                <div className={`text-lg font-bold font-mono ${
                  gauges.pumpTempF >= 200 ? 'text-red-400' : ''
                }`}>
                  {Math.round(gauges.pumpTempF)}°F
                </div>
              </div>
            </div>
          </div>
          
          {/* Warnings & Status */}
          <div className={`p-4 rounded-xl border-2 ${
            warnings.length > 0
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-[#1a2332] border-[#2a3340]'
          }`}>
            <div className="text-xs font-semibold mb-3 opacity-70">WARNINGS</div>
            {warnings.length > 0 ? (
              <div className="space-y-2">
                {warnings.map((warning, idx) => (
                  <div key={idx} className="text-xs text-red-400 font-medium">
                    ⚠️ {warning}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 opacity-60">
                <div className="text-3xl mb-2">✓</div>
                <div className="text-xs">All Systems Normal</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Active Discharge Lines with FL Metrics */}
        {Object.values(discharges).some(d => d.open && d.gpmNow > 0) && (
          <div className="space-y-3">
            <div className="text-xs font-semibold opacity-70 px-1">ACTIVE DISCHARGE LINES</div>
            
            {Object.entries(discharges)
              .filter(([_, d]) => d.open && d.gpmNow > 0)
              .map(([id, discharge]) => {
                const flMode = discharge.hoseConfig.flMode
                const flValue = getEffectiveFLValue(discharge)
                
                const flResult = computeLineFrictionLoss({
                  gpm: discharge.gpmNow,
                  lengthFt: discharge.hoseConfig.lengthFt,
                  mode: flMode === 'preset' ? 'psi_per100' : 'coefficient',
                  value: flMode === 'preset'
                    ? flValue
                    : flValue
                })
                
                // Calculate PDP based on assignment
                let nozzlePressure = 0
                let elevationPsi = 0
                
                if (discharge.assignment.type === 'handline_175_fog') {
                  nozzlePressure = 100
                } else if (discharge.assignment.type === 'fdc_standpipe') {
                  nozzlePressure = 100
                  elevationPsi = discharge.assignment.floors * 5
                } else if (discharge.assignment.type === 'blitzfire') {
                  nozzlePressure = discharge.assignment.mode === 'std100' ? 100 : 55
                } else if (discharge.assignment.type === 'deck_gun') {
                  nozzlePressure = 80
                }
                
                const pdp = nozzlePressure + flResult.totalPsi + elevationPsi
                
                return (
                  <div key={id} className="bg-[#1a2332] border-2 border-[#2a3340] rounded-lg p-3 space-y-2">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">{discharge.label}</span>
                      <span className="text-lg font-mono text-blue-300">
                        {Math.round(discharge.gpmNow)} GPM
                      </span>
                    </div>
                    
                    {/* Hose Info */}
                    <div className="text-sm text-gray-400">
                      {discharge.hoseConfig.diameter}″ × {discharge.hoseConfig.lengthFt}′ hose
                    </div>
                    
                    {/* FL Metrics - Mobile Optimized Grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-blue-900/30 border border-blue-700 rounded p-2">
                        <div className="text-xs text-blue-400">FL Rate</div>
                        <div className="text-lg font-mono text-blue-200">
                          {flResult.psiPer100.toFixed(1)}
                          <span className="text-xs text-blue-400 ml-1">psi/100′</span>
                        </div>
                        {discharge.hoseConfig.flOverride && (
                          <span className="text-blue-400 text-xs">● override</span>
                        )}
                      </div>
                      <div className="bg-blue-900/30 border border-blue-700 rounded p-2">
                        <div className="text-xs text-blue-400">FL Total</div>
                        <div className="text-lg font-mono text-blue-200">
                          {flResult.totalPsi.toFixed(1)}
                          <span className="text-xs text-blue-400 ml-1">psi</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* PDP */}
                    <div className="text-center py-2 bg-orange-900/30 border border-orange-700 rounded">
                      <div className="text-xs text-orange-400">Pump Discharge Pressure</div>
                      <div className="text-2xl font-mono text-orange-300 font-bold">
                        {Math.round(pdp)} psi
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}