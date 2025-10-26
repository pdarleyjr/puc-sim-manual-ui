import { useState, useEffect } from 'react'
import { Panel } from '../ui/Panel'
import { ModeLauncher } from '../ui/launcher/ModeLauncher'
import { HydrantLabScreen } from '../features/hydrant-lab/HydrantLabScreen'
import { useStore } from '../state/store'
import type { LauncherMode } from '../state/launcher'
import type { ScenarioId } from '../state/store'
import { startOverviewTour } from '../ui/tutorial/Tour'
import MobileShell from '../mobile/MobileShell'

function App() {
  const [showLauncher, setShowLauncher] = useState(true)
  const [activeMode, setActiveMode] = useState<LauncherMode | null>(null)
  const [firstVisit, setFirstVisit] = useState(false)
  
  const engagePump = useStore(state => state.engagePump)
  const scenarioStart = useStore(state => state.scenarioStart)
  
  // Check if this is first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('pumpsim_has_visited')
    if (!hasVisited) {
      setFirstVisit(true)
      localStorage.setItem('pumpsim_has_visited', 'true')
    }
  }, [])
  
  const handleEnterPanel = (mode: LauncherMode, scenario?: ScenarioId) => {
    setShowLauncher(false)
    setActiveMode(mode)
    
    // Handle mode-specific setup
    if (mode === 'foam') {
      // Auto-engage foam when entering foam mode
      setTimeout(() => {
        engagePump('foam')
        // Show overview tour on first visit
        if (firstVisit) {
          setTimeout(() => {
            startOverviewTour()
          }, 500)
        }
      }, 100)
    } else if (mode === 'scenario' && scenario) {
      // Auto-engage water pump and start scenario
      setTimeout(() => {
        engagePump('water')
        setTimeout(() => {
          scenarioStart(scenario)
        }, 100)
      }, 100)
    } else if (mode === 'hydrant_lab') {
      // Hydrant Connection Lab: independent state management
      // No setup needed - the lab has its own store
    } else if (mode === 'panel') {
      // Panel only - show overview tour on first visit
      if (firstVisit) {
        setTimeout(() => {
          startOverviewTour()
        }, 500)
      }
    }
  }
  
  if (showLauncher) {
    return <ModeLauncher onEnter={handleEnterPanel} />
  }
  
  // Render mobile shell OR desktop layout based on viewport
  const content = activeMode === 'hydrant_lab' ? <HydrantLabScreen /> : <Panel />
  
  return (
    <>
      {/* Desktop layout (default) */}
      <div className="hidden md:block">
        {content}
      </div>
      
      {/* Mobile layout (when conditions met and mode is selected) */}
      {activeMode && (
        <MobileShell mode={activeMode === 'hydrant_lab' ? 'hydrant_lab' : 'panel'} />
      )}
    </>
  )
}

export default App