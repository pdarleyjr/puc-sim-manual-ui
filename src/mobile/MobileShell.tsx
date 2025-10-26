import { useState } from 'react'
import { useStore } from '../state/store'
import TopHUD from './hud/TopHUD'
import RouteTabs from './nav/RouteTabs'
import { useViewportUnits } from './hooks/useViewportUnits'
import { useKeyboard } from './hooks/useKeyboard'
import './styles/mobile.css'

// Import page components
import PanelSupply from './pages/panel/PanelSupply'
import PanelDischarges from './pages/panel/PanelDischarges'
import PanelData from './pages/panel/PanelData'
import HydrantPorts from './pages/hydrant/HydrantPorts'
import HydrantHAV from './pages/hydrant/HydrantHAV'
import HydrantAdvisor from './pages/hydrant/HydrantAdvisor'

interface MobileShellProps {
  mode: 'panel' | 'hydrant_lab'
}

export default function MobileShell({ mode }: MobileShellProps) {
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
              className="w-full px-6 py-4 bg-sky-500 hover:bg-sky-600 active:bg-sky-700 rounded-lg font-bold text-lg transition-all"
            >
              Water Pump
            </button>
            
            <button
              onClick={() => engagePump('foam')}
              className="w-full px-6 py-4 bg-pink-500 hover:bg-pink-600 active:bg-pink-700 rounded-lg font-bold text-lg transition-all"
            >
              Water + Foam
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // Render appropriate page component based on active tab
  const renderContent = () => {
    if (activePage === 'panel') {
      switch (activeTab) {
        case 'supply': return <PanelSupply />
        case 'discharges': return <PanelDischarges />
        case 'data': return <PanelData />
        default: return <PanelSupply />
      }
    } else {
      switch (activeTab) {
        case 'ports': return <HydrantPorts />
        case 'hav': return <HydrantHAV />
        case 'advisor': return <HydrantAdvisor />
        default: return <HydrantPorts />
      }
    }
  }
  
  return (
    <div className="md:hidden mobile-fullscreen bg-[#0f141a] text-slate-100 flex flex-col">
      <div className="mobile-hud">
        <TopHUD />
      </div>
      <div id="mobile-body" className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
      <div className="mobile-nav">
        <RouteTabs 
          page={activePage} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  )
}