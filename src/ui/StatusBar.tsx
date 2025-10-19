import { Bell, Settings, FileText } from 'lucide-react'
import { useStore } from '../state/store'

export function StatusBar({ onOpenSettings, onOpenAfterAction }: {
  onOpenSettings: () => void
  onOpenAfterAction: () => void
}) {
  const pumpEngaged = useStore(state => state.pumpEngaged)
  const source = useStore(state => state.source)
  const masterIntake = useStore(state => state.gauges.masterIntake)
  const masterDischarge = useStore(state => state.gauges.masterDischarge)
  const rpm = useStore(state => state.gauges.rpm)
  const waterGal = useStore(state => state.gauges.waterGal)
  const foamGal = useStore(state => state.gauges.foamGal)
  const foamEnabled = useStore(state => state.foamEnabled)
  const soundOn = useStore(state => state.soundOn)
  const setSoundOn = useStore(state => state.setSoundOn)
  const warnings = useStore(state => state.warnings)
  const disengagePump = useStore(state => state.disengagePump)

  return (
    <div className="bg-gray-900 border-b border-white/10 px-4 py-2 sticky top-0 z-50">
      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
        {/* Left: Status indicators */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          {/* Pump Status Pill */}
          <div className={`px-2 py-1 rounded-lg font-semibold whitespace-nowrap ${
            pumpEngaged ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'
          }`}>
            {pumpEngaged ? 'ENGAGED' : 'OFF'}
          </div>
          
          {pumpEngaged && (
            <>
              {/* Source Pill */}
              <div className="px-2 py-1 rounded-lg bg-sky-500/20 border border-sky-500/50 font-semibold whitespace-nowrap hidden sm:block">
                {source === 'tank' ? 'TANK' : source === 'hydrant' ? 'HYDRANT' : 'NO SOURCE'}
              </div>
              
              {/* Master Intake */}
              <div className="hidden md:flex items-center gap-1">
                <span className="opacity-60">IN:</span>
                <span className="font-mono font-bold tabular-nums">{Math.round(masterIntake)}</span>
                <span className="text-[10px] opacity-60">PSI</span>
              </div>
              
              {/* Master Discharge */}
              <div className="flex items-center gap-1">
                <span className="opacity-60">OUT:</span>
                <span className={`font-mono font-bold tabular-nums ${masterDischarge >= 350 ? 'text-red-400' : ''}`}>
                  {Math.round(masterDischarge)}
                </span>
                <span className="text-[10px] opacity-60">PSI</span>
              </div>
              
              {/* RPM */}
              <div className="hidden lg:flex items-center gap-1">
                <span className="opacity-60">RPM:</span>
                <span className="font-mono font-bold tabular-nums">{Math.round(rpm)}</span>
              </div>
              
              {/* Water/Foam mini bars */}
              <div className="hidden xl:flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] opacity-60">H₂O</span>
                  <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-sky-400 transition-all"
                      style={{ width: `${(waterGal / 720) * 100}%` }}
                    />
                  </div>
                </div>
                
                {foamEnabled && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] opacity-60">FOAM</span>
                    <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-400 transition-all"
                        style={{ width: `${(foamGal / 30) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          {/* Disengage Pump Button */}
          {pumpEngaged && (
            <button
              onClick={() => disengagePump()}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all"
            >
              DISENGAGE PUMP
            </button>
          )}
          
          {/* Warnings */}
          {warnings.length > 0 && (
            <button className="relative p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all">
              <Bell size={16} className="text-red-400" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {warnings.length}
              </span>
            </button>
          )}
          
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded-lg transition-all ${
              soundOn ? 'bg-emerald-500/20 hover:bg-emerald-500/30' : 'bg-white/10 hover:bg-white/20'
            }`}
            aria-label="Toggle sound"
          >
            🔊
          </button>
          
          {/* After-Action Report */}
          <button
            onClick={onOpenAfterAction}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            aria-label="After-action report"
          >
            <FileText size={16} />
          </button>
          
          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            aria-label="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}