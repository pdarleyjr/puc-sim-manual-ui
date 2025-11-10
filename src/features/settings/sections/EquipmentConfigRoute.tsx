import { useState } from 'react'
import { useEquipmentConfig } from '../../equipment-config/store'
import type { DischargeId } from '../../equipment-config/types'

export function EquipmentConfigRoute() {
  const { defaults, resetDefaults, exportJSON } = useEquipmentConfig()
  const [activeTab, setActiveTab] = useState<'discharges' | 'nozzles' | 'hose'>('discharges')
  
  if (!defaults) {
    return <div>Loading equipment configuration...</div>
  }
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex gap-1 px-4">
            {[
              { id: 'discharges', label: 'Discharge Defaults' },
              { id: 'nozzles', label: 'Nozzle Library' },
              { id: 'hose', label: 'Hose Library' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-4 py-3 font-medium text-sm border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }
                `}
                style={{ minHeight: '48px' }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'discharges' && (
            <DischargeDefaultsTab defaults={defaults} />
          )}
          {activeTab === 'nozzles' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Nozzle Library</h3>
              <p className="text-gray-600 mb-4">
                Manage nozzle presets for all discharge types. Nozzle configurations 
                include flow ratings, nozzle pressure, and tip diameters for smooth-bore nozzles.
              </p>
              {/* TODO: Integrate existing nozzle profiles UI here */}
              <div className="text-sm text-gray-500 italic">
                Nozzle library UI will be integrated from existing nozzle-profiles feature
              </div>
            </div>
          )}
          {activeTab === 'hose' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Hose Library</h3>
              <p className="text-gray-600 mb-4">
                Manage hose configurations including diameter, length presets, and friction loss coefficients.
              </p>
              <div className="text-sm text-gray-500 italic">
                Hose library will reference data/hose_fl_presets.json
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={async () => {
            const json = await exportJSON()
            const blob = new Blob([json], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `equipment-config-${Date.now()}.json`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          style={{ minHeight: '44px' }}
        >
          Export Configuration
        </button>
        
        <button
          onClick={() => {
            if (confirm('Reset all equipment to factory defaults?')) {
              resetDefaults()
            }
          }}
          className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50"
          style={{ minHeight: '44px' }}
        >
          Reset to Factory Defaults
        </button>
      </div>
    </div>
  )
}

// Discharge defaults table
function DischargeDefaultsTab({ defaults }: any) {
  const dischargeIds: DischargeId[] = ['xlay1', 'xlay2', 'xlay3', 'trashline', 'twohalfA', 'twohalfB', 'twohalfC', 'twohalfD']
  
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Discharge Defaults</h3>
      <p className="text-gray-600 mb-4">
        Configure default hose and nozzle specifications for each discharge. These defaults 
        are used throughout the simulator in pump operations, scenarios, and hydrant lab.
      </p>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discharge</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hose</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nozzle</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dischargeIds.map(id => {
              const discharge = defaults.discharges[id]
              if (!discharge) return null
              
              return (
                <tr key={id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{discharge.label}</div>
                    <div className="text-sm text-gray-500">{discharge.category}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {discharge.hose.lengthFt}ft × {discharge.hose.diameter}"
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {discharge.nozzle ? (
                      <>
                        {discharge.nozzle.kind === 'smooth_bore' 
                          ? `${discharge.nozzle.tipDiameterIn}" tip @ ${discharge.nozzle.ratedNPpsi} PSI`
                          : `${discharge.nozzle.ratedGPM} GPM @ ${discharge.nozzle.ratedNPpsi} PSI`
                        }
                      </>
                    ) : (
                      <span className="text-gray-400 italic">No nozzle (FDC)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => {
                        // TODO: Open edit modal
                        console.log('Edit', id)
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}