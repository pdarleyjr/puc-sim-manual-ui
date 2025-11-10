import { Settings, Wrench, ClipboardList } from 'lucide-react'
import { useSettings } from './store'
import { BackButton } from './components/BackButton'

// Import subsection components (to be created)
import { EquipmentConfigRoute } from './sections/EquipmentConfigRoute'
import { ScenarioBuilderRoute } from './sections/ScenarioBuilderRoute'

export function SettingsRoute() {
  const { currentSection, setSection } = useSettings()
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subsection Navigation */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="max-w-7xl mx-auto">
          <nav className="flex gap-1 -mb-px">
            <button
              onClick={() => setSection('equipment')}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm
                transition-colors duration-200 touch-target-min
                ${currentSection === 'equipment'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              style={{ minHeight: '48px' }}
            >
              <Wrench className="h-5 w-5" />
              Equipment Configuration
            </button>
            
            <button
              onClick={() => setSection('scenarios')}
              className={`
                flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm
                transition-colors duration-200 touch-target-min
                ${currentSection === 'scenarios'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              style={{ minHeight: '48px' }}
            >
              <ClipboardList className="h-5 w-5" />
              Scenario Builder
            </button>
          </nav>
        </div>
      </div>
      
      {/* Subsection Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4">
          {currentSection === 'equipment' && <EquipmentConfigRoute />}
          {currentSection === 'scenarios' && <ScenarioBuilderRoute />}
        </div>
      </div>
    </div>
  )
}