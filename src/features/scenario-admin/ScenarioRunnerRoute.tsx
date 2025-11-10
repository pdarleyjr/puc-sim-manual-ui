import { useEffect } from 'react';
import { useScenarioAdmin } from './store';
import { RunnerSetup } from './components/RunnerSetup';
import { RunnerActive } from './components/RunnerActive';

export function ScenarioRunnerRoute() {
  const { loadScenarios, runningScenarioId } = useScenarioAdmin();

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {!runningScenarioId ? <RunnerSetup /> : <RunnerActive />}
    </div>
  );
}