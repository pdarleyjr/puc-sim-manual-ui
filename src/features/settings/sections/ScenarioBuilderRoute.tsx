import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { ScenarioList } from '../../scenario-admin/components/ScenarioList'
import { ScenarioEditor } from '../../scenario-admin/components/ScenarioEditor'

type View = 'list' | 'edit' | 'create'

export function ScenarioBuilderRoute() {
  const [view, setView] = useState<View>('list')
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null)
  
  const handleEdit = (id: string) => {
    setSelectedScenarioId(id)
    setView('edit')
  }
  
  const handleCreate = () => {
    setSelectedScenarioId(null)
    setView('create')
  }
  
  const handleBack = () => {
    setView('list')
    setSelectedScenarioId(null)
  }
  
  return (
    <div className="space-y-6">
      {view === 'list' && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Scenario Library</h3>
              <p className="text-sm text-gray-600 mt-1">
                Create and edit training scenarios. Built-in scenarios can be duplicated for customization.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              style={{ minHeight: '44px' }}
            >
              Create Scenario
            </button>
          </div>
          
          <ScenarioList
            onEdit={handleEdit}
            showRunButton={false}
          />
        </div>
      )}
      
      {view === 'edit' && selectedScenarioId && (
        <div>
          <button
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            style={{ minHeight: '44px' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </button>
          
          <ScenarioEditor scenarioId={selectedScenarioId} />
        </div>
      )}
      
      {view === 'create' && (
        <div>
          <button
            onClick={handleBack}
            className="mb-4 inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            style={{ minHeight: '44px' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to List
          </button>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Scenario</h3>
            <p className="text-gray-600">
              Use the "New Scenario" button in the list to create a new scenario, then edit it here.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}