import { useEffect, useState } from 'react'
import { useStore } from '../state/store'
import { StatusBar } from './StatusBar'
import { SettingsModal } from './SettingsModal'
import { AnalogGauge } from './Gauges'
import { DischargeCard, IntakeCard, LevelsCard, InfoCard } from './Cards'
import { useEngineAudio } from '../audio/useEngineAudio'

export function Panel() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  
  const pumpEngaged = useStore(state => state.pumpEngaged)
  const foamEnabled = useStore(state => state.foamEnabled)
  const discharges = useStore(state => state.discharges)
  const gauges = useStore(state => state.gauges)
  const engagePump = useStore(state => state.engagePump)
  const tickRpm = useStore(state => state.tickRpm)

  // Engine audio hook
  useEngineAudio()

  // RPM tick interval
  useEffect(() => {
    const interval = setInterval(() => {
      tickRpm()
    }, 100)
    return () => clearInterval(interval)
  }, [tickRpm])

  const handleEngageWater = () => {
    engagePump('water')
  }

  const handleEngageFoam = () => {
    engagePump('foam')
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Status Bar */}
      <StatusBar onOpenSettings={() => setSettingsOpen(true)} />

      {/* Main Content */}
      <div className="flex-1 p-6">
        {!pumpEngaged ? (
          /* Engage Screen */
          <div className="flex items-center justify-center h-full">
            <div className="puc-card max-w-md w-full text-center p-8">
              <h2 className="text-2xl font-bold mb-6">ENGAGE PUMP</h2>
              <p className="text-sm opacity-60 mb-8">
                Select pump mode to begin manual operation
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleEngageWater}
                  className="w-full px-6 py-4 bg-sky-500 hover:bg-sky-600 rounded-lg font-bold text-lg transition-all"
                >
                  Water Pump
                </button>
                
                <button
                  onClick={handleEngageFoam}
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
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Engage Indicators */}
            <div className="col-span-2 space-y-4">
              <div className="puc-card">
                <h3 className="text-sm font-semibold mb-3 text-center opacity-80">STATUS</h3>
                
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
                    foamEnabled ? 'bg-pink-500/20 border border-pink-500/50' : 'bg-white/5'
                  }`}>
                    <div className="text-xs opacity-60">Foam System</div>
                    <div className="font-bold text-sm">
                      {foamEnabled ? 'ACTIVE' : 'OFF'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Center - Master Gauges & Discharges */}
            <div className="col-span-8 space-y-6">
              {/* Master Gauges */}
              <div className="puc-card">
                <h3 className="text-sm font-semibold mb-4 text-center opacity-80">MASTER GAUGES</h3>
                <div className="flex justify-around items-center">
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
                <div className="grid grid-cols-3 gap-4">
                  <DischargeCard discharge={discharges.xlay1} />
                  <DischargeCard discharge={discharges.xlay2} />
                  <DischargeCard discharge={discharges.xlay3} />
                  <DischargeCard discharge={discharges.trashline} />
                  <DischargeCard discharge={discharges.twohalfA} />
                </div>
              </div>
            </div>

            {/* Right Column - Supply & Levels */}
            <div className="col-span-2 space-y-4">
              <IntakeCard />
              <LevelsCard />
              <InfoCard />
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}