import { Plus, Trash2 } from 'lucide-react';
import { useScenarioAdmin } from '../store';
import { useNozzleProfiles } from '../../nozzle-profiles/store';
import { createEmptyEvolution, formatTime } from '../utils';
import type { EvoSpec, EvoKind } from '../types';

interface Props {
  scenarioId: string;
  evolutions: EvoSpec[];
}

export function EvolutionTable({ scenarioId, evolutions }: Props) {
  const { addEvolution, deleteEvolution } = useScenarioAdmin();

  const handleAdd = () => {
    addEvolution(scenarioId, createEmptyEvolution());
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleAdd}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 min-h-[48px]"
      >
        <Plus className="w-4 h-4" />
        Add Evolution
      </button>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Evolution
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Time Limit
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Hose Length (ft)
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Nozzle
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Target PDP (psi)
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {evolutions.map((evo) => (
              <EvolutionRow 
                key={evo.id} 
                scenarioId={scenarioId}
                evo={evo}
                onDelete={() => deleteEvolution(scenarioId, evo.id)}
                canDelete={evolutions.length > 1}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-md p-3">
        <strong>Note:</strong> Residual advisory minimum is automatically set to 20 psi per NFPA/USFA guidance.
      </div>
    </div>
  );
}

interface RowProps {
  scenarioId: string;
  evo: EvoSpec;
  onDelete: () => void;
  canDelete: boolean;
}

function EvolutionRow({ scenarioId, evo, onDelete, canDelete }: RowProps) {
  const { updateEvolution } = useScenarioAdmin();
  const presets = useNozzleProfiles((s) => s.presets);

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <select
          value={evo.kind}
          onChange={(e) =>
            updateEvolution(scenarioId, evo.id, {
              kind: e.target.value as EvoKind,
            })
          }
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="deploy_crosslay">Deploy Crosslay</option>
          <option value="deploy_skid_load">Deploy Skid Load</option>
          <option value="standpipe_fdc">Standpipe/FDC</option>
          <option value="exposure_monitor">Exposure Monitor</option>
          <option value="draft">Draft Operations</option>
          <option value="relief_valve_test">Relief Valve Test</option>
        </select>
        {evo.label && (
          <div className="text-xs text-gray-500 mt-1">{evo.label}</div>
        )}
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={evo.timeLimitSec}
          onChange={(e) =>
            updateEvolution(scenarioId, evo.id, {
              timeLimitSec: parseInt(e.target.value) || 0,
            })
          }
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
          min="1"
        />
        <span className="ml-2 text-sm text-gray-600">
          ({formatTime(evo.timeLimitSec)})
        </span>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={evo.hoseLengthFt || ''}
          onChange={(e) =>
            updateEvolution(scenarioId, evo.id, {
              hoseLengthFt: parseInt(e.target.value) || undefined,
            })
          }
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="Optional"
        />
      </td>
      <td className="px-4 py-3">
        <select
          value={evo.nozzleProfileId ?? ''}
          onChange={(e) =>
            updateEvolution(scenarioId, evo.id, {
              nozzleProfileId: e.target.value || undefined,
            })
          }
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
        >
          <option value="">Use Admin Default</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-3">
        <input
          type="number"
          value={evo.hiddenGoals?.targetPDPpsi || ''}
          onChange={(e) =>
            updateEvolution(scenarioId, evo.id, {
              hiddenGoals: {
                ...evo.hiddenGoals,
                targetPDPpsi: parseInt(e.target.value) || undefined,
              },
            })
          }
          className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
          placeholder="Optional"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={onDelete}
          disabled={!canDelete}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canDelete ? 'Cannot delete last evolution' : 'Delete'}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}