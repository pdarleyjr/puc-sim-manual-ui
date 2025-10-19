import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useStore } from '../state/store'
import { StatusBar } from './StatusBar'
import { SettingsModal } from './SettingsModal'
import { AfterActionModal } from './AfterActionModal'
import { AnalogGauge } from './Gauges'
import { DischargeCard, IntakeCard, LevelsCard, PumpDataCard, GovernorCard, TwoHalfMultiplexer, DeckGunCard } from './Cards'
import { ScenarioHud } from './ScenarioHud'
import { useEngineAudio } from '../audio/useEngineAudio'
import { useState } from 'react'

function WarningBanner() {
  const warnings = useStore(state => state.warnings)
  const ackWarning = useStore(state => state.ackWarning)
  
  if (warnings.length === 0) return null
  
  return (
    <div className="bg-red-600 border-b border-red-700 px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-white font-bold text-sm flex items-center gap-2">
            <span className="animate-pulse">⚠️</span>
            {warnings[0]}
          </div>
        </div>
        <button
          onClick={() => ackWarning(warnings[0])}
          className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-white text-xs font-semibold transition-all"
        >
          <X size={14} />
          CLEAR
        </button>
      </div>
    </div>
  )
}

export function Panel() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [afterActionOpen, setAfterActionOpen] = useState(false)
  
  const pumpEngaged = useStore(state => state.pumpEngaged)
  const discharges = useStore(state => state.discharges)
  const gauges = useStore(state => state.gauges)
  const compactMode = useStore(state => state.uiPrefs.compactMode)
  const disengagePump = useStore(state => state.disengagePump)
  const tickRpm = useStore(state => state.tickRpm)
  const simTick = useStore(state => state.simTick)
  const scenario = useStore(state => state.scenario)

  // Engine audio hook
  useEngineAudio()

  // RPM tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      tickRpm()
    }, 100)
    return () => clearInterval(interval)
  }, [tickRpm])

  // Simulation tick interval (10 Hz)
  useEffect(() => {
    const interval = setInterval(() => {
      simTick()
    }, 100)
    return () => clearInterval(interval)
  }, [simTick])

  // Reset counters on window unload
  useEffect(() => {
    const handleUnload = () => {
      disengagePump()
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [disengagePump])

  // Check if in scenario mode
  const isScenarioMode = scenario.status !== 'idle'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Status Bar */}
      <StatusBar 
        onOpenSettings={() => setSettingsOpen(true)} 
        onOpenAfterAction={() => setAfterActionOpen(true)}
      />
      
      {/* Scenario HUD - shown when pump engaged and scenario active */}
      {pumpEngaged && isScenarioMode && <ScenarioHud />}
      
      {/* Warning Banner */}
      <WarningBanner />

      {/* Main Content */}
      <div className="flex-1 p-3 sm:p-6">
        {!pumpEngaged ? (
          /* Engage Screen - now simplified since launcher handles mode selection */
          <div className="flex items-center justify-center h-full">
            <div id="engage-card" className="puc-card max-w-md w-full text-center p-8">
              <h2 className="text-2xl font-bold mb-6">ENGAGE PUMP</h2>
              <p className="text-sm opacity-60 mb-8">
                Select pump mode to begin manual operation
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => useStore.getState().engagePump('water')}
                  className="w-full px-6 py-4 bg-sky-500 hover:bg-sky-600 rounded-lg font-bold text-lg transition-all"
                >
                  Water Pump
                </button>
                
                <button
                  onClick={() => useStore.getState().engagePump('foam')}
                  className="w-full px-6 py-4 bg-pink-500 hover:bg-pink-600 rounded-lg font-bold text-lg transition-all"
                >
                  Foam System
                </button>
              </div>

              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <p className="text-xs opacity-60">
                  Manual operation only. Driver controls all valves, pressures, and throttle.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Main Panel Screen */
          <div className="flex flex-col lg:grid lg:grid-cols-12 lg:auto-rows-min gap-3 sm:gap-4 lg:gap-6 w-full">
            {/* Left Column - Status & Source */}
            <section className="order-1 lg:order-none lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="puc-card">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold tracking-wide uppercase mb-3 text-center opacity-80 drop-shadow-md">STATUS</h3>
                
                <div className="space-y-2">
                  <div className={`p-3 rounded-lg text-center ${
                    pumpEngaged ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5'
                  }`}>
                    <div className="text-xs opacity-60">Water Pump</div>
                    <div className="font-bold text-sm">
                      {pumpEngaged ? 'ENGAGED' : 'OFF'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg text-center ${
                    pumpEngaged ? 'bg-emerald-500/20 border border-emerald-500/50' : 'bg-white/5'
                  }`}>
                    <div className="text-xs opacity-60">OK to Pump & Roll</div>
                    <div className="font-bold text-sm">
                      {pumpEngaged ? 'READY' : 'OFF'}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg text-center ${
                    useStore.getState().foamEnabled ? 'bg-pink-500/20 border border-pink-500/50' : 'bg-white/5'
                  }`}>
                    <div className="text-xs opacity-60">Foam System</div>
                    <div className="font-bold text-sm">
                      {useStore.getState().foamEnabled ? 'ACTIVE' : 'OFF'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div id="source-card">
                <IntakeCard />
              </div>
            </section>

            {/* Center - Master Gauges & Discharges */}
            <section className="order-4 lg:order-none lg:col-span-8 space-y-4 sm:space-y-6">
              {/* Master Gauges */}
              <div id="master-gauges" className="puc-card">
                <h3 className="text-sm font-semibold mb-4 text-center opacity-80">MASTER GAUGES</h3>
                <div className="flex flex-wrap justify-around items-center gap-4">
                  <AnalogGauge
                    label="INTAKE"
                    value={gauges.masterIntake}
                    min={-10}
                    max={200}
                    unit="PSI"
                  />
                  <AnalogGauge
                    label="DISCHARGE"
                    value={gauges.masterDischarge}
                    min={0}
                    max={400}
                    unit="PSI"
                    redline={350}
                  />
                  <AnalogGauge
                    label="ENGINE"
                    value={gauges.rpm}
                    min={0}
                    max={2200}
                    unit="RPM"
                  />
                </div>
              </div>

              {/* Discharge Cards Grid */}
              <div>
                <h3 className="text-sm font-semibold mb-3 opacity-80">DISCHARGES</h3>
                <div id="discharges-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <DischargeCard discharge={discharges.xlay1} />
                  <DischargeCard discharge={discharges.xlay2} />
                  <DischargeCard discharge={discharges.xlay3} />
                  <DischargeCard discharge={discharges.trashline} />
                  <TwoHalfMultiplexer />
                  <DeckGunCard />
                </div>
              </div>
            </section>

            {/* Right Column - Governor, Levels, Pump Data */}
            <section className={`lg:col-span-2 space-y-3 sm:space-y-4 ${compactMode ? 'hidden lg:block' : ''}`}>
              <div id="governor-card" className="order-2 lg:order-none">
                <GovernorCard />
              </div>
              <div id="levels-card" className="order-3 lg:order-none">
                <LevelsCard />
              </div>
              <div className="order-5 lg:order-none">
                <PumpDataCard />
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {/* After-Action Modal */}
      <AfterActionModal isOpen={afterActionOpen} onClose={() => setAfterActionOpen(false)} />
    </div>
  )
}