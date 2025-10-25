import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Gauge, Radio, Droplets, Droplet, AlertTriangle } from 'lucide-react'
import { useLauncher, type LauncherMode } from '../../state/launcher'
import type { ScenarioId } from '../../state/store'

interface ModeCardProps {
  mode: LauncherMode
  icon: React.ReactNode
  title: string
  description: string
  selected: boolean
  onSelect: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
}

function ModeCard({ mode, icon, title, description, selected, onSelect, inputRef }: ModeCardProps) {
  return (
    <label 
      className={`
        relative block cursor-pointer rounded-2xl border-2 p-6 transition-all
        ${selected 
          ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20' 
          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }
        focus-within:ring-4 focus-within:ring-emerald-500/50
      `}
    >
      <input
        ref={inputRef}
        type="radio"
        name="mode"
        value={mode || ''}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
        aria-describedby={`${mode}-desc`}
      />
      
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors
          ${selected ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/60'}`}
        >
          {icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold mb-1">{title}</h3>
          <p id={`${mode}-desc`} className="text-sm opacity-70 leading-relaxed">
            {description}
          </p>
        </div>
        
        {selected && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white" />
          </div>
        )}
      </div>
    </label>
  )
}

export function ModeLauncher({ onEnter }: { onEnter: (mode: LauncherMode, scenario?: ScenarioId) => void }) {
  const [step, setStep] = useState<1 | 2>(1)
  const [rememberPreference, setRememberPreference] = useState(false)
  
  const chosenMode = useLauncher(state => state.chosenMode)
  const chosenScenario = useLauncher(state => state.chosenScenario)
  const setMode = useLauncher(state => state.setMode)
  const setScenario = useLauncher(state => state.setScenario)
  const loadPreference = useLauncher(state => state.loadPreference)
  const savePreference = useLauncher(state => state.savePreference)
  
  const panelRef = useRef<HTMLInputElement>(null)
  const scenarioRef = useRef<HTMLInputElement>(null)
  const foamRef = useRef<HTMLInputElement>(null)
  const hydrantLabRef = useRef<HTMLInputElement>(null)
  
  // Load saved preference on mount
  useEffect(() => {
    loadPreference()
  }, [loadPreference])
  
  // Keyboard navigation for radio group
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (step !== 1) return
      
      const modes: LauncherMode[] = ['panel', 'scenario', 'foam', 'hydrant_lab']
      const refs = [panelRef, scenarioRef, foamRef, hydrantLabRef]
      const currentIndex = modes.indexOf(chosenMode)
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % modes.length
        setMode(modes[nextIndex])
        refs[nextIndex].current?.focus()
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        const prevIndex = (currentIndex - 1 + modes.length) % modes.length
        setMode(modes[prevIndex])
        refs[prevIndex].current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [chosenMode, setMode, step])
  
  const handleNext = () => {
    if (chosenMode === 'scenario') {
      setStep(2)
    } else {
      handleEnter()
    }
  }
  
  const handleEnter = () => {
    if (!chosenMode) return
    
    // Save preference if checkbox is checked
    if (rememberPreference) {
      savePreference(chosenMode)
    }
    
    onEnter(chosenMode, chosenMode === 'scenario' ? chosenScenario : undefined)
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-2xl w-full">
        {/* Stepper (only visible on step 2) */}
        {step === 2 && (
          <div className="mb-8 flex items-center justify-center gap-2 text-sm">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">1</span>
              <span className="opacity-70">Mode</span>
            </button>
            <ChevronRight size={16} className="opacity-40" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
              <span className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">2</span>
              <span className="font-semibold">Scenario</span>
            </div>
          </div>
        )}
        
        {/* Step 1: Mode Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">What do you want to practice today?</h1>
              <p className="text-sm opacity-60">Pick one mode. You can switch any time.</p>
            </div>
            
            <div role="radiogroup" aria-labelledby="mode-label" className="space-y-4">
              <p id="mode-label" className="sr-only">Choose a mode</p>
              
              <ModeCard
                mode="panel"
                icon={<Gauge size={24} />}
                title="Panel Only"
                description="Manual pump operations with live gauges. No scripted events."
                selected={chosenMode === 'panel'}
                onSelect={() => setMode('panel')}
                inputRef={panelRef}
              />
              
              <ModeCard
                mode="scenario"
                icon={<Radio size={24} />}
                title="Scenario Mode"
                description="Scripted radio traffic & deadlines while you run the panel."
                selected={chosenMode === 'scenario'}
                onSelect={() => setMode('scenario')}
                inputRef={scenarioRef}
              />
              
              <ModeCard
                mode="foam"
                icon={<Droplets size={24} />}
                title="Foam System"
                description="Operate foam-capable discharges; foam levels and refills."
                selected={chosenMode === 'foam'}
                onSelect={() => setMode('foam')}
                inputRef={foamRef}
              />
              
              <ModeCard
                mode="hydrant_lab"
                icon={<Droplet size={24} />}
                title="Hydrant Connection Lab"
                description="Practice hydrant hookup: single/double/triple tap, 3″ or 5″ supply, HAV boost. Includes troubleshooting scenarios."
                selected={chosenMode === 'hydrant_lab'}
                onSelect={() => setMode('hydrant_lab')}
                inputRef={hydrantLabRef}
              />
            </div>
            
            {/* Preference checkbox */}
            <div className="pt-4 border-t border-white/10">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberPreference}
                  onChange={(e) => setRememberPreference(e.target.checked)}
                  className="w-5 h-5 rounded bg-white/10 border-white/20 checked:bg-emerald-500 checked:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
                />
                <span className="text-sm opacity-70 group-hover:opacity-100 transition-opacity">
                  Always start with {
                    chosenMode === 'panel' ? 'Panel Only' : 
                    chosenMode === 'scenario' ? 'Scenario Mode' : 
                    chosenMode === 'foam' ? 'Foam System' :
                    chosenMode === 'hydrant_lab' ? 'Hydrant Connection Lab' :
                    'this mode'
                  } on this device
                </span>
              </label>
            </div>
            
            {/* Next button */}
            <button
              onClick={handleNext}
              disabled={!chosenMode}
              className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2"
            >
              Next
              <ChevronRight size={20} />
            </button>
          </div>
        )}
        
        {/* Step 2: Scenario Selection */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Choose Your Scenario</h1>
              <p className="text-sm opacity-60">Select the training scenario to practice</p>
            </div>
            
            <div className="puc-card p-6">
              <label className="block text-sm font-semibold opacity-70 mb-3">Scenario</label>
              <select
                value={chosenScenario}
                onChange={(e) => setScenario(e.target.value as ScenarioId)}
                className="w-full px-4 py-3 bg-white/10 rounded-lg border border-white/20 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all"
              >
                <option value="residential_one_xlay" className="bg-gray-900">
                  Single-story residential (one crosslay)
                </option>
                <option value="residential_with_exposure" className="bg-gray-900">
                  Single-story residential with exposure
                </option>
              </select>
              
              <p className="mt-4 text-xs opacity-60 leading-relaxed">
                Scenario Mode includes scripted radio traffic, timed objectives, and tactical decisions. 
                The scenario will begin when you engage the pump.
              </p>
            </div>
            
            {/* Enter Panel button */}
            <button
              onClick={handleEnter}
              className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold text-lg transition-all"
            >
              Enter Panel
            </button>
            
            <button
              onClick={() => setStep(1)}
              className="w-full px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-all"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}