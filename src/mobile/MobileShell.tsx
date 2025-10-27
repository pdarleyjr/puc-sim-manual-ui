import { useState } from 'react'
import { useStore } from '../state/store'
import TopHUD from './hud/TopHUD'
import RouteTabs from './nav/RouteTabs'
import { useViewportUnits } from './hooks/useViewportUnits'
import { useKeyboard } from './hooks/useKeyboard'
import { featureFlag } from '../flags'
import './styles/mobile.css'

// Import actual page components
import PanelSupply from './pages/panel/PanelSupply'
import PanelDischarges from './pages/panel/PanelDischarges'
import PanelData from './pages/panel/PanelData'
import HydrantPorts from './pages/hydrant/HydrantPorts'
import HydrantHAV from './pages/hydrant/HydrantHAV'
import HydrantDischarge from './pages/hydrant/HydrantDischarge'
import HydrantAdvisor from './pages/hydrant/HydrantAdvisor'

// Feature flag - can be disabled by setting VITE_MOBILE_APP_UI=false
// Can be overridden via query parameter: ?flag:mobile_app_ui=1
// When disabled, the entire mobile UI is hidden and desktop layout is used
const MOBILE_UI_ENABLED = featureFlag('MOBILE_APP_UI', false)

interface MobileShellProps {
  mode: 'panel' | 'hydrant_lab'
}

/**
 * MobileShell - Main mobile UI container for Fire Pump Simulator
 * 
 * Feature Flag Gating:
 * - Controlled by VITE_MOBILE_APP_UI environment variable (default: false)
 * - Can be overridden via URL: ?flag:mobile_app_ui=1
 * - When flag is OFF, this component returns null (desktop layout used)
 * 
 * Viewport Detection:
 * - Activates for viewports ≤ 1024px
 * - Can be force-enabled via query param: ?m=1
 * 
 * Components:
 * - TopHUD: Situational awareness header with collapsible behavior
 * - RouteTabs: Bottom navigation bar with mode switching
 * - Page content: Dynamic based on active mode/tab
 * 
 * Responsive Breakpoints:
 * - Mobile: < 768px (primary target)
 * - Tablet: 768px - 1024px (experimental)
 * - Desktop: > 1024px (uses standard UI)
 */
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
        pageContent = <PanelSupply />
        break
      case 'discharges':
        pageContent = <PanelDischarges />
        break
      case 'data':
        pageContent = <PanelData />
        break
      default:
        pageContent = <PanelSupply />
    }
  } else {
    switch (activeTab) {
      case 'ports':
        pageContent = <HydrantPorts />
        break
      case 'hav':
        pageContent = <HydrantHAV />
        break
      case 'discharge':
        pageContent = <HydrantDischarge />
        break
      case 'advisor':
        pageContent = <HydrantAdvisor />
        break
      default:
        pageContent = <HydrantPorts />
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