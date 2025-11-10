import { useState } from 'react'
import type { FlexibleDischargeConfig, NozzleKind } from '../types'

interface EquipmentSelectorProps {
  onAdd: (config: FlexibleDischargeConfig) => void
  onCancel: () => void
}

export function EquipmentSelector({ onAdd, onCancel }: EquipmentSelectorProps) {
  const [hoseDiameter, setHoseDiameter] = useState<1.75 | 2.5 | 3.0 | 4.0 | 5.0>(2.5)
  const [hoseLengthFt, setHoseLengthFt] = useState<number>(200)
  const [nozzleKind, setNozzleKind] = useState<NozzleKind | 'none'>('fog_fixed')
  const [nozzleGPM, setNozzleGPM] = useState<number>(250)
  const [nozzleNP, setNozzleNP] = useState<number>(100)
  const [tipDiameter, setTipDiameter] = useState<number>(1.125)
  
  const [hasMonitor, setHasMonitor] = useState(false)
  const [hasWye, setHasWye] = useState(false)
  const [elevationFt, setElevationFt] = useState<number>(0)
  
  const handleAdd = () => {
    onAdd({
      hoseDiameter,
      hoseLengthFt,
      nozzleKind: nozzleKind === 'none' ? undefined : nozzleKind,
      nozzleSpecs: nozzleKind === 'smooth_bore' 
        ? { tipDiameterIn: tipDiameter, ratedNPpsi: nozzleNP }
        : nozzleKind !== 'none'
        ? { ratedGPM: nozzleGPM, ratedNPpsi: nozzleNP }
        : undefined,
      appliances: {
        monitor: hasMonitor,
        wye: hasWye,
        elevationFt
      }
    })
  }
  
  // Generate warnings for unusual configurations
  const warnings: string[] = []
  if (hoseDiameter === 5.0 && nozzleKind === 'smooth_bore' && tipDiameter < 1.0) {
    warnings.push('Unusual: 5" hose with small smooth bore tip')
  }
  if (hoseDiameter === 1.75 && nozzleGPM > 300) {
    warnings.push('High flow for 1.75" hose - expect high friction loss')
  }
  if (hoseLengthFt > 400 && hoseDiameter < 3.0) {
    warnings.push('Long hose run with small diameter - high friction loss expected')
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 z-10">
          <h2 className="text-2xl font-bold text-gray-900">Add Equipment Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Mix any hose, nozzle, and appliance combination for experimental testing
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Hose Configuration */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-gray-900">Hose Configuration</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Diameter (inches)
                </label>
                <select
                  value={hoseDiameter}
                  onChange={(e) => setHoseDiameter(parseFloat(e.target.value) as 1.75 | 2.5 | 3.0 | 4.0 | 5.0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  style={{ minHeight: '48px' }}
                >
                  <option value="1.75">1.75"</option>
                  <option value="2.5">2.5"</option>
                  <option value="3.0">3"</option>
                  <option value="4.0">4"</option>
                  <option value="5.0">5"</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Length (feet)
                </label>
                <input
                  type="number"
                  value={hoseLengthFt}
                  onChange={(e) => setHoseLengthFt(parseInt(e.target.value) || 0)}
                  min="0"
                  max="1000"
                  step="50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  style={{ minHeight: '48px' }}
                />
              </div>
            </div>
          </div>
          
          {/* Nozzle Configuration */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-gray-900">Nozzle Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Nozzle Type
                </label>
                <select
                  value={nozzleKind}
                  onChange={(e) => setNozzleKind(e.target.value as NozzleKind | 'none')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  style={{ minHeight: '48px' }}
                >
                  <option value="none">None (Supply Line)</option>
                  <option value="smooth_bore">Smooth Bore</option>
                  <option value="fog_fixed">Fixed Fog</option>
                  <option value="fog_selectable">Selectable Fog</option>
                  <option value="fog_automatic">Automatic Fog</option>
                  <option value="monitor">Monitor</option>
                  <option value="master_stream">Master Stream</option>
                </select>
              </div>
              
              {nozzleKind === 'smooth_bore' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Tip Diameter (inches)
                    </label>
                    <input
                      type="number"
                      value={tipDiameter}
                      onChange={(e) => setTipDiameter(parseFloat(e.target.value) || 0)}
                      step="0.0625"
                      min="0.5"
                      max="2.0"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      style={{ minHeight: '48px' }}
                    />
                    <p className="text-xs text-gray-600 mt-1">Common: 0.875, 1.125, 1.5</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Nozzle Pressure (PSI)
                    </label>
                    <input
                      type="number"
                      value={nozzleNP}
                      onChange={(e) => setNozzleNP(parseInt(e.target.value) || 0)}
                      min="20"
                      max="150"
                      step="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      style={{ minHeight: '48px' }}
                    />
                    <p className="text-xs text-gray-600 mt-1">Standard: 50 PSI</p>
                  </div>
                </div>
              )}
              
              {nozzleKind !== 'none' && nozzleKind !== 'smooth_bore' && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Flow Rate (GPM)
                    </label>
                    <input
                      type="number"
                      value={nozzleGPM}
                      onChange={(e) => setNozzleGPM(parseInt(e.target.value) || 0)}
                      min="50"
                      max="2000"
                      step="25"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      style={{ minHeight: '48px' }}
                    />
                    <p className="text-xs text-gray-600 mt-1">Typical: 150-500 GPM</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Nozzle Pressure (PSI)
                    </label>
                    <input
                      type="number"
                      value={nozzleNP}
                      onChange={(e) => setNozzleNP(parseInt(e.target.value) || 0)}
                      min="20"
                      max="150"
                      step="10"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      style={{ minHeight: '48px' }}
                    />
                    <p className="text-xs text-gray-600 mt-1">Standard: 100 PSI</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Appliances & Options */}
          <div>
            <h3 className="font-semibold text-lg mb-3 text-gray-900">Appliances & Options</h3>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={hasMonitor}
                  onChange={(e) => setHasMonitor(e.target.checked)}
                  className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Include Monitor</span>
                  <p className="text-xs text-gray-600">+25 PSI appliance loss</p>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={hasWye}
                  onChange={(e) => setHasWye(e.target.checked)}
                  className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Include Wye</span>
                  <p className="text-xs text-gray-600">+10 PSI appliance loss</p>
                </div>
              </label>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Elevation Gain (feet)
                </label>
                <input
                  type="number"
                  value={elevationFt}
                  onChange={(e) => setElevationFt(parseInt(e.target.value) || 0)}
                  min="-100"
                  max="500"
                  step="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  style={{ minHeight: '48px' }}
                />
                <p className="text-xs text-gray-600 mt-1">0.434 PSI per foot of elevation</p>
              </div>
            </div>
          </div>
          
          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600 text-lg">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900 mb-1">Configuration Warnings</p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    {warnings.map((warning, i) => (
                      <li key={i}>• {warning}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-yellow-700 mt-2">
                    These configurations are allowed for experimental testing
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Sticky Actions */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition-colors"
            style={{ minHeight: '48px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm"
            style={{ minHeight: '48px' }}
          >
            Add Configuration
          </button>
        </div>
      </div>
    </div>
  )
}