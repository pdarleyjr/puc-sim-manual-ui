import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useNozzleProfiles } from '../store';
import type { TabId, NozzleCategory } from '../types';

interface NozzlePickerProps {
  tabId: TabId;
  category: NozzleCategory;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<NozzleCategory, string> = {
  crosslay: 'Crosslay',
  trash: 'Trash Line',
  leader: 'Leader',
  highrise: 'Highrise/FDC',
  other: 'Other'
};

export function NozzlePicker({ tabId, category, onClose }: NozzlePickerProps) {
  const presets = useNozzleProfiles(state => state.presets);
  const getEffectiveNozzle = useNozzleProfiles(state => state.getEffectiveNozzle);
  const setLocalOverride = useNozzleProfiles(state => state.setLocalOverride);
  const clearLocalOverride = useNozzleProfiles(state => state.clearLocalOverride);
  const localOverrides = useNozzleProfiles(state => state.localOverrides);
  
  const currentPreset = getEffectiveNozzle(tabId, category);
  const hasLocalOverride = localOverrides.some(
    o => o.tabId === tabId && o.category === category
  );
  
  const [selectedId, setSelectedId] = useState<string>(currentPreset?.id || '');
  
  const categoryPresets = presets.filter(p => p.category === category);
  const adminDefault = presets.find(p => p.category === category && p.isDefault);

  const handleSave = async () => {
    if (selectedId) {
      await setLocalOverride(tabId, category, selectedId);
    }
    onClose();
  };

  const handleClearOverride = async () => {
    await clearLocalOverride(tabId, category);
    if (adminDefault) {
      setSelectedId(adminDefault.id);
    }
  };

  const handleUseAdminDefault = () => {
    if (adminDefault) {
      setSelectedId(adminDefault.id);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg sm:text-xl font-bold">Select Nozzle</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {CATEGORY_LABELS[category]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {/* Use Admin Default option (if exists) */}
          {adminDefault && (
            <button
              onClick={handleUseAdminDefault}
              className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                      Use Admin Default
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {adminDefault.name}
                  </div>
                </div>
                {selectedId === adminDefault.id && !hasLocalOverride && (
                  <Check size={20} className="text-blue-600 dark:text-blue-400" />
                )}
              </div>
            </button>
          )}

          {/* Preset options */}
          <div className="space-y-2">
            {categoryPresets.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>No presets available for this category.</p>
                <p className="text-xs mt-2">Create presets in Nozzle Admin.</p>
              </div>
            ) : (
              categoryPresets.map((preset) => {
                const isSelected = selectedId === preset.id;
                const isAdminDefault = preset.isDefault;
                
                return (
                  <label
                    key={preset.id}
                    className={`block p-4 rounded-lg border-2 cursor-pointer transition-all min-h-[60px] ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="nozzle"
                      value={preset.id}
                      checked={isSelected}
                      onChange={() => setSelectedId(preset.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{preset.name}</span>
                          {isAdminDefault && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-semibold">
                              Admin Default
                            </span>
                          )}
                        </div>
                        {preset.notes && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {preset.notes}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {hasLocalOverride && (
            <button
              onClick={handleClearOverride}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold text-sm min-h-[48px]"
            >
              Clear Local Override
            </button>
          )}
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold min-h-[48px]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedId}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors font-semibold min-h-[48px]"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}