import { useNozzleProfiles } from '../store';
import type { TabId, NozzleCategory } from '../types';

interface NozzlePillProps {
  tabId: TabId;
  category: NozzleCategory;
  onClick?: () => void;
  className?: string;
}

export function NozzlePill({ tabId, category, onClick, className = '' }: NozzlePillProps) {
  const getEffectiveNozzle = useNozzleProfiles(state => state.getEffectiveNozzle);
  const localOverrides = useNozzleProfiles(state => state.localOverrides);
  
  const preset = getEffectiveNozzle(tabId, category);
  const hasLocalOverride = localOverrides.some(
    o => o.tabId === tabId && o.category === category
  );

  if (!preset) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[32px] ${className}`}
      >
        <span className="text-gray-500 dark:text-gray-400">No nozzle selected</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[32px] ${className}`}
      title={hasLocalOverride ? 'Local override active - Click to change' : 'Using Admin default - Click to override'}
    >
      <span className="font-medium text-gray-900 dark:text-white">{preset.name}</span>
      {hasLocalOverride && (
        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-[10px] font-semibold">
          Local
        </span>
      )}
    </button>
  );
}