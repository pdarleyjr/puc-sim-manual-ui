import { useState, useEffect } from 'react'
import { Panel } from '../ui/Panel'
import { ModeLauncher } from '../ui/launcher/ModeLauncher'
import { useStore } from '../state/store'
import type { LauncherMode } from '../state/launcher'
import type { ScenarioId } from '../state/store'
import { startOverviewTour } from '../ui/tutorial/Tour'

function App() {
  const [showLauncher, setShowLauncher] = useState(true)
  const [firstVisit, setFirstVisit] = useState(false)
  
  const engagePump = useStore(state => state.engagePump)
  const scenarioStart = useStore(state => state.scenarioStart)
  const setSource = useStore(state => state.setSource)
  const setHydrantTapMode = useStore(state => state.setHydrantTapMode)
  const setHydrantLeg = useStore(state => state.setHydrantLeg)
  const setIntakePsi = useStore(state => state.setIntakePsi)
  const setLine = useStore(state => state.setLine)
  const setGovernorMode = useStore(state => state.setGovernorMode)
  const setGovernorSetPsi = useStore(state => state.setGovernorSetPsi)
  
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
      // Hydrant Connection Lab: pump disengaged, hydrant@80psi, steamer 5"×100'
      setTimeout(() => {
        setSource('none')
        setHydrantTapMode('single')
        setHydrantLeg('steamer', { size: '5', lengthFt: 100, connected: true })
        setHydrantLeg('sideA', { size: '5', lengthFt: 100, connected: false })
        setHydrantLeg('sideB', { size: '5', lengthFt: 100, connected: false })
        setIntakePsi(80)
      }, 100)
    } else if (mode === 'water_supply_troubleshooting') {
      // Water-Supply Troubleshooting: preload high flow, single 5", goal: raise intake≥20
      setTimeout(() => {
        engagePump('water')
        setTimeout(() => {
          setSource('hydrant')
          setIntakePsi(80)
          setHydrantTapMode('single')
          setHydrantLeg('steamer', { size: '5', lengthFt: 150, connected: true })
          setHydrantLeg('sideA', { size: '5', lengthFt: 100, connected: false })
          setHydrantLeg('sideB', { size: '5', lengthFt: 100, connected: false })
          // Preload deck gun (closed but configured)
          setLine('deckgun', { assignment: { type: 'deck_gun', tip: '1_1/2' } })
          setGovernorMode('pressure')
          setGovernorSetPsi(150)
        }, 100)
      }, 100)
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
  
  return <Panel />
}

export default App