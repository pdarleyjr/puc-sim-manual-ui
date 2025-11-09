import { LineAnalogGauge } from './Gauges'
import type { Discharge, DischargeId, AssignmentConfig } from '../state/store'
import { useStore } from '../state/store'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { computeLineFrictionLoss, type FrictionLossResult } from '../engine/calcEngineV2'
import { getEffectiveFLValue } from '../state/store'

interface AssignmentSelectorProps {
  discharge: Discharge
}

function AssignmentSelector({ discharge }: AssignmentSelectorProps) {
  const setLine = useStore(state => state.setLine)
  const is2Half = discharge.id.startsWith('twohalf')
  const isCrosslay = discharge.id.startsWith('xlay') || discharge.id === 'trashline'
  
  // Crosslays are locked to handline_175_fog - no dropdown
  if (isCrosslay) {
    return null
  }
  
  const assignmentOptions: { value: AssignmentConfig['type']; label: string; requires2Half: boolean }[] = [
    { value: 'handline_175_fog', label: 'Handline (1¾" Fog 175 @ 75)', requires2Half: false },
    { value: 'fdc_standpipe', label: 'FDC / Standpipe', requires2Half: true },
    { value: 'skid_leader', label: 'Skid Load (Leader Line)', requires2Half: true },
    { value: 'blitzfire', label: 'Portable Monitor: Blitzfire', requires2Half: true },
    { value: 'portable_standpipe', label: 'Portable Standpipe', requires2Half: true },
  ]
  
  const handleAssignmentChange = (type: AssignmentConfig['type']) => {
    const option = assignmentOptions.find(o => o.value === type)
    if (option?.requires2Half && !is2Half) return // Guard
    
    // Set default config based on type
    let newAssignment: AssignmentConfig
    switch (type) {
      case 'handline_175_fog':
        newAssignment = { type: 'handline_175_fog' }
        break
      case 'fdc_standpipe':
        newAssignment = { type: 'fdc_standpipe', floors: 5 }
        break
      case 'skid_leader':
        newAssignment = { type: 'skid_leader', setbackFt: 100 }
        break
      case 'blitzfire':
        newAssignment = { type: 'blitzfire', mode: 'std100', len3inFt: 100 }
        break
      case 'portable_standpipe':
        newAssignment = { type: 'portable_standpipe', floors: 5, len3inFt: 100 }
        break
      default:
        return
    }
    setLine(discharge.id, { assignment: newAssignment })
  }
  
  const updateConfig = (patch: Partial<AssignmentConfig>) => {
    setLine(discharge.id, { assignment: { ...discharge.assignment, ...patch } as AssignmentConfig })
  }
  
  return (
    <div className="mt-3 space-y-2">
      {/* Assignment Dropdown */}
      <div>
        <label className="text-xs opacity-60">Assignment</label>
        <select
          value={discharge.assignment.type}
          onChange={(e) => handleAssignmentChange(e.target.value as AssignmentConfig['type'])}
          className="w-full mt-1 px-3 py-2 bg-white/10 rounded-lg text-sm border border-white/20 focus:border-emerald-500 focus:outline-none"
        >
          {assignmentOptions.map(opt => (
            <option 
              key={opt.value} 
              value={opt.value}
              disabled={opt.requires2Half && !is2Half}
              className="bg-gray-900"
            >
              {opt.label} {opt.requires2Half && !is2Half ? '(2½" only)' : ''}
            </option>
          ))}
        </select>
      </div>
      
      {/* Config Prompts */}
      {discharge.assignment.type === 'fdc_standpipe' && (
        <div className="bg-black/20 rounded-lg p-3 space-y-2">
          <label className="text-xs opacity-60">Fire Floor</label>
          <input
            type="number"
            min="2"
            max="50"
            value={discharge.assignment.floors}
            onChange={(e) => updateConfig({ floors: Math.max(2, Number(e.target.value)) })}
            className="w-full px-3 py-2 bg-white/10 rounded text-sm border border-white/20 focus:border-emerald-500 focus:outline-none"
          />
          <div className="text-xs opacity-60">≈{Math.round(discharge.assignment.floors * 5)} PSI elevation</div>
        </div>
      )}
      
      {discharge.assignment.type === 'skid_leader' && (
        <div className="bg-black/20 rounded-lg p-3 space-y-2">
          <label className="text-xs opacity-60">Setback Distance (ft)</label>
          <div className="flex gap-2">
            {[50, 100, 150, 200, 250].map(ft => (
              <button
                key={ft}
                onClick={() => updateConfig({ setbackFt: ft })}
                className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                  discharge.assignment.type === 'skid_leader' && discharge.assignment.setbackFt === ft
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {ft}′
              </button>
            ))}
          </div>
        </div>
      )}
      
      {discharge.assignment.type === 'blitzfire' && (
        <div className="bg-black/20 rounded-lg p-3 space-y-3">
          <div>
            <label className="text-xs opacity-60">Mode</label>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => updateConfig({ mode: 'low55' })}
                className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                  discharge.assignment.type === 'blitzfire' && discharge.assignment.mode === 'low55'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                Low 55
              </button>
              <button
                onClick={() => updateConfig({ mode: 'std100' })}
                className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                  discharge.assignment.type === 'blitzfire' && discharge.assignment.mode === 'std100'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                Std 100
              </button>
            </div>
          </div>
          <div>
            <label className="text-xs opacity-60">3″ Supply Length (ft)</label>
            <div className="flex gap-2 mt-1">
              {[50, 100, 150, 200].map(ft => (
                <button
                  key={ft}
                  onClick={() => updateConfig({ len3inFt: ft })}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                    discharge.assignment.type === 'blitzfire' && discharge.assignment.len3inFt === ft
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {ft}′
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {discharge.assignment.type === 'portable_standpipe' && (
        <div className="bg-black/20 rounded-lg p-3 space-y-3">
          <div>
            <label className="text-xs opacity-60">Floors</label>
            <input
              type="number"
              min="2"
              max="50"
              value={discharge.assignment.floors}
              onChange={(e) => updateConfig({ floors: Math.max(2, Number(e.target.value)) })}
              className="w-full px-3 py-2 bg-white/10 rounded text-sm border border-white/20 focus:border-emerald-500 focus:outline-none"
            />
            <div className="text-xs opacity-60 mt-1">≈{Math.round(discharge.assignment.floors * 5)} PSI elevation</div>
          </div>
          <div>
            <label className="text-xs opacity-60">3″ Supply Length (ft)</label>
            <div className="flex gap-2 mt-1">
              {[50, 100, 150, 200].map(ft => (
                <button
                  key={ft}
                  onClick={() => updateConfig({ len3inFt: ft })}
                  className={`flex-1 px-2 py-1 text-xs rounded transition-all ${
                    discharge.assignment.type === 'portable_standpipe' && discharge.assignment.len3inFt === ft
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  {ft}′
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// NEW: Deck Gun Card Component
export function DeckGunCard() {
  const discharge = useStore(state => state.discharges.deckgun)
  const setLine = useStore(state => state.setLine)

  const handleSetPercent = (percent: number) => {
    setLine('deckgun', { valvePercent: Math.max(0, Math.min(100, percent)) })
  }

  const updateTip = (tip: '1_3/8' | '1_1/2' | '1_3/4') => {
    if (discharge.assignment.type === 'deck_gun') {
      setLine('deckgun', { assignment: { type: 'deck_gun', tip } })
    }
  }

  return (
    <div className="puc-card">
      {/* Gauge */}
      <LineAnalogGauge 
        label={discharge.label} 
        psi={discharge.displayPsi}
        bezelSrc={`${import.meta.env.BASE_URL}assets/new_gauge.png`}
        cal={{ cx: 100, cy: 100, r: 60, margin: 2, debug: false }}
      />
      
      {/* Flow Stats */}
      <div className="mt-12 space-y-1 text-center text-sm">
        <div className="flex justify-between items-center px-4">
          <span className="text-xs opacity-60">GPM Now:</span>
          <span className="font-bold tabular-nums text-emerald-400">{Math.round(discharge.gpmNow)}</span>
        </div>
        <div className="flex justify-between items-center px-4">
          <span className="text-xs opacity-60">Gallons (this engagement):</span>
          <span className="font-bold tabular-nums">{discharge.gallonsThisEng.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Tip Selector */}
      {discharge.assignment.type === 'deck_gun' && (
        <div className="mt-3 bg-black/20 rounded-lg p-3 space-y-2">
          <label className="text-xs opacity-60">Tip Size (Smooth Bore)</label>
          <div className="flex gap-2">
            {[
              { value: '1_3/8' as const, label: '1⅜″' },
              { value: '1_1/2' as const, label: '1½″' },
              { value: '1_3/4' as const, label: '1¾″' },
            ].map(tip => (
              <button
                key={tip.value}
                onClick={() => updateTip(tip.value)}
                className={`flex-1 px-3 py-2 rounded font-semibold transition-all ${
                  discharge.assignment.type === 'deck_gun' && discharge.assignment.tip === tip.value
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                {tip.label}
              </button>
            ))}
          </div>
          <div className="text-xs opacity-60 text-center mt-2">
            Piped master stream (no supply hose)
          </div>
        </div>
      )}
      
      {/* Status Badge & Valve Position Display */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {discharge.open ? (
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-900/30 border border-green-700 text-green-300 text-xs font-semibold">
                ● FLOWING
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded bg-gray-700 border border-gray-600 text-gray-400 text-xs">
                ○ CLOSED
              </span>
            )}
          </span>
          <span className="text-lg font-mono text-white font-bold">
            {discharge.valvePercent}%
          </span>
        </div>
        
        {/* Enhanced Valve Lever Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Valve Position
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={discharge.valvePercent}
            onChange={(e) => handleSetPercent(parseInt(e.target.value, 10))}
            onKeyDown={(e) => {
              // Arrow keys for fine control
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                handleSetPercent(Math.max(0, discharge.valvePercent - 5))
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                handleSetPercent(Math.min(100, discharge.valvePercent + 5))
              } else if (e.key === 'Home') {
                e.preventDefault()
                handleSetPercent(0)
              } else if (e.key === 'End') {
                e.preventDefault()
                handleSetPercent(100)
              }
            }}
            aria-label={`${discharge.label} valve position`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={discharge.valvePercent}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-custom"
          />
          
          {/* Quick-set buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSetPercent(0)}
              className="flex-1 px-2 py-1 text-xs bg-red-900/30 border border-red-700 text-red-300 rounded hover:bg-red-900/50"
            >
              CLOSE
            </button>
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                onClick={() => handleSetPercent(pct)}
                className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded hover:bg-gray-600"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
        
        {/* Flow indicator (only shows when open) */}
        {discharge.open && discharge.gpmNow > 0 && (
          <div className="text-center py-2 bg-blue-900/30 border border-blue-700 rounded">
            <div className="text-2xl font-mono text-blue-300 font-bold">
              {Math.round(discharge.gpmNow)} GPM
            </div>
          </div>
        )}
      </div>
      
      {discharge.foamCapable && (
        <div className="mt-2 text-center text-xs text-pink-400 opacity-60">
          Foam Capable
        </div>
      )}
    </div>
  )
}

interface DischargeCardProps {
  discharge: Discharge
}

export function DischargeCard({ discharge }: DischargeCardProps) {
  const setLine = useStore(state => state.setLine)

  const handleSetPercent = (percent: number) => {
    setLine(discharge.id, { valvePercent: Math.max(0, Math.min(100, percent)) })
  }

  return (
    <div className="puc-card">
      {/* Gauge */}
      <LineAnalogGauge 
        label={discharge.label} 
        psi={discharge.displayPsi}
        bezelSrc={`${import.meta.env.BASE_URL}assets/new_gauge.png`}
        cal={{ cx: 100, cy: 100, r: 60, margin: 2, debug: false }}
      />
      
      {/* Flow Stats */}
      <div className="mt-12 space-y-1 text-center text-sm">
        <div className="flex justify-between items-center px-4">
          <span className="text-xs opacity-60">GPM Now:</span>
          <span className="font-bold tabular-nums text-emerald-400">{Math.round(discharge.gpmNow)}</span>
        </div>
        <div className="flex justify-between items-center px-4">
          <span className="text-xs opacity-60">Gallons (this engagement):</span>
          <span className="font-bold tabular-nums">{discharge.gallonsThisEng.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Assignment Selector */}
      <AssignmentSelector discharge={discharge} />
      
      {/* Status Badge & Valve Position Display */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">
            {discharge.open ? (
              <span className="inline-flex items-center px-2 py-1 rounded bg-green-900/30 border border-green-700 text-green-300 text-xs font-semibold">
                ● FLOWING
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-1 rounded bg-gray-700 border border-gray-600 text-gray-400 text-xs">
                ○ CLOSED
              </span>
            )}
          </span>
          <span className="text-lg font-mono text-white font-bold">
            {discharge.valvePercent}%
          </span>
        </div>
        
        {/* Enhanced Valve Lever Slider */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Valve Position
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={discharge.valvePercent}
            onChange={(e) => handleSetPercent(parseInt(e.target.value, 10))}
            onKeyDown={(e) => {
              // Arrow keys for fine control
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                handleSetPercent(Math.max(0, discharge.valvePercent - 5))
              } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                handleSetPercent(Math.min(100, discharge.valvePercent + 5))
              } else if (e.key === 'Home') {
                e.preventDefault()
                handleSetPercent(0)
              } else if (e.key === 'End') {
                e.preventDefault()
                handleSetPercent(100)
              }
            }}
            aria-label={`${discharge.label} valve position`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={discharge.valvePercent}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb-custom"
          />
          
          {/* Quick-set buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handleSetPercent(0)}
              className="flex-1 px-2 py-1 text-xs bg-red-900/30 border border-red-700 text-red-300 rounded hover:bg-red-900/50"
            >
              CLOSE
            </button>
            {[25, 50, 75, 100].map(pct => (
              <button
                key={pct}
                onClick={() => handleSetPercent(pct)}
                className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 text-gray-300 rounded hover:bg-gray-600"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
        
        {/* Flow indicator (only shows when open) */}
        {discharge.open && discharge.gpmNow > 0 && (
          <div className="text-center py-2 bg-blue-900/30 border border-blue-700 rounded">
            <div className="text-2xl font-mono text-blue-300 font-bold">
              {Math.round(discharge.gpmNow)} GPM
            </div>
          </div>
        )}
      </div>
      
      {discharge.foamCapable && (
        <div className="mt-2 text-center text-xs text-pink-400 opacity-60">
          Foam Capable
        </div>
      )}
    </div>
  )
}

export function TwoHalfMultiplexer() {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const discharges = useStore(state => state.discharges)
  
  const lineIds: Record<'A' | 'B' | 'C' | 'D', DischargeId> = {
    A: 'twohalfA',
    B: 'twohalfB',
    C: 'twohalfC',
    D: 'twohalfD',
  }
  
  const activeLine = discharges[lineIds[activeTab]]
  
  const tabs: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D']
  
  return (
    <div className="puc-card">
      {/* Tab Selector */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => {
            const idx = tabs.indexOf(activeTab)
            setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length])
          }}
          className="p-2 bg-white/10 hover:bg-white/20 rounded transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex-1 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => {
            const idx = tabs.indexOf(activeTab)
            setActiveTab(tabs[(idx + 1) % tabs.length])
          }}
          className="p-2 bg-white/10 hover:bg-white/20 rounded transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Active Line Card (without outer card wrapper) */}
      <DischargeCard discharge={activeLine} />
    </div>
  )
}

export function GovernorCard() {
  const governor = useStore(state => state.governor)
  const setGovernorMode = useStore(state => state.setGovernorMode)
  const setGovernorSetPsi = useStore(state => state.setGovernorSetPsi)
  const setGovernorSetRpm = useStore(state => state.setGovernorSetRpm)

  const handleModeSelect = (mode: 'pressure' | 'rpm') => {
    setGovernorMode(mode)
  }

  const handleSetToIdle = () => {
    if (governor.mode === 'rpm') {
      setGovernorSetRpm(750)
    }
  }

  return (
    <div className="puc-card">
      <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide uppercase mb-3 text-center opacity-80 drop-shadow-md">GOVERNOR</h3>
      
      {/* Mode Pills */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleModeSelect('pressure')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            governor.enabled && governor.mode === 'pressure'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          PRESSURE
        </button>
        <button
          onClick={() => handleModeSelect('rpm')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            governor.enabled && governor.mode === 'rpm'
              ? 'bg-emerald-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          RPM
        </button>
      </div>

      {/* Main Display Tile */}
      <div className="bg-black/30 rounded-lg p-4 mb-4">
        <div className="text-center">
          <div className="text-xs opacity-60 mb-1">
            {governor.mode === 'pressure' ? 'Set Pressure' : 'Set Engine RPM'}
          </div>
          <div className="text-4xl font-bold tabular-nums text-emerald-400">
            {governor.mode === 'pressure' ? governor.setPsi : governor.setRpm}
          </div>
          <div className="text-sm opacity-80 mt-1">
            {governor.mode === 'pressure' ? 'PSI' : 'RPM'}
          </div>
        </div>
      </div>

      {/* Setpoint Slider */}
      {governor.enabled && (
        <div className="mb-3">
          {governor.mode === 'pressure' ? (
            <>
              <label className="text-xs opacity-60">Set Pressure (PSI)</label>
              <input
                type="range"
                min="50"
                max="300"
                step="1"
                value={governor.setPsi}
                onChange={(e) => setGovernorSetPsi(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer mt-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
              />
            </>
          ) : (
            <>
              <label className="text-xs opacity-60">Set Engine RPM</label>
              <input
                type="range"
                min="750"
                max="2200"
                step="10"
                value={governor.setRpm}
                onChange={(e) => setGovernorSetRpm(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer mt-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
              />
              <div className="mt-2 flex justify-center">
                <button
                  onClick={handleSetToIdle}
                  className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-all"
                >
                  IDLE (750)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Info Note */}
      <div className="text-xs text-center opacity-60 mt-3 leading-relaxed">
        Lines receive a fraction of pump pressure based on valve opening.
      </div>

      {!governor.enabled && (
        <div className="text-xs text-center opacity-60 mt-2 p-2 bg-white/5 rounded">
          Select PRESSURE or RPM mode to enable governor
        </div>
      )}
    </div>
  )
}

export function IntakeCard() {
  const source = useStore(state => state.source)
  const masterIntake = useStore(state => state.gauges.masterIntake)
  const setSource = useStore(state => state.setSource)
  const setIntakePsi = useStore(state => state.setIntakePsi)
  const tankFillPct = useStore(state => state.tankFillPct)
  const setTankFillPct = useStore(state => state.setTankFillPct)
  const scenario = useStore(state => state.scenario)
  const scenarioHydrantClicked = useStore(state => state.scenarioHydrantClicked)

  const handleHydrantClick = () => {
    if (scenario.status === 'running') {
      // In scenario mode: check locks
      scenarioHydrantClicked()
    } else {
      // Normal mode: toggle directly
      setSource('hydrant')
    }
  }

  return (
    <div className="puc-card">
      <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide uppercase mb-3 text-center opacity-80 drop-shadow-md">SOURCE</h3>
      
      {/* Source Toggle */}
      <div className="flex flex-col gap-2 mb-4">
        <button
          onClick={() => setSource('tank')}
          className={`w-full px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
            source === 'tank'
              ? 'bg-sky-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Tank-to-Pump
        </button>
        <button
          onClick={handleHydrantClick}
          disabled={scenario.status === 'running' && !scenario.locks.hydrantSelectable}
          className={`w-full px-3 py-2 rounded-lg font-semibold transition-all text-sm ${
            source === 'hydrant'
              ? 'bg-sky-500 text-white'
              : scenario.status === 'running' && !scenario.locks.hydrantSelectable
              ? 'bg-white/5 text-white/30 cursor-not-allowed'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Hydrant
        </button>
      </div>
      
      {/* Hydrant Intake Control */}
      {source === 'hydrant' && (
        <div className="mb-4">
          <label className="text-xs opacity-60">Hydrant Intake PSI</label>
          <input
            type="range"
            min="0"
            max="200"
            step="5"
            value={masterIntake}
            onChange={(e) => setIntakePsi(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer mt-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sky-500"
          />
          <div className="text-center text-xl font-bold tabular-nums mt-2">
            {Math.round(masterIntake)} PSI
          </div>
          <div className="text-xs text-center opacity-60 mt-1">
            (Default: 50 PSI)
          </div>
        </div>
      )}
      
      {/* Tank Fill / Recirculate Slider */}
      {(source === 'tank' || source === 'hydrant') && (
        <div className="mb-4">
          <label className="text-xs opacity-60">Tank Fill / Recirculate</label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={tankFillPct}
            onChange={(e) => setTankFillPct(Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer mt-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
          />
          <div className="text-center text-lg font-bold tabular-nums mt-1">
            {tankFillPct}%
          </div>
          <div className="text-xs text-center opacity-60 mt-2 leading-relaxed">
            {source === 'tank' 
              ? 'Recirculates through pump to cool; does not change tank level.'
              : 'Fills tank; may reduce hydrant residual slightly if fully open.'}
          </div>
        </div>
      )}
      
      {source === 'tank' && (
        <div className="text-center text-sm opacity-60 py-4">
          Tank-to-Pump mode: Intake locked at 0 PSI
        </div>
      )}
      
      {source === 'none' && (
        <div className="text-center text-sm opacity-60 py-4 bg-red-500/10 rounded border border-red-500/30">
          <div className="font-semibold text-red-400 mb-1">NO SOURCE SELECTED</div>
          <div className="text-xs">Select Tank-to-Pump or Hydrant to supply water</div>
        </div>
      )}
    </div>
  )
}

export function LevelsCard() {
  const waterGal = useStore(state => state.gauges.waterGal)
  const foamGal = useStore(state => state.gauges.foamGal)
  const foamEnabled = useStore(state => state.foamEnabled)
  const waterCap = useStore(state => state.capacities.water)
  const foamCap = useStore(state => state.capacities.foam)

  const waterPct = (waterGal / waterCap) * 100
  const foamPct = (foamGal / foamCap) * 100
  
  // Level thresholds
  const LEVEL_YELLOW = 0.66  // >66% green
  const LEVEL_RED = 0.33     // 33-66% yellow, <33% red
  
  const waterFill = waterGal / waterCap
  const foamFill = foamGal / foamCap
  
  const waterColor = waterFill > LEVEL_YELLOW ? 'bg-emerald-500'
                   : waterFill > LEVEL_RED ? 'bg-amber-400'
                   : 'bg-red-500'
  
  const foamColor = foamFill > LEVEL_YELLOW ? 'bg-emerald-500'
                  : foamFill > LEVEL_RED ? 'bg-amber-400'
                  : 'bg-red-500'

  return (
    <div className="puc-card">
      <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide uppercase mb-3 text-center opacity-80 drop-shadow-md">LEVELS</h3>
      
      {/* Water */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-sky-400">Water</span>
          <span className="tabular-nums">{Math.round(waterGal)} / {waterCap} gal</span>
        </div>
        <div className="h-6 bg-white/10 rounded-full overflow-hidden border border-white/20">
          <div 
            className={`h-full ${waterColor} transition-all shadow-inner`}
            style={{ width: `${waterPct}%` }}
          />
        </div>
      </div>
      
      {/* Foam (only if enabled) */}
      {foamEnabled && (
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-pink-400">Foam</span>
            <span className="tabular-nums">{Math.round(foamGal)} / {foamCap} gal</span>
          </div>
          <div className="h-6 bg-white/10 rounded-full overflow-hidden border border-white/20">
            <div 
              className={`h-full ${foamColor} transition-all shadow-inner`}
              style={{ width: `${foamPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export function PumpDataCard() {
  const totals = useStore(state => state.totals)
  const discharges = useStore(state => state.discharges)
  
  return (
    <div className="puc-card">
      <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide uppercase mb-3 text-center opacity-80 drop-shadow-md">PUMP DATA</h3>
      
      {/* Total Flow Summary */}
      <div className="space-y-3 mb-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-xs opacity-60 text-center mb-1">TOTAL GPM Now</div>
          <div className="text-2xl font-bold text-center tabular-nums text-emerald-400">
            {Math.round(totals.gpmTotalNow)}
          </div>
        </div>
        <div>
          <div className="text-xs opacity-60 text-center mb-1">TOTAL Gallons (this engagement)</div>
          <div className="text-xl font-bold text-center tabular-nums">
            {totals.gallonsPumpThisEng.toFixed(1)}
          </div>
        </div>
      </div>
      
      {/* Per-Line FL Metrics */}
      <div className="space-y-3">
        {Object.entries(discharges).map(([id, discharge]) => {
          if (!discharge.open || discharge.gpmNow === 0) return null
          
          // Calculate friction loss using the new FL system
          const flMode = discharge.hoseConfig.flMode
          const flValue = getEffectiveFLValue(discharge)
          
          const flResult: FrictionLossResult = computeLineFrictionLoss({
            gpm: discharge.gpmNow,
            lengthFt: discharge.hoseConfig.lengthFt,
            mode: flMode === 'preset' ? 'psi_per100' : 'coefficient',
            value: flMode === 'preset' 
              ? flValue
              : flValue
          })
          
          // Calculate PDP based on assignment type
          let nozzlePressure = 0
          let elevationPsi = 0
          
          if (discharge.assignment.type === 'handline_175_fog') {
            nozzlePressure = 100 // 75 NP + 25 appliance approximation
          } else if (discharge.assignment.type === 'fdc_standpipe') {
            nozzlePressure = 100
            elevationPsi = discharge.assignment.floors * 5
          } else if (discharge.assignment.type === 'blitzfire') {
            nozzlePressure = discharge.assignment.mode === 'std100' ? 100 : 55
          } else if (discharge.assignment.type === 'deck_gun') {
            nozzlePressure = 80
          }
          
          const pdp = nozzlePressure + flResult.totalPsi + elevationPsi
          
          return (
            <div key={id} className="bg-gray-800 rounded p-3 space-y-1">
              <div className="font-semibold text-white">{discharge.label}</div>
              
              {/* Hose Configuration */}
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Hose:</span> {discharge.hoseConfig.diameter}″ × {discharge.hoseConfig.lengthFt}′
              </div>
              
              {/* Current Flow */}
              <div className="text-sm">
                <span className="text-gray-400">Flow:</span>{' '}
                <span className="text-blue-300 font-mono">{Math.round(discharge.gpmNow)} GPM</span>
              </div>
              
              {/* Friction Loss - HIGHLIGHTED */}
              <div className="bg-blue-900/30 border border-blue-700 rounded px-2 py-1 space-y-0.5">
                <div className="text-xs">
                  <span className="text-blue-300 font-semibold">FL Rate:</span>{' '}
                  <span className="text-blue-200 font-mono">{flResult.psiPer100.toFixed(1)} psi/100′</span>
                  {discharge.hoseConfig.flOverride && (
                    <span className="text-blue-400 text-xs ml-1">●</span>
                  )}
                </div>
                <div className="text-xs">
                  <span className="text-blue-300 font-semibold">FL Total:</span>{' '}
                  <span className="text-blue-200 font-mono">{flResult.totalPsi.toFixed(1)} psi</span>
                </div>
              </div>
              
              {/* Nozzle Pressure */}
              {nozzlePressure > 0 && (
                <div className="text-sm">
                  <span className="text-gray-400">Nozzle:</span>{' '}
                  <span className="text-green-300 font-mono">{nozzlePressure} psi</span>
                </div>
              )}
              
              {/* Elevation if applicable */}
              {elevationPsi > 0 && (
                <div className="text-sm">
                  <span className="text-gray-400">Elevation:</span>{' '}
                  <span className="text-amber-300 font-mono">{elevationPsi.toFixed(1)} psi</span>
                </div>
              )}
              
              {/* Pump Discharge Pressure (PDP) */}
              <div className="text-sm font-semibold">
                <span className="text-gray-400">PDP:</span>{' '}
                <span className="text-orange-300 font-mono">
                  {Math.round(pdp)} psi
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Info Footer */}
      <div className="mt-4 text-xs text-center opacity-60">
        <p>Pierce PUC</p>
        <p>Manual Mode</p>
      </div>
      
      {/* Helper Text */}
      {Object.values(discharges).some(d => d.open && d.gpmNow > 0) && (
        <div className="text-xs text-gray-500 mt-3 p-2 bg-gray-900/50 rounded leading-relaxed">
          <strong>FL Rate:</strong> Friction loss per 100 feet of hose<br />
          <strong>FL Total:</strong> Total friction loss for the entire line<br />
          <strong>● indicator:</strong> Custom override applied
        </div>
      )}
    </div>
  )
}

export function InfoCard() {
  return (
    <div className="puc-card">
      <h3 className="text-sm font-semibold mb-2 text-center opacity-80">MISC</h3>
      <div className="text-xs text-center opacity-60">
        <p>Pierce PUC</p>
        <p>Manual Mode</p>
      </div>
    </div>
  )
}