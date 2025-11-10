import { useState } from 'react';
import { Edit2, Copy, Trash2, Download, Upload } from 'lucide-react';
import { useNozzleProfiles } from '../store';
import { useScenarioAdmin } from '../../scenario-admin/store';
import type { NozzlePreset, NozzleCategory, NozzleKind } from '../types';

interface NozzleLibraryProps {
  onEdit: (preset: NozzlePreset) => void;
  onDuplicate: (preset: NozzlePreset) => void;
}

const CATEGORY_LABELS: Record<NozzleCategory, string> = {
  crosslay: 'Crosslay',
  trash: 'Trash Line',
  leader: 'Leader',
  highrise: 'Highrise/FDC',
  other: 'Other'
};

const KIND_LABELS: Record<NozzleKind, string> = {
  smooth_bore: 'Smooth Bore',
  fog_fixed: 'Fog (Fixed)',
  fog_selectable: 'Fog (Selectable)',
  fog_automatic: 'Fog (Automatic)'
};

export function NozzleLibrary({ onEdit, onDuplicate }: NozzleLibraryProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  
  const presets = useNozzleProfiles(state => state.presets);
  const deletePreset = useNozzleProfiles(state => state.deletePreset);
  const exportPresets = useNozzleProfiles(state => state.exportPresets);
  const importPresets = useNozzleProfiles(state => state.importPresets);
  
  // Get scenarios to check for references
  const scenarios = useScenarioAdmin(state => state.scenarios);

  const handleDelete = async (id: string) => {
    // Check if any scenarios reference this preset
    const referencingScenarios = Object.values(scenarios).filter(s =>
      s.evolutions.some(evo => evo.nozzleProfileId === id)
    );
    
    if (referencingScenarios.length > 0 && deleteConfirm !== id) {
      // Show warning with scenario names
      const scenarioList = referencingScenarios.map(s => `• ${s.name}`).join('\n');
      const confirmed = window.confirm(
        `This preset is used in ${referencingScenarios.length} scenario(s):\n\n` +
        scenarioList +
        '\n\nDeleting this preset will remove the nozzle assignment from these evolutions. Continue?'
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    // Standard deletion flow with double-confirm
    if (deleteConfirm === id) {
      await deletePreset(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleExport = async () => {
    try {
      const json = await exportPresets();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nozzle-profiles-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
      const result = await importPresets(text);
      
      if (result.errors.length > 0) {
        setImportError(`Imported ${result.imported} presets with ${result.errors.length} errors`);
      } else {
        setImportError(null);
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed');
    }
    
    // Reset input
    event.target.value = '';
  };

  const getPresetDetails = (preset: NozzlePreset): string => {
    if (preset.kind === 'smooth_bore') {
      return `${preset.tipDiameterIn ?? 0}″ tip`;
    }
    return `${preset.ratedGPM ?? 0} GPM`;
  };

  const getPresetNP = (preset: NozzlePreset): number => {
    if (preset.kind === 'smooth_bore') {
      return preset.ratedNPpsi ?? 50;
    }
    return preset.ratedNPpsiFog ?? 100;
  };

  // Group presets by category
  const presetsByCategory = presets.reduce((acc, preset) => {
    if (!acc[preset.category]) acc[preset.category] = [];
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<NozzleCategory, NozzlePreset[]>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Nozzle Library</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {presets.length} preset{presets.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 min-h-[44px]"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <label className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 cursor-pointer min-h-[44px]">
              <Upload size={18} />
              <span className="hidden sm:inline">Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="sr-only"
              />
            </label>
          </div>
        </div>
        
        {importError && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
            {importError}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>NFPA-typical values:</strong> Smooth bore handline 50 psi, master stream 80 psi · Fog nozzles 100 psi (or 50 psi low-pressure)
        </p>
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Kind</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Details</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">NP (psi)</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {presets.map((preset) => (
              <tr key={preset.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                <td className="px-4 py-3 text-sm">
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                    {CATEGORY_LABELS[preset.category]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium">
                  {preset.name}
                  {preset.isDefault && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                      Default
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {KIND_LABELS[preset.kind]}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {getPresetDetails(preset)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {getPresetNP(preset)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(preset)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDuplicate(preset)}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Duplicate"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className={`p-2 rounded transition-colors ${
                        deleteConfirm === preset.id
                          ? 'bg-red-600 text-white'
                          : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={deleteConfirm === preset.id ? 'Click again to confirm' : 'Delete'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
          <div key={category} className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              {CATEGORY_LABELS[category as NozzleCategory]}
            </h3>
            <div className="space-y-3">
              {categoryPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 bg-gray-50 dark:bg-gray-750 rounded-lg"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{preset.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {KIND_LABELS[preset.kind]} · {getPresetDetails(preset)} · {getPresetNP(preset)} psi
                      </div>
                    </div>
                    {preset.isDefault && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs whitespace-nowrap">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => onEdit(preset)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium min-h-[44px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDuplicate(preset)}
                      className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors min-h-[44px]"
                      title="Duplicate"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id)}
                      className={`px-3 py-2 rounded transition-colors min-h-[44px] ${
                        deleteConfirm === preset.id
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={deleteConfirm === preset.id ? 'Confirm delete' : 'Delete'}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {presets.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>No nozzle presets yet.</p>
          <p className="text-sm mt-2">Click "New Preset" to create one.</p>
        </div>
      )}
    </div>
  );
}