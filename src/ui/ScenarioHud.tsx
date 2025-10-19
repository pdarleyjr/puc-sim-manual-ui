import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useStore } from '../state/store'
import type { ScenarioId } from '../state/store'

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `+${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export function ScenarioHud() {
  const [expanded, setExpanded] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('residential_one_xlay')
  
  const scenario = useStore(state => state.scenario)
  const scenarioStart = useStore(state => state.scenarioStart)
  const scenarioAbort = useStore(state => state.scenarioAbort)
  const scenarioExit = useStore(state => state.scenarioExit)
  
  const isRunning = scenario.status === 'running'
  const isComplete = scenario.status === 'passed' || scenario.status === 'failed' || scenario.status === 'aborted'
  const canStart = scenario.status === 'idle'
  const canExit = !isRunning
  
  // Calculate elapsed time
  const elapsed = scenario.clock ? scenario.clock.now - scenario.clock.t0 : 0
  
  // Status badge colors
  const statusColors = {
    idle: 'bg-gray-600',
    running: 'bg-emerald-500 animate-pulse',
    passed: 'bg-green-500',
    failed: 'bg-red-500',
    aborted: 'bg-amber-500',
  }
  
  const statusIcons = {
    idle: null,
    running: <Clock size={14} />,
    passed: <CheckCircle size={14} />,
    failed: <XCircle size={14} />,
    aborted: <AlertTriangle size={14} />,
  }
  
  const scenarios = [
    { id: 'residential_one_xlay' as ScenarioId, label: 'Single-story residential (one crosslay)' },
    { id: 'residential_with_exposure' as ScenarioId, label: 'Single-story residential with exposure' },
  ]
  
  return (
    <div className="sticky top-0 z-40 bg-gradient-to-b from-gray-900/95 to-gray-900/90 backdrop-blur-sm border-b border-white/10 shadow-xl">
      {/* Header Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Left: Status & Controls */}
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${statusColors[scenario.status]}`}>
              {statusIcons[scenario.status]}
              {scenario.status.toUpperCase()}
            </div>
            
            {canStart && (
              <>
                <select
                  value={selectedScenario}
                  onChange={(e) => setSelectedScenario(e.target.value as ScenarioId)}
                  className="px-3 py-1 bg-white/10 rounded-lg text-sm border border-white/20 focus:border-emerald-500 focus:outline-none"
                >
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id} className="bg-gray-900">
                      {s.label}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={() => scenarioStart(selectedScenario)}
                  className="px-4 py-1 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold transition-all"
                >
                  START
                </button>
              </>
            )}
            
            {isRunning && (
              <button
                onClick={() => scenarioAbort()}
                className="px-4 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-bold transition-all"
              >
                ABORT
              </button>
            )}
            
            {canExit && isComplete && (
              <button
                onClick={() => scenarioExit()}
                className="px-4 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-all"
              >
                EXIT SCENARIO
              </button>
            )}
          </div>
          
          {/* Middle: Clock */}
          {isRunning && scenario.clock && (
            <div className="flex items-center gap-2 px-4 py-1 bg-black/30 rounded-lg">
              <Clock size={16} className="text-emerald-400" />
              <span className="font-mono text-lg font-bold tabular-nums text-emerald-400">
                {formatTime(elapsed)}
              </span>
            </div>
          )}
          
          {/* Right: Indicators */}
          <div className="flex-1 flex items-center justify-end gap-3">
            {scenario.locks.hydrantCountdownMs !== null && (
              <div className="px-3 py-1 bg-sky-500/20 border border-sky-500/50 rounded-lg text-sm font-semibold flex items-center gap-2">
                <span>Hydrant ETA:</span>
                <span className="font-mono tabular-nums">{Math.ceil(scenario.locks.hydrantCountdownMs / 1000)}s</span>
              </div>
            )}
            
            {scenario.status === 'passed' && (
              <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg text-sm font-bold text-green-400">
                ✓ PASS
              </div>
            )}
            
            {scenario.status === 'failed' && (
              <div className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-sm font-bold text-red-400">
                ✗ FAIL
              </div>
            )}
            
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
              aria-label="Toggle event feed"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Expandable Event Feed */}
      {expanded && scenario.eventFeed.length > 0 && (
        <div className="px-4 pb-3 max-h-48 overflow-y-auto border-t border-white/5">
          <div className="space-y-1 pt-2">
            {scenario.eventFeed.map((event, idx) => (
              <div key={idx} className="text-sm flex gap-3 px-2 py-1 rounded hover:bg-white/5">
                <span className="font-mono text-xs text-emerald-400 tabular-nums flex-shrink-0">
                  {formatTime(event.ts)}
                </span>
                <span className="text-white/90">{event.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}