import { useState, useEffect } from 'react';
import { useScenarioAdmin } from './store';
import { ScenarioList } from './components/ScenarioList';
import { RunnerActive } from './components/RunnerActive';
import { RunnerSetup } from './components/RunnerSetup';
import { BackButton } from '../settings/components/BackButton';

type View = 'list' | 'run';

export function ScenariosRoute() {
  const [view, setView] = useState<View>('list');
  
  const { loadScenarios, isLoading, setActiveScenario, runningScenarioId } = useScenarioAdmin();
  
  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);
  
  // Handle run navigation
  const handleRun = (id: string) => {
    setActiveScenario(id);
    setView('run');
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-xl text-gray-600">Loading scenarios...</div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          {view === 'list' && <BackButton />}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {view === 'list' && 'Scenarios'}
              {view === 'run' && 'Run Scenario'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {view === 'list' && 'Select a training scenario to run'}
              {view === 'run' && 'Execute Training Evolution'}
            </p>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <ScenarioList 
                onRun={handleRun}
                showEditButton={false}
              />
            </div>
          </div>
        )}
        
        {view === 'run' && (
          <div className="h-full bg-gray-900">
            {!runningScenarioId ? <RunnerSetup /> : <RunnerActive />}
          </div>
        )}
      </div>
    </div>
  );
}