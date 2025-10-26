import { useHydrantLab } from './store'

export function EngineIntakePuck({ 
  intakePsi, 
  totalGpm 
}: { 
  intakePsi: number
  totalGpm: number 
}) {
  // Get discharge data from store
  const totalDischargeFlowGpm = useHydrantLab(s => s.totalDischargeFlowGpm)
  const governorLimited = useHydrantLab(s => s.governorLimited)
  
  // Visual gauge ring (simplified)
  const maxPsi = 100
  const pct = Math.min(100, (intakePsi / maxPsi) * 100)
  
  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-sm font-semibold opacity-70 uppercase tracking-wide">Engine Intake</h3>
      
      {/* Circular gauge */}
      <div className="relative w-32 h-32">
        {/* Background ring */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={intakePsi >= 40 ? '#10b981' : intakePsi >= 25 ? '#f59e0b' : '#ef4444'}
            strokeWidth="8"
            strokeDasharray={`${pct * 2.513} ${251.3 - pct * 2.513}`}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
        
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold tabular-nums">{Math.round(intakePsi)}</div>
          <div className="text-xs opacity-60 uppercase">PSI</div>
        </div>
      </div>
      
      {/* Flow readouts */}
      <div className="text-center space-y-1">
        <div>
          <div className="text-2xl font-bold tabular-nums">{Math.round(totalGpm)}</div>
          <div className="text-xs opacity-60 uppercase">Total Hydrant Inflow to Pump</div>
        </div>
        
        {/* Discharge outflow display */}
        {totalDischargeFlowGpm > 0 && (
          <div className="pt-2 border-t border-white/10">
            <div className="text-lg font-semibold tabular-nums flex items-center justify-center gap-1">
              {Math.round(totalDischargeFlowGpm)}
              {governorLimited && (
                <span className="text-amber-400 text-xs" title="Governor limiting outflow">⚠</span>
              )}
            </div>
            <div className="text-xs opacity-60 uppercase">
              Outflow {governorLimited ? '(Governor-limited)' : ''}
            </div>
          </div>
        )}
      </div>
      
      {/* Status indicator */}
      <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
        intakePsi >= 40 ? 'bg-emerald-500/20 text-emerald-300' :
        intakePsi >= 25 ? 'bg-amber-500/20 text-amber-300' :
        'bg-red-500/20 text-red-300'
      }`}>
        {intakePsi >= 40 ? 'OPTIMAL' : intakePsi >= 25 ? 'ADEQUATE' : 'LOW PRESSURE'}
      </div>
    </div>
  )
}