import type { AppState, ScenarioId, DischargeId } from './store'

// Jitter helper: adds ±j% variance to time
export function jitter(ms: number, j: number = 0.2): number {
  return ms * (1 + (Math.random() * 2 - 1) * j)
}

// Step definition for scenario timeline
export interface ScenarioStep {
  atMs: number
  fired?: boolean
  fn: () => void
}

// Watcher function that runs each tick
export type WatcherFn = (state: AppState, _elapsed: number) => void

// Build Scenario A: Single-story residential (one crosslay)
export function buildScenarioA(opts: { xlay: DischargeId; unit: string }, actions: {
  log: (text: string) => void
  unlockHydrant: () => void
  fail: (reason: string) => void
  pass: () => void
}): { steps: ScenarioStep[]; watchers: WatcherFn[] } {
  const steps: ScenarioStep[] = []
  
  // Initial dispatch
  steps.push({
    atMs: 0,
    fn: () => actions.log('Dispatch: Single-story residence, smoke showing.')
  })
  
  // Additional context
  steps.push({
    atMs: jitter(8_000, 0.3),
    fn: () => actions.log('Update: Multiple 911 calls. Bystanders report heavy fire.')
  })
  
  // On scene
  steps.push({
    atMs: jitter(10_000, 0.3),
    fn: () => actions.log(`${opts.unit} on scene. Smoke showing sides A/B.`)
  })
  
  // Jumpline tactic + unlock hydrant
  steps.push({
    atMs: jitter(12_000, 0.2),
    fn: () => {
      actions.unlockHydrant()
      const xlayNum = opts.xlay.replace('xlay', '')
      actions.log(`Officer: Jumpline. Deploy Crosslay #${xlayNum}.`)
    }
  })
  
  // Fire venting
  steps.push({
    atMs: jitter(15_000, 0.2),
    fn: () => actions.log('Update: Fire now venting at eaves.')
  })
  
  // Charge the line
  steps.push({
    atMs: jitter(20_000, 0.2),
    fn: () => actions.log('Officer: Charge the line.')
  })
  
  // Watchers
  const watchers: WatcherFn[] = []
  
  // Water demand watcher
  let chargeLineTime: number | null = null
  let firstWaterCallTime: number | null = null
  let secondWaterCallTime: number | null = null
  
  watchers.push((state, _elapsed) => {
    // Track when "charge the line" inject fires
    if (_elapsed >= jitter(20_000, 0.2) && chargeLineTime === null) {
      chargeLineTime = _elapsed
    }
    
    if (chargeLineTime === null) return
    
    const discharge = state.discharges[opts.xlay]
    const hasFlow = discharge.open && discharge.gpmNow > 10
    const sinceCharge = _elapsed - chargeLineTime
    
    // First water call after 5s
    if (sinceCharge > 5000 && !hasFlow && firstWaterCallTime === null) {
      firstWaterCallTime = _elapsed
      actions.log('Crew: WATER!')
    }
    
    // Second water call after another 5s
    if (firstWaterCallTime !== null && _elapsed - firstWaterCallTime > 5000 && !hasFlow && secondWaterCallTime === null) {
      secondWaterCallTime = _elapsed
      actions.log('Crew: WATER! WATER!')
    }
    
    // FAIL if still no water after second call
    if (secondWaterCallTime !== null && _elapsed - secondWaterCallTime > 1000 && !hasFlow) {
      actions.fail('Crew backing out — No water.')
    }
  })
  
  // GPM band watcher (160-180)
  let gpmWarningTime: number | null = null
  let gpmFailTime: number | null = null
  
  watchers.push((state, _elapsed) => {
    if (state.scenario.status !== 'running') return
    
    const discharge = state.discharges[opts.xlay]
    const hasFlow = discharge.open && discharge.gpmNow > 10
    
    if (!hasFlow) {
      gpmWarningTime = null
      gpmFailTime = null
      return
    }
    
    const gpm = discharge.gpmNow
    
    if (gpm < 160) {
      if (gpmWarningTime === null) {
        gpmWarningTime = _elapsed
        actions.log('Crew: Increase pressure!')
      } else if (_elapsed - gpmWarningTime > 5000 && gpmFailTime === null) {
        gpmFailTime = _elapsed
        actions.fail('Insufficient pressure — Fire advancing.')
      }
    } else if (gpm > 180) {
      if (gpmWarningTime === null) {
        gpmWarningTime = _elapsed
        actions.log('Crew: Back down pressure!')
      } else if (_elapsed - gpmWarningTime > 5000 && gpmFailTime === null) {
        gpmFailTime = _elapsed
        actions.fail('Over-pressure — Hose burst / crew injury.')
      }
    } else {
      // In range: clear warnings
      gpmWarningTime = null
      gpmFailTime = null
    }
  })
  
  // Tank depletion watcher
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  watchers.push((state, _elapsed) => {
    if (state.scenario.status !== 'running') return
    if (state.source === 'hydrant') return
    
    if (state.gauges.waterGal <= 0) {
      const discharge = state.discharges[opts.xlay]
      if (discharge.open && discharge.gpmNow > 10) {
        actions.fail('Ran out of water — No supply established.')
      }
    }
  })
  
  // PASS watcher: crosslay 160-180 GPM + hydrant + sustained 20-30s
  let goodFlowStart: number | null = null
  
  watchers.push((state, _elapsed) => {
    if (state.scenario.status !== 'running') return
    if (state.source !== 'hydrant') {
      goodFlowStart = null
      return
    }
    
    const discharge = state.discharges[opts.xlay]
    const gpm = discharge.gpmNow
    const inRange = discharge.open && gpm >= 160 && gpm <= 180
    
    if (inRange) {
      if (goodFlowStart === null) {
        goodFlowStart = _elapsed
      } else {
        const sustained = _elapsed - goodFlowStart
        const targetDuration = 20000 + Math.random() * 10000 // 20-30s
        if (sustained > targetDuration) {
          actions.log('Fire knocked down. Good work.')
          actions.pass()
        }
      }
    } else {
      goodFlowStart = null
    }
  })
  
  return { steps, watchers }
}

// Build Scenario B: Residential with exposure
export function buildScenarioB(opts: { 
  xlay: DischargeId
  unit: string
  exposureDevice: 'blitzfire' | 'deckgun'
}, actions: {
  log: (text: string) => void
  unlockHydrant: () => void
  fail: (reason: string) => void
  pass: () => void
}): { steps: ScenarioStep[]; watchers: WatcherFn[] } {
  // Start with Scenario A base
  const baseScenario = buildScenarioA({ xlay: opts.xlay, unit: opts.unit }, actions)
  const steps = [...baseScenario.steps]
  const watchers = [...baseScenario.watchers]
  
  // Add IC and exposure injects
  steps.push({
    atMs: jitter(15_000, 0.2),
    fn: () => actions.log('300 (Battalion Chief) on scene; assumes command.')
  })
  
  const deviceName = opts.exposureDevice === 'blitzfire' ? 'Blitzfire 150 ft' : 'Deck Gun'
  steps.push({
    atMs: jitter(18_000, 0.3),
    fn: () => actions.log(`300: Protect exposure. ${deviceName}.`)
  })
  
  // Exposure protection watcher
  let exposureTacticTime: number | null = null
  let exposureWarningTime: number | null = null
  
  watchers.push((state, _elapsed) => {
    if (state.scenario.status !== 'running') return
    
    // Track when tactic was announced
    const tacticInjectTime = jitter(18_000, 0.3)
    if (_elapsed >= tacticInjectTime && exposureTacticTime === null) {
      exposureTacticTime = _elapsed
    }
    
    if (exposureTacticTime === null) return
    
    const sinceExposureTactic = _elapsed - exposureTacticTime
    
    // Check the appropriate device
    if (opts.exposureDevice === 'blitzfire') {
      // Check twohalfA with blitzfire assignment
      const discharge = state.discharges.twohalfA
      const isBlitzfire = discharge.assignment.type === 'blitzfire'
      const hasFlow = discharge.open && discharge.gpmNow >= 300
      
      if (isBlitzfire && hasFlow) {
        // Good: check for sustained 10s
        if (exposureWarningTime === null) {
          exposureWarningTime = _elapsed
        } else if (_elapsed - exposureWarningTime > 10000) {
          // Exposure protected (will contribute to overall pass)
          exposureWarningTime = null
        }
      } else {
        exposureWarningTime = null
      }
      
      // FAIL if not met within 15s
      if (sinceExposureTactic > 15000 && (exposureWarningTime === null || _elapsed - exposureWarningTime < 10000)) {
        actions.fail('Exposure not protected — Structure lost.')
      }
    } else {
      // Deck gun: ≥500 GPM sustained 10s
      const discharge = state.discharges.deckgun
      const hasFlow = discharge.open && discharge.gpmNow >= 500
      
      if (hasFlow) {
        if (exposureWarningTime === null) {
          exposureWarningTime = _elapsed
        } else if (_elapsed - exposureWarningTime > 10000) {
          exposureWarningTime = null
        }
      } else {
        exposureWarningTime = null
      }
      
      if (sinceExposureTactic > 15000 && (exposureWarningTime === null || _elapsed - exposureWarningTime < 10000)) {
        actions.fail('Exposure not protected — Structure lost.')
      }
    }
  })
  
  return { steps, watchers }
}

// Scenario executor state
export interface ScenarioExecutor {
  steps: ScenarioStep[]
  watchers: WatcherFn[]
}

// Initialize a scenario
export function initScenario(id: ScenarioId, unit: string, actions: {
  log: (text: string) => void
  unlockHydrant: () => void
  fail: (reason: string) => void
  pass: () => void
}): ScenarioExecutor {
  if (id === 'residential_one_xlay') {
    // Randomize crosslay
    const crosslays: DischargeId[] = ['xlay1', 'xlay2', 'xlay3']
    const xlay = crosslays[Math.floor(Math.random() * crosslays.length)]
    return buildScenarioA({ xlay, unit }, actions)
  } else {
    // residential_with_exposure
    const crosslays: DischargeId[] = ['xlay1', 'xlay2', 'xlay3']
    const xlay = crosslays[Math.floor(Math.random() * crosslays.length)]
    const exposureDevice = Math.random() < 0.5 ? 'blitzfire' : 'deckgun'
    return buildScenarioB({ xlay, unit, exposureDevice }, actions)
  }
}

// Tick the scenario: fire due steps and run watchers
export function tickScenario(executor: ScenarioExecutor, state: AppState, elapsed: number): void {
  // Fire any due steps
  for (const step of executor.steps) {
    if (!step.fired && elapsed >= step.atMs) {
      step.fired = true
      step.fn()
    }
  }
  
  // Run all watchers
  for (const watcher of executor.watchers) {
    watcher(state, elapsed)
  }
}
