import { useState } from 'react';
import { Save } from 'lucide-react';
import { useNozzleProfiles } from '../store';
import type { NozzleCategory } from '../types';

const CATEGORIES: { value: NozzleCategory; label: string; description: string }[] = [
  { value: 'crosslay', label: 'Crosslay', description: '1¾″ handlines' },
  { value: 'trash', label: 'Trash Line', description: 'Front trash line' },
  { value: 'leader', label: 'Leader', description: 'Skid load/leader' },
  { value: 'highrise', label: 'Highrise/FDC', description: '2½″/FDC/standpipe' },
  { value: 'other', label: 'Other', description: 'Deck gun, specialty' }
];

export function CategoryDefaults() {
  const presets = useNozzleProfiles(state => state.presets);
  const updatePreset = useNozzleProfiles(state => state.updatePreset);
  
  const [pendingChanges, setPendingChanges] = useState<Record<NozzleCategory, string | null>>({
    crosslay: null,
    trash: null,
    leader: null,
    highrise: null,
    other: null
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Get current default for each category
  const getCurrentDefault = (category: NozzleCategory) => {
    return presets.find(p => p.category === category && p.isDefault);
  };

  // Get pending selection or current default
  const getEffectiveSelection = (category: NozzleCategory) => {
    const pending = pendingChanges[category];
    if (pending !== null) return pending;
    return getCurrentDefault(category)?.id || '';
  };

  const hasChanges = Object.values(pendingChanges).some(v => v !== null);

  const handleCategoryChange = (category: NozzleCategory, presetId: string) => {
    setPendingChanges({
      ...pendingChanges,
      [category]: presetId || ''
    });
    setSaveMessage(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // For each category with pending changes, update the isDefault flag
      for (const [category, newDefaultId] of Object.entries(pendingChanges)) {
        if (newDefaultId === null) continue;

        const cat = category as NozzleCategory;
        
        // Clear old default
        const oldDefault = getCurrentDefault(cat);
        if (oldDefault && oldDefault.id !== newDefaultId) {
          await updatePreset(oldDefault.id, { isDefault: false });
        }

        // Set new default
        if (newDefaultId) {
          await updatePreset(newDefaultId, { isDefault: true });
        }
      }

      setPendingChanges({
        crosslay: null,
        trash: null,
        leader: null,
        highrise: null,
        other: null
      });
      
      setSaveMessage('Category defaults saved successfully');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save defaults:', error);
      setSaveMessage('Failed to save defaults');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setPendingChanges({
      crosslay: null,
      trash: null,
      leader: null,
      highrise: null,
      other: null
    });
    setSaveMessage(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold">Category Defaults</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Admin-selected presets for each category
        </p>
      </div>

      {/* Helper text */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          These are Admin defaults. Per-tab overrides can be set in Pump Panel or Hydrant Lab.
        </p>
      </div>

      {/* Category selections */}
      <div className="p-4 space-y-4">
        {CATEGORIES.map(({ value, label, description }) => {
          const categoryPresets = presets.filter(p => p.category === value);
          const currentSelection = getEffectiveSelection(value);
          const isPending = pendingChanges[value] !== null;

          return (
            <div key={value} className="space-y-2">
              <label htmlFor={`category-${value}`} className="block">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-sm font-semibold">
                    {label}
                    {isPending && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                        (unsaved)
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {description}
                  </span>
                </div>
                <select
                  id={`category-${value}`}
                  value={currentSelection}
                  onChange={(e) => handleCategoryChange(value, e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-h-[44px]"
                  disabled={categoryPresets.length === 0}
                >
                  <option value="">None selected</option>
                  {categoryPresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>
              
              {categoryPresets.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  No presets available for this category
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Save message */}
      {saveMessage && (
        <div className={`mx-4 mb-4 p-3 rounded text-sm ${
          saveMessage.includes('success')
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2 min-h-[48px]"
        >
          <Save size={18} />
          {isSaving ? 'Saving...' : 'Save Defaults'}
        </button>
        
        {hasChanges && (
          <button
            onClick={handleReset}
            disabled={isSaving}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold min-h-[48px]"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}