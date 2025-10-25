import { useHydrantLab } from './store'
import { AlertTriangle, CheckCircle, Info } from 'lucide-react'

export function AdvisorChips() {
  const s = useHydrantLab()
  
  const tips: Array<{ type: 'warn' | 'success' | 'info'; text: string }> = []
  
  // Check residual pressure
  if (s.hydrantResidualPsi < 20) {
    tips.push({
      type: 'warn',
      text: 'Hydrant residual below NFPA 291 floor (20 psi). Add more supply legs or reduce flow.'
    })
  } else if (s.hydrantResidualPsi < 25) {
    tips.push({
      type: 'warn',
      text: 'Residual marginal. Consider adding another supply leg for safety.'
    })
  } else if (s.hydrantResidualPsi >= 40) {
    tips.push({
      type: 'success',
      text: 'Excellent residual pressure. System has good capacity margin.'
    })
  }
  
  // Check engine intake
  if (s.engineIntakePsi < 25) {
    tips.push({
      type: 'warn',
      text: 'Low engine intake. Risk of cavitation. Check for kinks or add supply legs.'
    })
  }
  
  // Count active legs
  const activeLegs = Object.values(s.legs).filter(Boolean).filter((leg: any) => 
    leg.id === 'steamer' || leg.gateOpen
  )
  
  if (activeLegs.length === 1) {
    tips.push({
      type: 'info',
      text: 'Single supply leg. Consider double-tapping (steamer + side) for flows >1000 GPM.'
    })
  } else if (activeLegs.length === 2) {
    tips.push({
      type: 'success',
      text: 'Double tap active. Good for master streams up to ~1800 GPM.'
    })
  } else if (activeLegs.length === 3) {
    tips.push({
      type: 'success',
      text: 'Triple tap! Maximum supply capacity for sustained operations.'
    })
  }
  
  // HAV recommendations
  if (s.hav.enabled && s.hav.mode === 'boost') {
    tips.push({
      type: 'info',
      text: `HAV boosting at ${s.hav.boostPsi} psi. Helps overcome friction loss in initial line.`
    })
  }
  
  // Check for 3" legs
  const has3InchLeg = activeLegs.some((leg: any) => leg.sizeIn === 3)
  if (has3InchLeg && s.totalInflowGpm > 500) {
    tips.push({
      type: 'warn',
      text: '3″ hose has high friction loss. Consider 5″ LDH for flows >500 GPM.'
    })
  }
  
  if (tips.length === 0) {
    tips.push({
      type: 'info',
      text: 'Connect supply hoses to begin. Try different configurations to see how they affect flow.'
    })
  }
  
  const icons = {
    warn: <AlertTriangle size={16} />,
    success: <CheckCircle size={16} />,
    info: <Info size={16} />
  }
  
  const colors = {
    warn: 'bg-amber-500/10 border-amber-500/30 text-amber-200',
    success: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-200'
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold opacity-70 uppercase tracking-wide">Advisor</h3>
      
      <div className="space-y-2">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2 p-3 rounded-lg border ${colors[tip.type]}`}
          >
            <div className="flex-shrink-0 mt-0.5">{icons[tip.type]}</div>
            <p className="text-xs leading-relaxed">{tip.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}