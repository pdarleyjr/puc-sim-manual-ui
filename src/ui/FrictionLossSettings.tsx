import { useStore } from '../state/store'
import hoseFLPresets from '../../data/hose_fl_presets.json'

interface PresetInfo {
  name: string
  diameter_inches: number
  default_psi_per_100ft: number
  coefficient: number
  reference_gpm: number
  notes: string
  source: string
}

interface Presets {
  [key: string]: PresetInfo
}

const presets = hoseFLPresets.presets as Presets

/**
 * Friction Loss Settings UI Component
 * Allows users to override per-100' friction loss values for each discharge line type.
 * Changes apply in real-time to all active calculations.
 * 
 * References:
 * - Key Hose product specifications (Combat Ready, Big-10)
 * - Task Force Tips friction loss formula: FL = C × (Q/100)² × (L/100)
 */
export function FrictionLossSettings() {
  const { discharges, setLine } = useStore()
  
  // Group discharges by type and diameter
  const lineTypes = [
    {
      name: '1¾″ Crosslays',
      diameter: 1.75,
      ids: ['xlay1', 'xlay2', 'xlay3'] as const,
      defaultPresetId: 'key_combat_ready_175'
    },
    {
      name: '1¾″ Trash Line',
      diameter: 1.75,
      ids: ['trashline'] as const,
      defaultPresetId: 'key_combat_ready_175'
    },
    {
      name: '2½″ Attack Lines',
      diameter: 2.5,
      ids: ['twohalfA', 'twohalfB', 'twohalfC', 'twohalfD'] as const,
      defaultPresetId: 'key_big10_25_low'
    }
  ]
  
  const handleOverride = (
    lineIds: readonly string[],
    mode: 'preset' | 'coefficient',
    value: number | null
  ) => {
    lineIds.forEach(id => {
      const discharge = discharges[id as keyof typeof discharges]
      if (!discharge) return
      
      setLine(id as any, {
        hoseConfig: {
          ...discharge.hoseConfig,
          flMode: mode,
          flOverride: value !== null
            ? mode === 'preset'
              ? { psiPer100: value }
              : { coefficient: value }
            : undefined
        }
      })
    })
  }
  
  const handleReset = (lineIds: readonly string[]) => {
    handleOverride(lineIds, 'preset', null)
  }
  
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-700 pb-2">
        <h3 className="text-lg font-semibold text-white">Friction Loss Configuration</h3>
        <p className="text-sm text-gray-400 mt-1">
          Customize friction loss values for your department's hose. Changes apply immediately.
        </p>
      </div>
      
      {lineTypes.map(lineType => {
        const firstDischarge = discharges[lineType.ids[0] as keyof typeof discharges]
        const preset = presets[lineType.defaultPresetId]
        const currentValue = firstDischarge?.hoseConfig?.flOverride?.psiPer100
        const isOverridden = currentValue !== undefined
        
        return (
          <div key={lineType.name} className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white">{lineType.name}</h4>
                <p className="text-xs text-gray-400">{preset.name}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-400">Default</div>
                <div className="text-white font-mono">
                  {preset.default_psi_per_100ft} psi/100'
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm text-gray-300">
                Custom Friction Loss (psi/100')
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={isOverridden ? currentValue : preset.default_psi_per_100ft}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (!isNaN(val) && val >= 0) {
                      handleOverride(lineType.ids, 'preset', val)
                    }
                  }}
                  className={`flex-1 px-3 py-2 bg-gray-700 border rounded text-white font-mono ${
                    isOverridden ? 'border-blue-500' : 'border-gray-600'
                  }`}
                  placeholder={preset.default_psi_per_100ft.toString()}
                />
                <button
                  onClick={() => handleReset(lineType.ids)}
                  disabled={!isOverridden}
                  className={`px-4 py-2 rounded font-medium transition ${
                    isOverridden
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Reset
                </button>
              </div>
              {isOverridden && (
                <p className="text-xs text-blue-400">
                  ✓ Override applied ({currentValue} psi/100')
                </p>
              )}
            </div>
            
            <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
              <strong>Spec:</strong> {preset.notes}<br />
              <strong>Reference:</strong> {preset.reference_gpm} GPM @ {preset.coefficient} coefficient<br />
              <strong>Source:</strong> {preset.source}
            </div>
          </div>
        )
      })}
      
      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-300 mb-2">Formula Reference</h4>
        <div className="text-xs text-gray-300 space-y-1 font-mono">
          <div>FL = C × (Q/100)² × (L/100)</div>
          <div className="text-gray-400">
            Where: C = coefficient, Q = GPM, L = length (ft)
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Source: <a 
            href="https://tft.com/hydraulic-calculations-every-firefighter-needs-to-know/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Task Force Tips - Hydraulic Calculations
          </a>
        </p>
      </div>
    </div>
  )
}