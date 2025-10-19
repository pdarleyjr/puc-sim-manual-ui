import { Settings, Bell, FileText, BookOpen } from 'lucide-react'
import { useStore } from '../state/store'
import { selectCavitating, selectResidualBadge } from '../state/selectors'
import { startTour } from './tutorial/Tour'

export interface StatusBarProps {
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
  const warnings = useStore(state => state.warnings)
  const soundOn = useStore(state => state.soundOn)
  const setSoundOn = useStore(state => state.setSoundOn)
  const cavitating = useStore(selectCavitating)
  const residualBadge = useStore(selectResidualBadge)
  const disengagePump = useStore(state => state.disengagePump)

  return (
    <div className="bg-gray-900 border-b border-white/10 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left side - Pump status */}
        <div className="flex items-center gap-3">
          {/* Pump Status */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            pumpEngaged ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'
          }`}>
            {pumpEngaged ? 'PUMP ENGAGED' : 'PUMP OFF'}
          </div>

          {/* Disengage Button (only when pump is engaged) */}
          {pumpEngaged && (
            <button
              onClick={() => disengagePump()}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-red-500 hover:bg-red-600 text-white transition-all"
            >
              DISENGAGE PUMP
            </button>
          )}

          {/* Source indicator */}
          {source !== 'none' && (
            <div className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/50">
              {source === 'tank' ? 'TANK' : 'HYDRANT'}
            </div>
          )}
        </div>

        {/* Center - Gauges */}
        {pumpEngaged && (
          <div className="flex items-center gap-4">
            {/* Master Intake with Residual Badge */}
            <div className="text-center relative">
              <div className="text-xs opacity-60">INTAKE</div>
              <div className="text-2xl font-bold tabular-nums">
                {Math.round(masterIntake)}
              </div>
              <div className="text-xs opacity-60">PSI</div>
              {residualBadge && (
                <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                  residualBadge === 'green' ? 'bg-emerald-500 text-white' :
                  residualBadge === 'amber' ? 'bg-amber-500 text-black' :
                  'bg-red-500 text-white'
                }`}>
                  RES ≥20
                </div>
              )}
            </div>

            {/* Master Discharge with Cavitation indicator */}
            <div className="text-center relative">
              <div className="text-xs opacity-60">DISCHARGE</div>
              <div className={`text-2xl font-bold tabular-nums ${
                masterDischarge >= 350 ? 'text-red-400' : ''
              } ${cavitating ? 'animate-pulse text-red-500' : ''}`}>
                {Math.round(masterDischarge)}
              </div>
              <div className="text-xs opacity-60">PSI</div>
              {cavitating && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white animate-pulse whitespace-nowrap">
                  CAVITATION
                </div>
              )}
            </div>

            {/* Engine RPM */}
            <div className="text-center">
              <div className="text-xs opacity-60">ENGINE</div>
              <div className="text-2xl font-bold tabular-nums">{Math.round(rpm)}</div>
              <div className="text-xs opacity-60">RPM</div>
            </div>

            {/* Water/Foam levels mini-bars */}
            <div className="flex items-center gap-2">
              <div className="text-xs">
                <div className="opacity-60">Water</div>
                <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-sky-400 transition-all"
                    style={{ width: `${(waterGal / 720) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] tabular-nums mt-0.5">{Math.round(waterGal)}g</div>
              </div>
              {foamEnabled && (
                <div className="text-xs">
                  <div className="opacity-60">Foam</div>
                  <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden mt-1">
                    <div 
                      className="h-full bg-pink-400 transition-all"
                      style={{ width: `${(foamGal / 30) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] tabular-nums mt-0.5">{Math.round(foamGal)}g</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Warnings */}
          {warnings.length > 0 && (
            <button className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all relative">
              <Bell size={18} />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {warnings.length}
              </span>
            </button>
          )}

          {/* After Action Report */}
          <button
            onClick={onOpenAfterAction}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            title="After Action Report"
          >
            <FileText size={18} />
          </button>

          {/* Tutorial */}
          <button
            onClick={() => startTour()}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            title="Tutorial"
          >
            <BookOpen size={18} />
          </button>

          {/* Sound toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded-lg transition-all ${
              soundOn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/60'
            }`}
            title={soundOn ? 'Sound On' : 'Sound Off'}
          >
            <span className="text-sm font-bold">{soundOn ? '🔊' : '🔇'}</span>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}