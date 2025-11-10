import { useScenarioAdmin } from '../store';
import { EvolutionTable } from './EvolutionTable';
import type { IncidentType } from '../types';

interface Props {
  scenarioId: string;
}

export function ScenarioEditor({ scenarioId }: Props) {
  const { scenarios, updateScenario } = useScenarioAdmin();
  const scenario = scenarios.find((s) => s.id === scenarioId);

  if (!scenario) {
    return <div className="p-6">Scenario not found</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Scenario Details</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scenario Name *
            </label>
            <input
              type="text"
              value={scenario.name}
              onChange={(e) => updateScenario(scenarioId, { name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Initial Attack - Crosslay 200′"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Designation *
              </label>
              <input
                type="text"
                value={scenario.unitDesignation}
                onChange={(e) =>
                  updateScenario(scenarioId, { unitDesignation: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Engine 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type *
              </label>
              <select
                value={scenario.incidentType}
                onChange={(e) =>
                  updateScenario(scenarioId, {
                    incidentType: e.target.value as IncidentType,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="structure">Structure Fire</option>
                <option value="vehicle">Vehicle Fire</option>
                <option value="wildland">Wildland Fire</option>
                <option value="standby">Standby/Coverage</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Evolutions</h2>
        <EvolutionTable scenarioId={scenarioId} evolutions={scenario.evolutions} />
      </div>
    </div>
  );
}