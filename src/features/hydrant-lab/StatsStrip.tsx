import { useHydrantLab } from './store'

export function StatsStrip() {
  const s = useHydrantLab()
  
  const activLegs = Object.values(s.legs).filter(Boolean).filter((leg: any) => 
    leg.id === 'steamer' || leg.gateOpen
  )
  
  if (activLegs.length === 0) {
    return (
      <div className="text-center py-8 opacity-50">
        <p className="text-sm">No active supply legs</p>
        <p className="text-xs mt-1">Connect hoses to view statistics</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold opacity-70 uppercase tracking-wide">Leg Statistics</h3>
      
      {activLegs.map((leg: any) => {
        const label = leg.id === 'steamer' ? 'Steamer' : leg.id === 'sideA' ? 'Side A' : 'Side B'
        const flPsi = Math.round((s.staticPsi - s.engineIntakePsi) * 0.7) // Approximate FL
        
        return (
          <div key={leg.id} className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">{label}</span>
              <span className="text-xs opacity-60">{leg.sizeIn}″ × {leg.lengthFt}′</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold tabular-nums">{Math.round(leg.gpm)}</div>
                <div className="text-xs opacity-60">GPM</div>
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums">{flPsi}</div>
                <div className="text-xs opacity-60">FL (psi)</div>
              </div>
              <div>
                <div className="text-lg font-bold tabular-nums">
                  {Math.round((leg.gpm / s.totalInflowGpm) * 100) || 0}%
                </div>
                <div className="text-xs opacity-60">of Total</div>
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Summary */}
      <div className="border-t border-white/10 pt-3 mt-3">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-sm opacity-60 mb-1">Average FL</div>
            <div className="text-xl font-bold tabular-nums">
              {Math.round((s.staticPsi - s.engineIntakePsi) * 0.7)} psi
            </div>
          </div>
          <div>
            <div className="text-sm opacity-60 mb-1">Active Legs</div>
            <div className="text-xl font-bold tabular-nums">
              {activLegs.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}