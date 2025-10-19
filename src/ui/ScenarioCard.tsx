import { useState } from 'react'
import { useStore } from '../state/store'
import type { ScenarioId } from '../state/store'

export function ScenarioCard() {
  const scenario = useStore(state => state.scenario)
  const scenarioStart = useStore(state => state.scenarioStart)
  const scenarioExit = useStore(state => state.scenarioExit)
  const scenarioAbort = useStore(state => state.scenarioAbort)
  
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('residential_one_xlay')
  
  const handleStart = () => {
    scenarioStart(selectedScenario)
  }
  
  const handleExit = () => {
    scenarioExit()
  }
  
  const handleAbort = () => {
    scenarioAbort()
  }
  
  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000)
    const min = Math.floor(sec / 60)
    const s = sec % 60
    return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  
  const statusColor = {
    idle: 'bg-white/10',
    running: 'bg-blue-500',
    passed: 'bg-emerald-500',
    failed: 'bg-red-500',
    aborted: 'bg-amber-500',
  }[scenario.status]
  
  return (
    <div className="puc-card">
      <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide uppercase mb-3 text-center opacity-80 drop-shadow-md">
        SCENARIO MODE
      </h3>
      
      {/* Status Badge */}
      <div className="mb-4 text-center">
        <span className={`px-4 py-2 rounded-lg text-sm font-bold ${statusColor}`}>
          {scenario.status.toUpperCase()}
        </span>
        {scenario.unit && scenario.status === 'running' && (
          <span className="ml-2 px-3 py-1 rounded bg-white/10 text-xs">
            {scenario.unit}
          </span>
        )}
      </div>
      
      {/* Scenario Selection (only when idle) */}
      {scenario.status === 'idle' && (
        <div className="mb-4">
          <label className="text-xs opacity-60">Select Scenario</label>
          <select
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value as ScenarioId)}
            className="w-full mt-1 px-3 py-2 bg-white/10 rounded-lg text-sm border border-white/20 focus:border-emerald-500 focus:outline-none"
          >
            <option value="residential_one_xlay" className="bg-gray-900">
              Residential - One Crosslay
            </option>
            <option value="residential_with_exposure" className="bg-gray-900">
              Residential with Exposure
            </option>
          </select>
        </div>
      )}
      
      {/* Hydrant Countdown */}
      {scenario.locks.hydrantCountdownMs !== null && (
        <div className="mb-4 p-3 bg-sky-500/20 border border-sky-500/50 rounded-lg">
          <div className="text-xs opacity-60 mb-1">Hydrant En Route</div>
          <div className="text-2xl font-bold tabular-nums text-sky-400">
            {formatTime(scenario.locks.hydrantCountdownMs)}
          </div>
        </div>
      )}
      
      {/* Event Feed */}
      {scenario.eventFeed.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto bg-black/30 rounded-lg p-3 space-y-2">
          {scenario.eventFeed.map((event, idx) => (
            <div key={idx} className="text-xs border-l-2 border-white/20 pl-2">
              <span className="opacity-60 mr-2">+{formatTime(event.ts)}</span>
              <span>{event.text}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Controls */}
      <div className="flex gap-2">
        {scenario.status === 'idle' && (
          <button
            onClick={handleStart}
            className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition-all"
          >
            START
          </button>
        )}
        
        {scenario.status === 'running' && (
          <button
            onClick={handleAbort}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold transition-all"
          >
            ABORT
          </button>
        )}
        
        {(scenario.status === 'passed' || scenario.status === 'failed' || scenario.status === 'aborted') && (
          <button
            onClick={handleExit}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold transition-all"
          >
            EXIT
          </button>
        )}
      </div>
      
      {scenario.status === 'idle' && (
        <div className="mt-3 text-xs text-center opacity-60 leading-relaxed">
          Select a scenario and click START to begin instructor-grade training
        </div>
      )}
    </div>
  )
}