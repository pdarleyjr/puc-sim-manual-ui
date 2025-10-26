import { useState } from 'react'
import { useStore } from '../state/store'
import TopHUD from './hud/TopHUD'
import RouteTabs from './nav/RouteTabs'
import { useViewportUnits } from './hooks/useViewportUnits'
import { useKeyboard } from './hooks/useKeyboard'
import './styles/mobile.css'

// Placeholder page components - will render actual pages later
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-sm opacity-70">Page content coming soon</p>
      </div>
    </div>
  )
}

// Feature flag - can be disabled by setting VITE_MOBILE_APP_UI=false
const MOBILE_UI_ENABLED = import.meta.env.VITE_MOBILE_APP_UI !== 'false'

interface MobileShellProps {
  mode: 'panel' | 'hydrant_lab'
}

export default function MobileShell({ mode }: MobileShellProps) {
  // Guard: feature flag
  if (!MOBILE_UI_ENABLED) return null
  
  // Guard: check if we're actually on mobile
  const isMobile = typeof window !== 'undefined' && 
    (window.innerWidth <= 1024 || new URLSearchParams(window.location.search).get('m') === '1')
  
  if (!isMobile) return null
  
  const pumpEngaged = useStore(state => state.pumpEngaged)
  const engagePump = useStore(state => state.engagePump)
  
  // Initialize viewport units and keyboard detection
  useViewportUnits()
  useKeyboard()
  
  // Track active page and tab
  const [activePage] = useState<'panel' | 'hydrant'>(
    mode === 'hydrant_lab' ? 'hydrant' : 'panel'
  )
  const [activeTab, setActiveTab] = useState<string>(
    mode === 'hydrant_lab' ? 'ports' : 'supply'
  )
  
  // Show engage screen if pump not engaged (panel mode only)
  if (!pumpEngaged && mode === 'panel') {
    return (
      <div className="md:hidden mobile-fullscreen bg-[#0f141a] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center p-8 rounded-xl bg-[#1a2332] border-2 border-[#2a3340]">
          <h2 className="text-2xl font-bold mb-6">ENGAGE PUMP</h2>
          <p className="text-sm opacity-60 mb-8">
            Select pump mode to begin operation
          </p>
          
          <div className="space-y-4">
            <button
              onClick={() => engagePump('water')}
              className="w-full px-6 py-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 rounded-lg font-bold text-lg transition-all min-h-[48px]"
            >
              Water Pump
            </button>
            
            <button
              onClick={() => engagePump('foam')}
              className="w-full px-6 py-4 bg-pink-500 hover:bg-pink-600 active:bg-pink-700 rounded-lg font-bold text-lg transition-all min-h-[48px]"
            >
              Water + Foam
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Render content based on active page and tab
  let pageContent: React.ReactNode
  if (activePage === 'panel') {
    switch (activeTab) {
      case 'supply':
        pageContent = <PlaceholderPage title="Supply Controls" />
        break
      case 'discharges':
        pageContent = <PlaceholderPage title="Discharge Controls" />
        break
      case 'data':
        pageContent = <PlaceholderPage title="Panel Data" />
        break
      default:
        pageContent = <PlaceholderPage title="Supply Controls" />
    }
  } else {
    switch (activeTab) {
      case 'ports':
        pageContent = <PlaceholderPage title="Hydrant Ports" />
        break
      case 'hav':
        pageContent = <PlaceholderPage title="HAV Controls" />
        break
      case 'advisor':
        pageContent = <PlaceholderPage title="Connection Advisor" />
        break
      default:
        pageContent = <PlaceholderPage title="Hydrant Ports" />
    }
  }
  
  return (
    <div className="md:hidden mobile-fullscreen bg-[#0f141a] text-slate-100 flex flex-col">
      {/* Fixed HUD at top */}
      <header className="fixed top-0 inset-x-0 z-30">
        <TopHUD />
      </header>
      
      {/* Main content area - between HUD and tabs */}
      <main 
        className="absolute inset-x-0 top-[88px] bottom-[56px] overflow-hidden"
        role="main"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {pageContent}
      </main>
      
      {/* Fixed navigation at bottom */}
      <nav className="fixed bottom-0 inset-x-0 z-20">
        <RouteTabs 
          page={activePage} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      </nav>
    </div>
  )
}