import { useState } from 'react'
import { useLauncher } from '../state/launcher'
import { getTiles } from './registerMobileToggles'
import { useKeyboardOpen } from './hooks/useKeyboardOpen'

/**
 * QuickTogglesSheet - Slide-up bottom sheet with context-sensitive controls
 * 
 * Purpose:
 * Provides quick access to frequently-used controls based on current mode,
 * reducing navigation burden and improving workflow efficiency
 * 
 * Features:
 * - Slide-up animation: 56px collapsed, 60vh expanded
 * - Context-sensitive: Different tiles for panel vs hydrant modes
 * - Keyboard avoidance: Lowers when keyboard opens
 * - Drag handle for intuitive interaction
 * - Smooth 250ms transitions
 * 
 * Context-Sensitive Content:
 * - Panel mode: Discharge controls, foam system, intake settings
 * - Hydrant mode: Port connections, gate controls, HAV settings
 * - Scenarios mode: Mission objectives, timer, scoring
 * 
 * Keyboard Behavior:
 * - When keyboard opens: Sheet lowers to -20vh (stays accessible)
 * - When keyboard closes: Sheet returns to normal position
 * - Prevents input fields from being hidden behind sheet
 * 
 * Responsive Heights:
 * - Collapsed: 56px (drag handle visible)
 * - Expanded: 60vh (majority of viewport)
 * - Content area: calc(60vh - 40px) for scrolling
 * 
 * Z-Index Layering:
 * - z-40: Above main content, below modals
 * - Fixed positioning for persistent access
 * - Rounded top corners for visual separation
 * 
 * Accessibility:
 * - ARIA labels for expand/collapse states
 * - aria-expanded for screen readers
 * - Focus management for keyboard navigation
 * - Scrollable content area with max height
 * 
 * Tile Registration:
 * Tiles are registered via registerMobileToggles() in each mode's setup
 * See: src/mobile/tiles/HydrantTiles.tsx and PanelTiles.tsx
 */
export default function QuickTogglesSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const activeMode = useLauncher(state => state.chosenMode)
  const isKeyboardOpen = useKeyboardOpen()
  
  // Get tiles for the active mode
  const route = activeMode === 'panel' || activeMode === 'foam' || activeMode === 'scenario' 
    ? 'panel' 
    : activeMode === 'hydrant_lab' 
    ? 'hydrant' 
    : 'panel'
  
  const tiles = getTiles(route)
  
  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  // Lower the sheet when keyboard is open
  const bottomOffset = isKeyboardOpen ? 'bottom-[-20vh]' : 'bottom-[56px]'

  return (
    <section
      id="qt-sheet"
      className={`fixed left-0 right-0 z-40 rounded-t-2xl bg-[#171d24] shadow-xl transition-[height] duration-250 ${bottomOffset}`}
      style={{ height: isOpen ? '60vh' : '56px' }}
      data-open={isOpen}
    >
      {/* Drag handle */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-center py-2 w-full focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-label={isOpen ? 'Collapse quick toggles' : 'Expand quick toggles'}
        aria-expanded={isOpen}
      >
        <div className="h-1.5 w-10 rounded-full bg-[#232b35]" />
      </button>

      {/* Content area */}
      <div className="px-3 pb-3 overflow-y-auto" style={{ maxHeight: 'calc(60vh - 40px)' }}>
        {tiles || (
          <div className="text-center text-slate-400 py-8 text-sm">
            No quick toggles available for this mode
          </div>
        )}
      </div>
    </section>
  )
}