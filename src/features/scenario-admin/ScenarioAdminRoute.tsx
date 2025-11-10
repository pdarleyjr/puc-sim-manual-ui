import { useEffect } from 'react';
import { useScenarioAdmin } from './store';
import { ScenarioList } from './components/ScenarioList';
import { ScenarioEditor } from './components/ScenarioEditor';

export function ScenarioAdminRoute() {
  const { loadScenarios, activeScenarioId, isLoading } = useScenarioAdmin();

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading scenarios...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Scenario Admin</h1>
        <p className="text-sm text-gray-600 mt-1">
          NFPA-1410 Training Scenario Builder
        </p>
      </header>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-96 border-r border-gray-200 bg-white overflow-y-auto">
          <ScenarioList />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {activeScenarioId ? (
            <ScenarioEditor scenarioId={activeScenarioId} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Select a scenario or create a new one
            </div>
          )}
        </div>
      </div>
    </div>
  );
}