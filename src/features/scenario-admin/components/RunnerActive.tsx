import { useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useScenarioAdmin } from '../store';
import { useStore } from '../../../state/store';
import { formatTime, getEvoKindLabel } from '../utils';

export function RunnerActive() {
  const {
    scenarios,
    runningScenarioId,
    currentEvoIndex,
    timerRunning,
    elapsedTime,
    stopRun,
    nextEvolution,
    prevEvolution,
    startTimer,
    stopTimer,
    tick,
  } = useScenarioAdmin();

  const { pumpEngaged, gauges } = useStore();

  const scenario = scenarios.find(s => s.id === runningScenarioId);
  const currentEvo = scenario?.evolutions[currentEvoIndex];

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, tick]);

  if (!scenario || !currentEvo) {
    return <div className="flex items-center justify-center h-screen text-white">Loading...</div>;
  }

  const timeRemaining = currentEvo.timeLimitSec - elapsedTime;
  const progress = (elapsedTime / currentEvo.timeLimitSec) * 100;
  const isLastEvo = currentEvoIndex === scenario.evolutions.length - 1;

  // Mock PDP/GPM (in real impl, pull from pump state)
  const currentPDP = pumpEngaged ? gauges.masterDischarge : 0;
  const currentGPM = pumpEngaged ? 350 : 0;
  const currentResidual = pumpEngaged ? gauges.masterIntake : 0;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{scenario.name}</h1>
            <p className="text-sm text-gray-400 mt-1">
              Evolution {currentEvoIndex + 1} of {scenario.evolutions.length}
            </p>
          </div>
          <button
            onClick={stopRun}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <X className="w-4 h-4" />
            End Run
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full space-y-6">
          {/* Evolution Info */}
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              {getEvoKindLabel(currentEvo.kind)}
            </h2>
            {currentEvo.label && (
              <p className="text-gray-400 mb-4">{currentEvo.label}</p>
            )}
          </div>

          {/* Timer */}
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="text-center mb-4">
              <div className={`text-6xl font-mono font-bold ${
                timeRemaining < 30 ? 'text-red-500' : 'text-white'
              }`}>
                {formatTime(Math.max(0, timeRemaining))}
              </div>
              <p className="text-gray-400 mt-2">Time Remaining</p>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all ${
                  progress > 80 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={timerRunning ? stopTimer : startTimer}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg min-h-[56px]"
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-6 h-6" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live HUD */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white">{currentPDP.toFixed(0)}</div>
              <div className="text-sm text-gray-400 mt-1">PDP (psi)</div>
              {currentEvo.hiddenGoals?.targetPDPpsi && (
                <div className="text-xs text-gray-500 mt-1">
                  Target: {currentEvo.hiddenGoals.targetPDPpsi}
                </div>
              )}
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-white">{currentGPM.toFixed(0)}</div>
              <div className="text-sm text-gray-400 mt-1">Total GPM</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <div className={`text-3xl font-bold ${
                currentResidual >= 20 ? 'text-green-500' : 'text-yellow-500'
              }`}>
                {currentResidual.toFixed(0)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Residual (psi)</div>
              <div className="text-xs text-gray-500 mt-1">Min: 20</div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevEvolution}
              disabled={currentEvoIndex === 0}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            <button
              onClick={nextEvolution}
              disabled={isLastEvo}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}