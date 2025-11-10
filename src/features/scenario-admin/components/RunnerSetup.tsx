import { Play, ChevronLeft } from 'lucide-react';
import { useScenarioAdmin } from '../store';
import { getIncidentTypeLabel } from '../utils';
import { useLauncher } from '../../../state/launcher';

export function RunnerSetup() {
  const { scenarios, startRun } = useScenarioAdmin();
  const { setMode } = useLauncher();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <button
        onClick={() => setMode('scenarios')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Admin
      </button>

      <div className="max-w-4xl w-full">
        <h1 className="text-3xl font-bold text-white mb-2">Scenario Runner</h1>
        <p className="text-gray-400 mb-8">Select a scenario to begin training</p>

        {scenarios.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No scenarios available</p>
            <button
              onClick={() => setMode('scenarios')}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Your First Scenario
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {scenario.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                      <span>{scenario.unitDesignation}</span>
                      <span>•</span>
                      <span>{getIncidentTypeLabel(scenario.incidentType)}</span>
                      <span>•</span>
                      <span>{scenario.evolutions.length} evolutions</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {scenario.evolutions.map((evo, i) => (
                        <span
                          key={evo.id}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-xs"
                        >
                          {i + 1}. {evo.kind.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => startRun(scenario.id)}
                    className="ml-6 flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 min-h-[48px]"
                  >
                    <Play className="w-5 h-5" />
                    Start
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}