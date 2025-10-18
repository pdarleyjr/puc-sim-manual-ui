import { Bell, Settings } from 'lucide-react'
import { useStore } from '../state/store'

interface StatusBarProps {
  onOpenSettings: () => void
}

export function StatusBar({ onOpenSettings }: StatusBarProps) {
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

  const warnings = 0 // Placeholder for future warning logic
  
  const waterPct = (waterGal / waterCap) * 100
  const foamPct = (foamGal / foamCap) * 100

  return (
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
          
          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
            source === 'tank' 
              ? 'bg-sky-500 text-white' 
              : 'bg-sky-500 text-white'
          }`}>
            {source === 'tank' ? 'TANK' : 'HYDRANT'}
          </div>
        </div>

        {/* Center: Master Gauges */}
        <div className="flex items-center gap-6">
          {/* Master Intake */}
          <div className="text-center">
            <div className="text-xs opacity-60">INTAKE</div>
            <div className="text-2xl font-bold tabular-nums">
              {Math.round(masterIntake)}
            </div>
            <div className="text-xs opacity-60">PSI</div>
          </div>

          {/* Master Discharge */}
          <div className="text-center">
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
            <span className="text-xs tabular-nums">{waterGal}g</span>
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
              <span className="text-xs tabular-nums">{foamGal}g</span>
            </div>
          )}

          {/* Warnings */}
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition-all">
            <Bell size={20} />
            {warnings > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {warnings}
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
  )
}