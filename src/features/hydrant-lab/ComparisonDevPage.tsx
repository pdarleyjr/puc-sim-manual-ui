/**
 * ComparisonDevPage - Development Tool for CalcEngineV2 Integration
 * 
 * Displays side-by-side comparison of V1 (math.ts) vs V2 (calcEngineV2) results.
 * Only renders in development mode (import.meta.env.DEV).
 * 
 * Features:
 * - Real-time comparison of both engines
 * - Color-coded differences (>1% red, <1% yellow)
 * - Copy state button for debugging
 * - Key metrics: intake PSI, inflow GPM, friction losses
 */

import { useHydrantLab } from './store'
import { solveHydrantSystem } from './math'
import { solveHydrantSystemV2, computeDischargesV2 } from '../../engine/calcEngineV2Adapter'

function ComparisonDevPage() {
  // Don't render in production
  if (!import.meta.env.DEV) {
    return null
  }
  
  const state = useHydrantLab()
  
  // Run both engines
  const v1Supply = solveHydrantSystem(state)
  const v2Supply = solveHydrantSystemV2(state)
  
  const v1Discharge = computeDischargesV2(
    state.dischargeLines,
    state.pumpDischargePressurePsi,
    v1Supply.totalInflowGpm,
    v1Supply.engineIntakePsi,
    state.governorPsi
  )
  
  const v2Discharge = computeDischargesV2(
    state.dischargeLines,
    state.pumpDischargePressurePsi,
    v2Supply.totalInflowGpm,
    v2Supply.engineIntakePsi,
    state.governorPsi
  )
  
  // Calculate percent differences
  const calculateDiff = (v1: number, v2: number): { percent: number; color: string } => {
    if (v1 === 0 && v2 === 0) return { percent: 0, color: 'text-green-600' }
    if (v1 === 0) return { percent: 100, color: 'text-red-600' }
    
    const diff = Math.abs(v2 - v1)
    const percent = (diff / Math.abs(v1)) * 100
    
    if (percent > 1) return { percent, color: 'text-red-600 font-bold' }
    if (percent > 0.5) return { percent, color: 'text-yellow-600' }
    return { percent, color: 'text-green-600' }
  }
  
  const intakeDiff = calculateDiff(v1Supply.engineIntakePsi, v2Supply.engineIntakePsi)
  const inflowDiff = calculateDiff(v1Supply.totalInflowGpm, v2Supply.totalInflowGpm)
  const residualDiff = calculateDiff(v1Supply.hydrantResidualPsi, v2Supply.hydrantResidualPsi)
  const demandDiff = calculateDiff(v1Discharge.totalDemand, v2Discharge.totalDemand)
  const flowDiff = calculateDiff(v1Discharge.totalFlow, v2Discharge.totalFlow)
  
  const copyStateToClipboard = () => {
    const stateSnapshot = {
      staticPsi: state.staticPsi,
      legs: state.legs,
      hav: state.hav,
      governorPsi: state.governorPsi,
      dischargeLines: state.dischargeLines.map(line => ({
        hoseDiameterIn: line.hoseDiameterIn,
        hoseLengthFt: line.hoseLengthFt,
        nozzleType: line.nozzleType,
        gateOpen: line.gateOpen
      })),
      pumpDischargePressurePsi: state.pumpDischargePressurePsi,
      v1Results: { supply: v1Supply, discharge: v1Discharge },
      v2Results: { supply: v2Supply, discharge: v2Discharge }
    }
    
    navigator.clipboard.writeText(JSON.stringify(stateSnapshot, null, 2))
    alert('State copied to clipboard!')
  }
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 overflow-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Engine Comparison (DEV MODE)</h1>
              <p className="text-sm text-gray-600 mt-1">
                V1 (math.ts iterative solver) vs V2 (calcEngineV2 pure functions)
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyStateToClipboard}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                📋 Copy State
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
        
        {/* Supply Side Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Supply Side (Hydrant → Pump Intake)</h2>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-4 font-semibold">Metric</th>
                <th className="text-right py-2 px-4 font-semibold">V1 (math.ts)</th>
                <th className="text-right py-2 px-4 font-semibold">V2 (calcEngineV2)</th>
                <th className="text-right py-2 px-4 font-semibold">Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">Engine Intake (PSI)</td>
                <td className="text-right py-2 px-4 font-mono">{v1Supply.engineIntakePsi.toFixed(1)}</td>
                <td className="text-right py-2 px-4 font-mono">{v2Supply.engineIntakePsi.toFixed(1)}</td>
                <td className={`text-right py-2 px-4 font-mono ${intakeDiff.color}`}>
                  {intakeDiff.percent.toFixed(2)}%
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">Total Inflow (GPM)</td>
                <td className="text-right py-2 px-4 font-mono">{v1Supply.totalInflowGpm}</td>
                <td className="text-right py-2 px-4 font-mono">{v2Supply.totalInflowGpm}</td>
                <td className={`text-right py-2 px-4 font-mono ${inflowDiff.color}`}>
                  {inflowDiff.percent.toFixed(2)}%
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">Hydrant Residual (PSI)</td>
                <td className="text-right py-2 px-4 font-mono">{v1Supply.hydrantResidualPsi.toFixed(1)}</td>
                <td className="text-right py-2 px-4 font-mono">{v2Supply.hydrantResidualPsi.toFixed(1)}</td>
                <td className={`text-right py-2 px-4 font-mono ${residualDiff.color}`}>
                  {residualDiff.percent.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Discharge Side Comparison */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Discharge Side (Pump → Nozzles)</h2>
          
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-4 font-semibold">Metric</th>
                <th className="text-right py-2 px-4 font-semibold">V1</th>
                <th className="text-right py-2 px-4 font-semibold">V2</th>
                <th className="text-right py-2 px-4 font-semibold">Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">Total Demand (GPM)</td>
                <td className="text-right py-2 px-4 font-mono">{v1Discharge.totalDemand}</td>
                <td className="text-right py-2 px-4 font-mono">{v2Discharge.totalDemand}</td>
                <td className={`text-right py-2 px-4 font-mono ${demandDiff.color}`}>
                  {demandDiff.percent.toFixed(2)}%
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">Actual Flow (GPM)</td>
                <td className="text-right py-2 px-4 font-mono">{v1Discharge.totalFlow}</td>
                <td className="text-right py-2 px-4 font-mono">{v2Discharge.totalFlow}</td>
                <td className={`text-right py-2 px-4 font-mono ${flowDiff.color}`}>
                  {flowDiff.percent.toFixed(2)}%
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">Cavitating</td>
                <td className="text-right py-2 px-4">{v1Discharge.cavitating ? '⚠️ YES' : '✅ No'}</td>
                <td className="text-right py-2 px-4">{v2Discharge.cavitating ? '⚠️ YES' : '✅ No'}</td>
                <td className="text-right py-2 px-4">
                  {v1Discharge.cavitating === v2Discharge.cavitating ? '✅ Match' : '❌ Differ'}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4">Governor Limited</td>
                <td className="text-right py-2 px-4">{v1Discharge.governorLimited ? '⚠️ YES' : '✅ No'}</td>
                <td className="text-right py-2 px-4">{v2Discharge.governorLimited ? '⚠️ YES' : '✅ No'}</td>
                <td className="text-right py-2 px-4">
                  {v1Discharge.governorLimited === v2Discharge.governorLimited ? '✅ Match' : '❌ Differ'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Configuration Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Configuration</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Supply Legs</h3>
              <ul className="text-sm space-y-1">
                {Object.entries(state.legs).map(([id, leg]) => (
                  leg && (
                    <li key={id} className="text-gray-600">
                      {id}: {leg.sizeIn}" × {leg.lengthFt}ft
                      {leg.gateOpen !== undefined && ` (${leg.gateOpen ? 'OPEN' : 'CLOSED'})`}
                    </li>
                  )
                ))}
              </ul>
              
              <h3 className="font-semibold text-gray-700 mt-4 mb-2">HAV</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Enabled: {state.hav.enabled ? 'YES' : 'No'}</li>
                {state.hav.enabled && (
                  <>
                    <li>Mode: {state.hav.mode.toUpperCase()}</li>
                    {state.hav.mode === 'boost' && <li>Boost: {state.hav.boostPsi} PSI</li>}
                  </>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Discharge Lines</h3>
              {state.dischargeLines.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No discharge lines configured</p>
              ) : (
                <ul className="text-sm space-y-1">
                  {state.dischargeLines.map(line => (
                    <li key={line.id} className="text-gray-600">
                      {line.hoseDiameterIn}" × {line.hoseLengthFt}ft - {line.nozzleType}
                      {line.gateOpen ? ' (OPEN)' : ' (CLOSED)'}
                    </li>
                  ))}
                </ul>
              )}
              
              <h3 className="font-semibold text-gray-700 mt-4 mb-2">System</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>Static: {state.staticPsi} PSI</li>
                <li>PDP: {state.pumpDischargePressurePsi} PSI</li>
                <li>Governor: {state.governorPsi} PSI</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="bg-gray-100 rounded-lg p-4 mt-4">
          <h3 className="font-semibold text-gray-700 mb-2">Color Legend</h3>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-600 rounded"></span>
              <span>≤0.5% difference (excellent)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-600 rounded"></span>
              <span>0.5-1% difference (good)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-600 rounded"></span>
              <span>&gt;1% difference (needs attention)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ComparisonDevPage