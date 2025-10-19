import { Bell, Settings, Power, Monitor } from 'lucide-react'
import { useStore } from '../state/store'
import { selectCavitating, selectResidualBadge } from '../state/selectors'
import { useState, useEffect } from 'react'

interface StatusBarProps {
  onOpenSettings: () => void
  onOpenAfterAction: () => void
}

export function StatusBar({ onOpenSettings, onOpenAfterAction }: StatusBarProps) {
  const pumpEngaged = useStore(state => state.pumpEngaged)
  const source = useStore(state => state.source)
  const masterIntake = useStore(state => state.gauges.masterIntake)
  const masterDischarge = useStore(state => state.gauges.masterDischarge)
  const rpm = useStore(state => state.gauges.rpm)
  const waterGal = useStore(state => state.gauges.waterGal)
  const foamGal = useStore(state => state.gauges.foamGal)
  const foamEnabled = useStore(state => state.foamEnabled)
  const waterCap = useStore(state => state.capacities.water)
  const foamCap = useStore(state => state.capacities.foam)
  const warnings = useStore(state => state.warnings)
  const compactMode = useStore(state => state.uiPrefs.compactMode)
  const setCompactMode = useStore(state => state.setCompactMode)
  const disengagePump = useStore(state => state.disengagePump)
  
  const cavitating = useStore(selectCavitating)
  const residualBadge = useStore(selectResidualBadge)
  
  const [redlinePulse, setRedlinePulse] = useState(false)
  const [prevDischarge, setPrevDischarge] = useState(masterDischarge)
  
  // Redline pulse effect (rising edge detection)
  useEffect(() => {
    if (masterDischarge >= 350 && prevDischarge < 350) {
      setRedlinePulse(true)
      setTimeout(() => setRedlinePulse(false), 1000)
    }
    setPrevDischarge(masterDischarge)
  }, [masterDischarge, prevDischarge])
  
  const waterPct = (waterGal / waterCap) * 100
  const foamPct = (foamGal / foamCap) * 100
  
  const sourceLabel = source === 'none' ? 'NONE' : source === 'tank' ? 'TANK-TO-PUMP' : 'HYDRANT'
  const sourceBg = source === 'none' ? 'bg-white/10 text-white/60' : 'bg-sky-500 text-white'

  const handleDisengage = () => {
    disengagePump()
    onOpenAfterAction()
  }

  return (
    <>
      <div className="bg-[#1a1d23] border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Pump Status */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              pumpEngaged 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white/10 text-white/60'
            }`}>
              PUMP {pumpEngaged ? 'ENGAGED' : 'OFF'}
            </div>
            
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${sourceBg}`}>
              {sourceLabel}
            </div>
            
            {pumpEngaged && (
              <button
                onClick={handleDisengage}
                className="flex items-center gap-2 px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold transition-all"
              >
                <Power size={14} />
                DISENGAGE
              </button>
            )}
          </div>

          {/* Center: Master Gauges */}
          <div className="flex items-center gap-6">
            {/* Master Intake with Residual Badge */}
            <div className="text-center relative">
              <div className="text-xs opacity-60">INTAKE</div>
              <div className="text-2xl font-bold tabular-nums">
                {Math.round(masterIntake)}
              </div>
              <div className="text-xs opacity-60">PSI</div>
              {residualBadge && (
                <div className={`absolute -top-1 -right-8 px-2 py-0.5 rounded text-[10px] font-bold ${
                  residualBadge === 'green' ? 'bg-emerald-500 text-white' :
                  residualBadge === 'amber' ? 'bg-amber-500 text-black' :
                  'bg-red-500 text-white'
                }`}>
                  RES
                </div>
              )}
            </div>

            {/* Master Discharge with Redline Pulse */}
            <div className={`text-center ${redlinePulse ? 'redline-pulse' : ''}`}>
              <div className="text-xs opacity-60">DISCHARGE</div>
              <div className={`text-2xl font-bold tabular-nums ${
                masterDischarge >= 350 ? 'text-red-500' : ''
              }`}>
                {Math.round(masterDischarge)}
              </div>
              <div className="text-xs opacity-60">PSI</div>
            </div>

            {/* Engine RPM */}
            <div className="text-center">
              <div className="text-xs opacity-60">ENGINE</div>
              <div className="text-2xl font-bold tabular-nums">
                {Math.round(rpm)}
              </div>
              <div className="text-xs opacity-60">RPM</div>
            </div>
          </div>

          {/* Right: Levels, Warnings, Settings */}
          <div className="flex items-center gap-4">
            {/* Water Level */}
            <div className="flex items-center gap-2">
              <div className="w-20 h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-sky-400 transition-all"
                  style={{ width: `${waterPct}%` }}
                />
              </div>
              <span className="text-xs tabular-nums">{Math.round(waterGal)}g</span>
            </div>

            {/* Foam Level (if enabled) */}
            {foamEnabled && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-3 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-pink-400 transition-all"
                    style={{ width: `${foamPct}%` }}
                  />
                </div>
                <span className="text-xs tabular-nums">{Math.round(foamGal)}g</span>
              </div>
            )}

            {/* Compact Mode Toggle */}
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`p-2 rounded-lg transition-all ${
                compactMode ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/10'
              }`}
              title="Compact Mode"
            >
              <Monitor size={20} />
            </button>

            {/* Warnings */}
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-all">
              <Bell size={20} />
              {warnings.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {warnings.length}
                </span>
              )}
            </button>

            {/* Settings */}
            <button 
              onClick={onOpenSettings}
              className="p-2 hover:bg-white/10 rounded-lg transition-all"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Cavitation Warning Banner */}
      {cavitating && (
        <div className="bg-amber-500 border-b border-amber-600 px-6 py-2">
          <div className="flex items-center gap-3">
            <span className="animate-pulse text-xl">⚠️</span>
            <span className="text-black font-bold text-sm">
              Watch intake — possible cavitation (increase supply or reduce demand)
            </span>
          </div>
        </div>
      )}
    </>
  )
}