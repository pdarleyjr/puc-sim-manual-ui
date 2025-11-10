import { useState, useEffect } from 'react';
import { useNozzleProfiles } from './store';
import type { NozzlePreset } from './types';
import { NozzleLibrary } from './components/NozzleLibrary';
import { NozzleEditor } from './components/NozzleEditor';
import { CategoryDefaults } from './components/CategoryDefaults';

export function NozzleAdminRoute() {
  const [editingPreset, setEditingPreset] = useState<NozzlePreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const loadPresets = useNozzleProfiles(state => state.loadPresets);
  const loadLocalOverrides = useNozzleProfiles(state => state.loadLocalOverrides);

  // Load data on mount
  useEffect(() => {
    loadPresets();
    loadLocalOverrides();
  }, [loadPresets, loadLocalOverrides]);

  const handleEdit = (preset: NozzlePreset) => {
    setEditingPreset(preset);
    setIsCreating(false);
  };

  const handleDuplicate = (preset: NozzlePreset) => {
    setEditingPreset({
      ...preset,
      id: crypto.randomUUID(),
      name: `${preset.name} (Copy)`,
      isDefault: false
    });
    setIsCreating(true);
  };

  const handleSave = () => {
    setEditingPreset(null);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setEditingPreset(null);
    setIsCreating(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Nozzle Profiles</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage nozzle presets and category defaults (NFPA-compliant)
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPreset(null);
              setIsCreating(true);
            }}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap min-h-[48px]"
          >
            + New Preset
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto">
          {/* Left: Preset library (2/3 width on desktop) */}
          <div className="lg:col-span-2">
            <NozzleLibrary
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
            />
          </div>

          {/* Right: Category defaults (1/3 width on desktop) */}
          <div className="lg:col-span-1">
            <CategoryDefaults />
          </div>
        </div>
      </div>

      {/* Editor modal */}
      {(editingPreset || isCreating) && (
        <NozzleEditor
          preset={editingPreset}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}