import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNozzleProfiles } from '../store';
import type { NozzlePreset, NozzleCategory, NozzleKind } from '../types';

interface NozzleEditorProps {
  preset: NozzlePreset | null;
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORY_OPTIONS: { value: NozzleCategory; label: string }[] = [
  { value: 'crosslay', label: 'Crosslay' },
  { value: 'trash', label: 'Trash Line' },
  { value: 'leader', label: 'Leader' },
  { value: 'highrise', label: 'Highrise/FDC' },
  { value: 'other', label: 'Other' }
];

const KIND_OPTIONS: { value: NozzleKind; label: string; description: string }[] = [
  { value: 'smooth_bore', label: 'Smooth Bore', description: 'Fixed tip size (Freeman formula)' },
  { value: 'fog_fixed', label: 'Fog (Fixed)', description: 'Rated GPM at rated NP' },
  { value: 'fog_selectable', label: 'Fog (Selectable)', description: 'User-adjustable GPM' },
  { value: 'fog_automatic', label: 'Fog (Automatic)', description: 'Auto-adjusting nozzle' }
];

export function NozzleEditor({ preset, onSave, onCancel }: NozzleEditorProps) {
  const [formData, setFormData] = useState<Partial<NozzlePreset>>({
    name: '',
    category: 'crosslay',
    kind: 'fog_fixed',
    ratedGPM: 150,
    ratedNPpsiFog: 100,
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const createPreset = useNozzleProfiles(state => state.createPreset);
  const updatePreset = useNozzleProfiles(state => state.updatePreset);

  useEffect(() => {
    if (preset) {
      setFormData(preset);
    }
  }, [preset]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.kind === 'smooth_bore') {
      if (!formData.tipDiameterIn || formData.tipDiameterIn <= 0) {
        newErrors.tipDiameterIn = 'Tip diameter must be greater than 0';
      }
      if (!formData.ratedNPpsi || formData.ratedNPpsi <= 0) {
        newErrors.ratedNPpsi = 'Rated NP must be greater than 0';
      }
    } else {
      if (!formData.ratedGPM || formData.ratedGPM <= 0) {
        newErrors.ratedGPM = 'Rated GPM must be greater than 0';
      }
      if (!formData.ratedNPpsiFog || formData.ratedNPpsiFog <= 0) {
        newErrors.ratedNPpsiFog = 'Rated NP must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      if (preset) {
        // Update existing
        await updatePreset(preset.id, formData);
      } else {
        // Create new
        await createPreset(formData as Omit<NozzlePreset, 'id' | 'createdAt' | 'updatedAt'>);
      }
      onSave();
    } catch (error) {
      console.error('Failed to save preset:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to save' });
    }
  };

  const handleKindChange = (kind: NozzleKind) => {
    // Set defaults based on kind
    if (kind === 'smooth_bore') {
      setFormData({
        ...formData,
        kind,
        tipDiameterIn: 15/16,
        ratedNPpsi: 50,
        ratedGPM: undefined,
        ratedNPpsiFog: undefined
      });
    } else {
      setFormData({
        ...formData,
        kind,
        ratedGPM: 150,
        ratedNPpsiFog: 100,
        tipDiameterIn: undefined,
        ratedNPpsi: undefined
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl md:text-2xl font-bold">
            {preset ? 'Edit Nozzle Preset' : 'New Nozzle Preset'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              placeholder="e.g., 1¾″ Fog 150 GPM @ 100 psi"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={formData.category || 'crosslay'}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as NozzleCategory })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Kind */}
          <div>
            <label htmlFor="kind" className="block text-sm font-semibold mb-2">
              Nozzle Kind <span className="text-red-500">*</span>
            </label>
            <select
              id="kind"
              value={formData.kind || 'fog_fixed'}
              onChange={(e) => handleKindChange(e.target.value as NozzleKind)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
            >
              {KIND_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional fields based on kind */}
          {formData.kind === 'smooth_bore' ? (
            <>
              {/* Tip Diameter */}
              <div>
                <label htmlFor="tipDiameter" className="block text-sm font-semibold mb-2">
                  Tip Diameter (inches) <span className="text-red-500">*</span>
                </label>
                <input
                  id="tipDiameter"
                  type="number"
                  step="0.0625"
                  value={formData.tipDiameterIn || ''}
                  onChange={(e) => setFormData({ ...formData, tipDiameterIn: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="e.g., 0.9375 (15/16″)"
                />
                {errors.tipDiameterIn && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tipDiameterIn}</p>
                )}
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Common sizes: 7/8″ (0.875), 15/16″ (0.9375), 1″ (1.0), 1⅛″ (1.125), 1¼″ (1.25), 1½″ (1.5)
                </p>
              </div>

              {/* Rated NP */}
              <div>
                <label htmlFor="ratedNP" className="block text-sm font-semibold mb-2">
                  Rated Nozzle Pressure (psi) <span className="text-red-500">*</span>
                </label>
                <input
                  id="ratedNP"
                  type="number"
                  step="1"
                  value={formData.ratedNPpsi || ''}
                  onChange={(e) => setFormData({ ...formData, ratedNPpsi: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="e.g., 50"
                />
                {errors.ratedNPpsi && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ratedNPpsi}</p>
                )}
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  NFPA typical: 50 psi (handline), 80 psi (master stream)
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Rated GPM */}
              <div>
                <label htmlFor="ratedGPM" className="block text-sm font-semibold mb-2">
                  Rated GPM <span className="text-red-500">*</span>
                </label>
                <input
                  id="ratedGPM"
                  type="number"
                  step="1"
                  value={formData.ratedGPM || ''}
                  onChange={(e) => setFormData({ ...formData, ratedGPM: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="e.g., 150"
                />
                {errors.ratedGPM && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ratedGPM}</p>
                )}
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  Common handline: 95, 125, 150, 175, 200 GPM · FDC: 250 GPM
                </p>
              </div>

              {/* Rated NP (Fog) */}
              <div>
                <label htmlFor="ratedNPFog" className="block text-sm font-semibold mb-2">
                  Rated Nozzle Pressure (psi) <span className="text-red-500">*</span>
                </label>
                <input
                  id="ratedNPFog"
                  type="number"
                  step="1"
                  value={formData.ratedNPpsiFog || ''}
                  onChange={(e) => setFormData({ ...formData, ratedNPpsiFog: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                  placeholder="e.g., 100"
                />
                {errors.ratedNPpsiFog && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.ratedNPpsiFog}</p>
                )}
                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  NFPA typical: 100 psi (standard fog), 50 psi (low-pressure fog)
                </p>
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional notes about this nozzle preset"
            />
          </div>

          {errors.submit && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
              {errors.submit}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold min-h-[48px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold min-h-[48px]"
          >
            {preset ? 'Save Changes' : 'Create Preset'}
          </button>
        </div>
      </div>
    </div>
  );
}