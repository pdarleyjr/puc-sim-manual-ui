import { useHydrantLab } from '../../../features/hydrant-lab/store'

interface TipProps {
  icon: string
  title: string
  description: string
  action?: string
  onApply?: () => void
}

function Tip({ icon, title, description, action, onApply }: TipProps) {
  return (
    <div className="p-4 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <div className="flex-1">
          <h3 className="text-sm font-bold mb-1">{title}</h3>
          <p className="text-xs opacity-70 mb-2">{description}</p>
          {action && onApply && (
            <button
              onClick={onApply}
              className="px-3 py-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 text-xs font-medium"
            >
              {action}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function HydrantAdvisor() {
  const legs = useHydrantLab(state => state.legs)
  const hav = useHydrantLab(state => state.hav)
  const staticPsi = useHydrantLab(state => state.staticPsi)
  const hydrantResidualPsi = useHydrantLab(state => state.hydrantResidualPsi)
  const engineIntakePsi = useHydrantLab(state => state.engineIntakePsi)
  const attachLeg = useHydrantLab(state => state.attachLeg)
  const setHavEnabled = useHydrantLab(state => state.setHavEnabled)
  const setHavMode = useHydrantLab(state => state.setHavMode)
  
  // Generate tips based on current configuration
  const tips: TipProps[] = []
  
  // Check if only steamer is connected
  const connectedCount = Object.values(legs).filter(l => l !== null).length
  if (connectedCount === 1 && legs.steamer) {
    tips.push({
      icon: '💡',
      title: 'Add Side Ports',
      description: 'Connect side ports for additional flow capacity. Side A and B can provide significant volume increases.',
      action: 'Connect Side A',
      onApply: () => attachLeg('sideA', 5)
    })
  }
  
  // Check for low intake pressure
  if (engineIntakePsi < 20 && engineIntakePsi > 0) {
    tips.push({
      icon: '⚠️',
      title: 'Low Intake Pressure',
      description: 'Engine intake below 20 PSI. Consider adding more supply lines or using larger diameter hose.',
      action: connectedCount < 3 ? 'Add Supply Line' : undefined,
      onApply: connectedCount < 3 ? () => attachLeg(legs.sideA ? 'sideB' : 'sideA', 5) : undefined
    })
  }
  
  // Check for 3" hose use
  const has3InchHose = Object.values(legs).some(l => l && l.sizeIn === 3)
  if (has3InchHose && engineIntakePsi < 30) {
    tips.push({
      icon: '📏',
      title: 'Upgrade to 5" LDH',
      description: '3" hose creates significant friction loss. Upgrading to 5" LDH will improve flow and pressure.',
    })
  }
  
  // HAV recommendations
  if (!hav.enabled && staticPsi >= 60) {
    tips.push({
      icon: '⚡',
      title: 'Consider HAV',
      description: 'High-rise Appliance Valve can boost pressure for elevated operations or long lays.',
      action: 'Enable HAV',
      onApply: () => {
        setHavEnabled(true)
        setHavMode('boost')
      }
    })
  }
  
  // Good configuration
  if (tips.length === 0 && engineIntakePsi >= 20) {
    tips.push({
      icon: '✅',
      title: 'Optimal Configuration',
      description: 'Your hydrant supply is well-configured. Intake pressure is good and flow capacity is adequate.',
    })
  }
  
  // General best practices
  if (tips.length <= 2) {
    tips.push({
      icon: '📚',
      title: 'Best Practice',
      description: 'Maintain residual pressure above 20 PSI at the hydrant. This ensures adequate supply for other apparatus.',
    })
  }
  
  return (
    <div className="h-full p-3 overflow-auto">
      <div className="space-y-3">
        {/* Status Summary */}
        <div className="p-4 rounded-xl bg-[#0b1220] border border-[#2a3340]">
          <div className="text-xs font-semibold mb-3 opacity-70">CURRENT STATUS</div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-[10px] opacity-60 mb-1">Hydrant</div>
              <div className={`text-lg font-bold font-mono ${
                hydrantResidualPsi >= 20 ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {Math.round(hydrantResidualPsi)}
                <span className="text-xs ml-0.5">PSI</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] opacity-60 mb-1">Intake</div>
              <div className={`text-lg font-bold font-mono ${
                engineIntakePsi >= 20 ? 'text-emerald-400' : engineIntakePsi >= 10 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {Math.round(engineIntakePsi)}
                <span className="text-xs ml-0.5">PSI</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] opacity-60 mb-1">Lines</div>
              <div className="text-lg font-bold">
                {connectedCount}/3
              </div>
            </div>
          </div>
        </div>
        
        {/* Tips */}
        {tips.map((tip, idx) => (
          <Tip key={idx} {...tip} />
        ))}
      </div>
    </div>
  )
}