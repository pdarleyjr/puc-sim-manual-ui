import { useMemo } from 'react'
import { useHydrantLab } from '../../../features/hydrant-lab/store'
import { TWO_FIVE_EVOS } from '../../../state/evolutions'
import { getEvo, computeEvolutionAtValve } from '../../../state/evoMath'
import MonitorOutputMeter from '../../../components/hydrant/MonitorOutputMeter'

export default function HydrantDischarge() {
  const bench = useHydrantLab(s => s.dischargeBench)
  const setBench = useHydrantLab(s => s.setDischargeBench)
  const engineIntakePsi = useHydrantLab(s => s.engineIntakePsi)
  const governorPsi = useHydrantLab(s => s.governorPsi)
  const hydrantResidualPsi = useHydrantLab(s => s.hydrantResidualPsi)
  const totalInflowGpm = useHydrantLab(s => s.totalInflowGpm)
  
  const evo = useMemo(() => getEvo(bench.evolutionId) ?? TWO_FIVE_EVOS[0], [bench.evolutionId])
  
  // Calculate available PDP based on intake pressure and governor
  // Keep a safety margin to avoid cavitation
  const availablePdp = useMemo(() => {
    const intakeFloor = 10 // minimum intake pressure to avoid cavitation
    const pdpFromIntake = Math.max(0, engineIntakePsi - intakeFloor)
    return Math.min(governorPsi, pdpFromIntake + 50) // Add pump's contribution
  }, [engineIntakePsi, governorPsi])
  
  // Compute evolution performance at current settings
  const result = useMemo(() => 
    computeEvolutionAtValve(evo, bench.gatePercent, availablePdp),
    [evo, bench.gatePercent, availablePdp]
  )
  
  // Determine limiting factors
  const limitFactors = useMemo(() => {
    const factors: string[] = []
    
    if (result.requiredPdp > availablePdp) {
      if (engineIntakePsi < 15) {
        factors.push('Low intake pressure')
      }
      if (governorPsi < result.requiredPdp) {
        factors.push('Governor limit')
      }
    }
    
    if (hydrantResidualPsi < 25) {
      factors.push('Hydrant residual low')
    }
    
    if (result.flow > totalInflowGpm && totalInflowGpm > 0) {
      factors.push('Supply flow limited')
    }
    
    return factors
  }, [result, availablePdp, engineIntakePsi, governorPsi, hydrantResidualPsi, totalInflowGpm])
  
  return (
    <div className="h-full p-3 overflow-y-auto flex flex-col gap-3">
      {/* Evolution Selector */}
      <div className="rounded-xl bg-[#1a2332] border border-[#2a3340] p-3">
        <div className="text-xs opacity-70 mb-2">Evolution Package</div>
        <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto">
          {TWO_FIVE_EVOS.map(e => (
            <button
              key={e.id}
              onClick={() => setBench({ evolutionId: e.id })}
              className={`
                py-2 px-2 text-xs rounded-lg transition-colors text-left
                ${bench.evolutionId === e.id
                  ? 'bg-teal-500/20 text-teal-300 border-2 border-teal-500/50'
                  : 'bg-[#0b1220] text-slate-300 border border-[#2a3340] hover:bg-[#17202b]'
                }
              `}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Gate Control */}
      <div className="rounded-xl bg-[#1a2332] border border-[#2a3340] p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs opacity-70">Discharge Gate</div>
          <div className="font-mono text-lg text-teal-400">{bench.gatePercent}%</div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={bench.gatePercent}
          onChange={e => setBench({ gatePercent: Number(e.target.value) })}
          className="w-full h-3 bg-[#0b1220] rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #14b8a6 0%, #14b8a6 ${bench.gatePercent}%, #0b1220 ${bench.gatePercent}%, #0b1220 100%)`
          }}
        />
        <div className="flex justify-between mt-2 text-[10px] opacity-60">
          <span>Closed</span>
          <span>Full Open</span>
        </div>
      </div>
      
      {/* Visual Output Meter */}
      <div className="rounded-xl bg-[#0b1220] border border-[#2a3340] p-4">
        <div className="mb-3">
          <MonitorOutputMeter 
            flowNowGpm={Math.round(result.flow)} 
            truckMaxGpm={Math.max(Math.round(result.flow), Math.round(totalInflowGpm))}
            residualPsi={hydrantResidualPsi}
          />
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm font-mono">
          <div>
            <div className="text-[10px] opacity-60 mb-1">Actual Flow</div>
            <div className="text-xl font-bold text-teal-400">
              {Math.round(result.flow)}
              <span className="text-xs ml-1 opacity-70">gpm</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-60 mb-1">Available PDP</div>
            <div className="text-xl font-bold text-teal-400">
              {Math.round(availablePdp)}
              <span className="text-xs ml-1 opacity-70">psi</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-60 mb-1">Required PDP</div>
            <div className={`text-lg font-bold ${result.requiredPdp > availablePdp ? 'text-amber-400' : 'text-slate-300'}`}>
              {Math.round(result.requiredPdp)}
              <span className="text-xs ml-1 opacity-70">psi</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-60 mb-1">Engine Intake</div>
            <div className={`text-lg font-bold ${engineIntakePsi < 15 ? 'text-amber-400' : 'text-slate-300'}`}>
              {Math.round(engineIntakePsi)}
              <span className="text-xs ml-1 opacity-70">psi</span>
            </div>
          </div>
        </div>
        
        {/* Pressure Breakdown */}
        <div className="mt-3 pt-3 border-t border-[#2a3340]">
          <div className="text-[10px] opacity-60 mb-2">Pressure Breakdown</div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="opacity-60">Hose FL</div>
              <div className="font-mono text-slate-300">{Math.round(result.fl)} psi</div>
            </div>
            <div>
              <div className="opacity-60">Nozzle NP</div>
              <div className="font-mono text-slate-300">{Math.round(result.np)} psi</div>
            </div>
            <div>
              <div className="opacity-60">Appliance</div>
              <div className="font-mono text-slate-300">{Math.round(result.appl)} psi</div>
            </div>
          </div>
          <div className="mt-2 text-[10px] opacity-60">
            {evo.hose.dia}″ hose × {evo.hose.lengthFt}ft
          </div>
        </div>
        
        {/* Limit Warning */}
        {limitFactors.length > 0 && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="text-xs font-medium text-amber-300 mb-1">
              ⚠️ Performance Limited
            </div>
            <div className="text-[11px] text-amber-200/80">
              {limitFactors.join(' • ')}
            </div>
            <div className="text-[10px] text-amber-200/60 mt-2">
              Add supply legs, enable HAV boost, or reduce tip size
            </div>
          </div>
        )}
        
        {/* Supply Status */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-[#1a2332] rounded">
            <div className="opacity-60 text-[10px]">Supply Flow</div>
            <div className="font-mono text-slate-300">{Math.round(totalInflowGpm)} gpm</div>
          </div>
          <div className="p-2 bg-[#1a2332] rounded">
            <div className="opacity-60 text-[10px]">Hydrant Residual</div>
            <div className={`font-mono ${hydrantResidualPsi < 25 ? 'text-amber-400' : 'text-slate-300'}`}>
              {Math.round(hydrantResidualPsi)} psi
            </div>
          </div>
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="rounded-xl bg-[#1a2332] border border-[#2a3340] p-3">
        <div className="text-xs font-medium mb-2">💡 Testing Tips</div>
        <ul className="text-[11px] space-y-1 opacity-80">
          <li>• Add supply legs in Ports tab to increase intake pressure</li>
          <li>• Enable HAV boost mode for extra pressure gain</li>
          <li>• Larger tips require more PDP - watch for governor limits</li>
          <li>• Keep hydrant residual above 20 psi for sustained operations</li>
        </ul>
      </div>
    </div>
  )
}