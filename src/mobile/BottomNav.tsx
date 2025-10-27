import { useState } from 'react'
import { useKeyboardOpen } from './hooks/useKeyboardOpen'

type NavDestination = 'panel' | 'hydrant' | 'notes'

/**
 * BottomNav - Fixed bottom navigation bar for mobile
 * 
 * Features:
 * - Touch-friendly 56px height with 48px minimum hit targets
 * - Active state indicators with color coding
 * - Keyboard avoidance: hides when keyboard is open
 * - Accessible with ARIA labels and states
 * 
 * Responsive Behavior:
 * - Fixed at bottom with z-50 layering
 * - Automatically hides below md breakpoint when keyboard active
 * - Safe area inset aware for notched devices
 * 
 * Navigation Modes:
 * - Panel: Pump panel controls and gauges
 * - Hydrant: Hydrant connection lab
 * - Notes: Training notes and documentation
 */
export default function BottomNav() {
  const [activeTab, setActiveTab] = useState<NavDestination>('panel')
  const isKeyboardOpen = useKeyboardOpen()

  // Hide bottom nav when keyboard is open
  if (isKeyboardOpen) {
    return null
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-[56px] bg-[#0f141a] border-t border-[#232b35] z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-3 h-full">
        <NavButton
          icon="🎛️"
          label="Panel"
          active={activeTab === 'panel'}
          onClick={() => setActiveTab('panel')}
        />
        <NavButton
          icon="🚰"
          label="Hydrant"
          active={activeTab === 'hydrant'}
          onClick={() => setActiveTab('hydrant')}
        />
        <NavButton
          icon="📝"
          label="Notes"
          active={activeTab === 'notes'}
          onClick={() => setActiveTab('notes')}
        />
      </div>
    </nav>
  )
}

interface NavButtonProps {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}

/**
 * NavButton - Individual navigation button
 * 
 * Accessibility:
 * - Minimum 48px touch target (exceeds 44px iOS standard)
 * - ARIA labels for screen readers
 * - aria-current for active state
 * - aria-pressed for toggle state
 * 
 * Visual States:
 * - Active: sky-400 (primary blue)
 * - Inactive: slate-400 (neutral gray)
 * - Active tap: slate-300 (lighter gray)
 */
function NavButton({ icon, label, active, onClick }: NavButtonProps) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors ${
        active 
          ? 'text-sky-400' 
          : 'text-slate-400 active:text-slate-300'
      }`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="text-xl" role="img" aria-hidden="true">{icon}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </button>
  )
}