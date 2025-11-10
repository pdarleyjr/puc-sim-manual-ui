import { useRef } from 'react';
import { Plus, Download, Upload, Copy, Trash2 } from 'lucide-react';
import { useScenarioAdmin } from '../store';
import { getIncidentTypeLabel } from '../utils';
import { EXAMPLE_SCENARIOS } from '../examples';
import * as storage from '../storage';

export function ScenarioList() {
  const {
    scenarios,
    activeScenarioId,
    createScenario,
    deleteScenario,
    duplicateScenario: duplicateScenarioAction,
    setActiveScenario,
    exportScenarios,
    importScenarios: importScenariosAction,
    error,
  } = useScenarioAdmin();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const json = await exportScenarios();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scenarios-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = await importScenariosAction(text);
      alert(`Imported: ${result.imported}, Failed: ${result.failed}`);
    } catch (error) {
      alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadExamples = async () => {
    try {
      for (const scenario of EXAMPLE_SCENARIOS) {
        await storage.saveScenario(scenario);
      }
      window.location.reload();
    } catch (error) {
      alert('Failed to load examples');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-2">
        <button
          onClick={createScenario}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          New Scenario
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 min-h-[48px]"
            title="Export scenarios"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 min-h-[48px]"
            title="Import scenarios"
          >
            <Upload className="w-4 h-4" />
            <span className="text-sm">Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        {scenarios.length === 0 && (
          <button
            onClick={handleLoadExamples}
            className="w-full px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 text-sm min-h-[48px]"
          >
            Load Example Scenarios
          </button>
        )}
      </div>

      {error && (
        <div className="mx-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className={`border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50 ${
              activeScenarioId === scenario.id ? 'bg-blue-50' : ''
            }`}
            onClick={() => setActiveScenario(scenario.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {scenario.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {scenario.unitDesignation} • {getIncidentTypeLabel(scenario.incidentType)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {scenario.evolutions.length} evolution{scenario.evolutions.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateScenarioAction(scenario.id);
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this scenario?')) {
                      deleteScenario(scenario.id);
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}