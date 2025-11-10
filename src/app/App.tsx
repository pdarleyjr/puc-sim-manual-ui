import { useState, useEffect } from 'react'
import { Panel } from '../ui/Panel'
import { ModeLauncher } from '../ui/launcher/ModeLauncher'
import { HydrantLabScreen } from '../features/hydrant-lab/HydrantLabScreen'
import { HydrantLabScreenV2 } from '../features/hydrant-lab/HydrantLabScreenV2'
import { ScenarioAdminRoute } from '../features/scenario-admin/ScenarioAdminRoute'
import { ScenarioRunnerRoute } from '../features/scenario-admin/ScenarioRunnerRoute'
import { useStore } from '../state/store'
import type { LauncherMode } from '../state/launcher'
import type { ScenarioId } from '../state/store'
import { startOverviewTour } from '../ui/tutorial/Tour'
import MobileShell from '../mobile/MobileShell'
import { featureFlag } from '../flags'

/**
 * Main App Component
 * 
 * Mobile Feature Flag System:
 * ===========================
 * The mobile UI is gated by the VITE_MOBILE_APP_UI feature flag (default: false)
 * 
 * When flag is OFF (default):
 * - Desktop layout is used for ALL viewport sizes
 * - Mobile components are not rendered at all
 * - Experience is completely unchanged from standard desktop UI
 * 
 * When flag is ON (via env or query param):
 * - Mobile layout activates for viewports ≤ 1024px
 * - Desktop layout still used for viewports > 1024px
 * - Query param override: ?flag:mobile_app_ui=1
 * - Force mobile on desktop: ?m=1 (testing only)
 * 
 * Mobile Components:
 * - MobileShell: Main mobile UI container with SA-HUD, navigation, and pages
 * - Internally checks flag and viewport before rendering
 * - Returns null if conditions not met (desktop layout used)
 * 
 * Testing:
 * - Desktop (flag OFF): Standard UI, mobile code not executed
 * - Mobile (flag ON): Add ?flag:mobile_app_ui=1 to URL
 * - Responsive: Test at 375px, 390px, 430px, 768px viewports
 */
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
    if (mode === 'scenario' && scenario) {
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
    } else if (mode === 'scenario_admin') {
      // Scenario Admin: independent state management
      // No setup needed - uses its own store
    } else if (mode === 'scenario_runner') {
      // Scenario Runner: independent state management
      // No setup needed - uses its own store
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
  
  // Feature flag routing for Hydrant Lab V2
  const useHydrantLabV2 = featureFlag('HYDRANT_LAB_V2')
  
  if (useHydrantLabV2) {
    console.log('🚩 HYDRANT_LAB_V2 flag enabled - using HydrantLabScreenV2')
  }
  
  // Render scenario_admin mode if enabled and selected
  if (activeMode === 'scenario_admin' && featureFlag('SCENARIO_ADMIN')) {
    return <ScenarioAdminRoute />
  }
  
  // Render scenario_runner mode if enabled and selected
  if (activeMode === 'scenario_runner' && featureFlag('SCENARIO_ADMIN')) {
    return <ScenarioRunnerRoute />
  }
  
  // Render mobile shell OR desktop layout based on viewport
  // Mobile shell internally checks VITE_MOBILE_APP_UI flag and viewport
  // If flag is OFF or viewport is large, mobile shell returns null
  const content = activeMode === 'hydrant_lab' 
    ? (useHydrantLabV2 ? <HydrantLabScreenV2 /> : <HydrantLabScreen />)
    : <Panel />
  
  return (
    <>
      {/* Desktop layout (default) - hidden on mobile when MobileShell renders */}
      <div className="hidden md:block">
        {content}
      </div>
      
      {/* Mobile layout - only renders when:
          1. VITE_MOBILE_APP_UI flag is enabled (or ?flag:mobile_app_ui=1)
          2. Viewport is ≤ 1024px (or ?m=1 for testing)
          3. activeMode is selected
          
          When conditions not met, MobileShell returns null (desktop layout used)
      */}
      {activeMode && (
        <MobileShell mode={activeMode === 'hydrant_lab' ? 'hydrant_lab' : 'panel'} />
      )}
    </>
  )
}

export default App