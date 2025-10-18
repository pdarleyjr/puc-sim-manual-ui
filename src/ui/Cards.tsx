import { LineAnalogGauge } from './Gauges'
import type { Discharge } from '../state/store'
import { useStore } from '../state/store'

interface DischargeCardProps {
  discharge: Discharge
}

export function DischargeCard({ discharge }: DischargeCardProps) {
  const setLine = useStore(state => state.setLine)
  const governor = useStore(state => state.governor)
  const source = useStore(state => state.source)
  const masterIntake = useStore(state => state.gauges.masterIntake)
  
  // Compute system pressure to show actual line pressure
  const IDLE_PUMP_DELTA_PSI = 50
  const P_base = source === 'tank' ? IDLE_PUMP_DELTA_PSI : masterIntake + IDLE_PUMP_DELTA_PSI
  let P_system = P_base
  if (governor.enabled) {
    if (governor.mode === 'pressure') {
      P_system = Math.min(400, Math.max(governor.setPsi, P_base))
    }
  }
  
  const displayPsi = discharge.open ? (discharge.valvePercent / 100) * P_system : 0

  const handleToggle = () => {
    setLine(discharge.id, { open: !discharge.open })
  }

  const handleSetPercent = (percent: number) => {
    setLine(discharge.id, { valvePercent: Math.max(0, Math.min(100, percent)) })
  }

  const quicksets = [50, 75, 100]

  return (
    <div className="puc-card">
      {/* Gauge */}
      <LineAnalogGauge label={discharge.label} psi={displayPsi} />
      
      {/* Flow Stats */}
      <div className="mt-3 space-y-1 text-center text-sm">
        <div className="flex justify-between items-center px-4">
          <span className="text-xs opacity-60">GPM Now:</span>
          <span className="font-bold tabular-nums text-emerald-400">{Math.round(discharge.gpmNow)}</span>
        </div>
        <div className="flex justify-between items-center px-4">
          <span className="text-xs opacity-60">Gallons (this engagement):</span>
          <span className="font-bold tabular-nums">{discharge.gallonsThisEng.toFixed(1)}</span>
        </div>
      </div>
      
      {/* Open/Closed Toggle */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          onClick={handleToggle}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${
            discharge.open 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          {discharge.open ? 'OPEN' : 'CLOSED'}
        </button>
      </div>
      
      {/* Valve % Open Slider */}
      <div className="mt-3">
        <label className="text-xs opacity-60">Valve % Open</label>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={discharge.valvePercent}
          onChange={(e) => handleSetPercent(Number(e.target.value))}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500"
        />
        <div className="text-center text-lg font-bold tabular-nums mt-1">
          {discharge.valvePercent}%
        </div>
      </div>
      
      {/* Quickset buttons */}
      <div className="mt-2 flex gap-2 justify-center">
        {quicksets.map(pct => (
          <button
            key={pct}
            onClick={() => handleSetPercent(pct)}
            className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-all"
          >
            {pct}%
          </button>
        ))}
      </div>
      
      {discharge.foamCapable && (
        <div className="mt-2 text-center text-xs text-pink-400 opacity-60">
          Foam Capable
        </div>
      )}
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
      <h3 className="text-sm font-semibold mb-3 text-center opacity-80">GOVERNOR</h3>
      
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

  return (
    <div className="puc-card">
      <h3 className="text-sm font-semibold mb-3 text-center opacity-80">SOURCE</h3>
      
      {/* Source Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSource('tank')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            source === 'tank'
              ? 'bg-sky-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Tank
        </button>
        <button
          onClick={() => setSource('hydrant')}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
            source === 'hydrant'
              ? 'bg-sky-500 text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Hydrant
        </button>
      </div>
      
      {/* Hydrant Intake Control */}
      {source === 'hydrant' && (
        <div>
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
      
      {source === 'tank' && (
        <div className="text-center text-sm opacity-60 py-4">
          Tank mode: Intake locked at 0 PSI
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

  return (
    <div className="puc-card">
      <h3 className="text-sm font-semibold mb-3 text-center opacity-80">LEVELS</h3>
      
      {/* Water */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-sky-400">Water</span>
          <span className="tabular-nums">{Math.round(waterGal)} / {waterCap} gal</span>
        </div>
        <div className="h-6 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-sky-400 transition-all"
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
          <div className="h-6 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-pink-400 transition-all"
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
  
  return (
    <div className="puc-card">
      <h3 className="text-sm font-semibold mb-3 text-center opacity-80">PUMP DATA</h3>
      <div className="space-y-3">
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
      <div className="mt-4 text-xs text-center opacity-60">
        <p>Pierce PUC</p>
        <p>Manual Mode</p>
      </div>
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