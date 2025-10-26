import { useState } from 'react'
import { useKeyboardOpen } from './hooks/useKeyboardOpen'

type NavDestination = 'panel' | 'hydrant' | 'notes'

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

function NavButton({ icon, label, active }: NavButtonProps) {
  return (
    <button
      className={`flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors ${
        active 
          ? 'text-sky-400' 
          : 'text-slate-400 active:text-slate-300'
      }`}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <span className="text-xl" role="img" aria-hidden="true">{icon}</span>
      <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span>
    </button>
  )
}