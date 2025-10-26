import { useStore } from '../../../state/store'

export default function PanelData() {
  const totals = useStore(state => state.totals)
  const gauges = useStore(state => state.gauges)
  const foamEnabled = useStore(state => state.foamEnabled)
  const warnings = useStore(state => state.warnings)
  
  return (
    <div className="h-full p-3 overflow-hidden">
      <div className="grid grid-cols-2 gap-3 h-full content-start">
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
    </div>
  )
}