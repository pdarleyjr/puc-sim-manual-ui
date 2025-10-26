import { useState } from 'react'

interface TabItem {
  id: string
  icon: string
  label: string
}

interface RouteTabsProps {
  page: 'panel' | 'hydrant'
  activeTab: string
  onTabChange: (tabId: string) => void
}

export default function RouteTabs({ page, activeTab, onTabChange }: RouteTabsProps) {
  // Define tabs based on current page
  const items: TabItem[] = page === 'panel'
    ? [
        { id: 'supply', icon: '💧', label: 'Supply' },
        { id: 'discharges', icon: '🔧', label: 'Discharges' },
        { id: 'data', icon: '📊', label: 'Data' }
      ]
    : [
        { id: 'ports', icon: '🚰', label: 'Ports' },
        { id: 'hav', icon: '⚡', label: 'HAV' },
        { id: 'advisor', icon: '💡', label: 'Advisor' }
      ]
  
  return (
    <nav 
      className="h-[56px] px-2 grid grid-cols-3 items-center bg-[#0f141a] border-t border-[#232b35] safe-bottom"
      role="navigation"
      aria-label="Page navigation"
    >
      {items.map(item => {
        const isActive = activeTab === item.id
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`
              flex flex-col items-center justify-center gap-1 min-h-[48px] transition-colors
              ${isActive ? 'text-teal-400' : 'text-slate-300 hover:text-slate-200'}
            `}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="text-xl" role="img" aria-hidden="true">
              {item.icon}
            </span>
            <span className="text-[11px] uppercase font-medium tracking-wide">
              {item.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}