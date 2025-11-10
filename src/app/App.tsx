import { useState, useEffect } from 'react'
import { Panel } from '../ui/Panel'
import { ModeLauncher } from '../ui/launcher/ModeLauncher'
import { HydrantLabScreen } from '../features/hydrant-lab/HydrantLabScreen'
import { HydrantLabScreenV2 } from '../features/hydrant-lab/HydrantLabScreenV2'
import { ScenariosRoute } from '../features/scenario-admin/ScenariosRoute'
import { SettingsRoute } from '../features/settings/SettingsRoute'
import { useStore } from '../state/store'
import type { LauncherMode } from '../state/launcher'
import { MODE_ALIASES } from '../state/launcher'
import type { ScenarioId } from '../state/store'
import { startOverviewTour } from '../ui/tutorial/Tour'
import MobileShell from '../mobile/MobileShell'
import { featureFlag } from '../flags'
import { migrateStorage } from '../features/equipment-config/storage'
import { useEquipmentConfig } from '../features/equipment-config/store'

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
  
  // Initialize app: run storage migration and load equipment defaults
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Run storage migration first
        await migrateStorage()
        
        // Initialize equipment defaults store
        await useEquipmentConfig.getState().initialize()
      } catch (error) {
        console.error('Failed to initialize app:', error)
      }
    }
    
    initializeApp()
  }, [])
  
  const handleEnterPanel = (mode: LauncherMode, scenario?: ScenarioId) => {
    setShowLauncher(false)
    
    // Apply mode aliases for backward compatibility
    const effectiveMode = MODE_ALIASES[mode as string] || mode
    setActiveMode(effectiveMode)
    
    // Handle mode-specific setup
    if (effectiveMode === 'scenario' && scenario) {
      // Auto-engage water pump and start scenario
      setTimeout(() => {
        engagePump('water')
        setTimeout(() => {
          scenarioStart(scenario)
        }, 100)
      }, 100)
    } else if (effectiveMode === 'hydrant_lab') {
      // Hydrant Connection Lab: independent state management
      // No setup needed - the lab has its own store
    } else if (effectiveMode === 'scenarios') {
      // Unified Scenarios: independent state management
      // No setup needed - uses its own store
    } else if (effectiveMode === 'settings') {
      // Settings: independent state management
      // No setup needed - uses its own store
    } else if (effectiveMode === 'panel') {
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
  
  // Render unified scenarios mode if enabled and selected
  if (activeMode === 'scenarios' && featureFlag('SCENARIOS_UNIFIED')) {
    return <ScenariosRoute />
  }
  
  // Render settings mode if enabled and selected
  if (activeMode === 'settings' && featureFlag('SCENARIO_ADMIN')) {
    return <SettingsRoute />
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