import { useState } from 'react'
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