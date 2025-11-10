import type { Scenario, ScenarioSeed } from './types'
import seedsData from './seeds.json'
import { scenarioStore } from './storage'

/**
 * Seed built-in scenarios on first launch (idempotent)
 */
export async function seedBuiltInScenarios(): Promise<void> {
  const seeds = seedsData as ScenarioSeed[]
  
  for (const seed of seeds) {
    const exists = await scenarioStore.getItem(seed.id)
    
    if (!exists) {
      const scenario: Scenario = {
        ...seed,
        builtIn: true,
        locked: true,
        source: 'seed',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        version: 1
      }
      
      await scenarioStore.setItem(seed.id, scenario)
    }
  }
}

/**
 * Check if seeding is needed (for migration system)
 */
export async function needsSeeding(): Promise<boolean> {
  try {
    const keys = await scenarioStore.keys()
    const seedIds = (seedsData as ScenarioSeed[]).map(s => s.id)
    
    // Check if any seed scenario is missing
    for (const seedId of seedIds) {
      if (!keys.includes(seedId)) {
        return true
      }
    }
    
    return false
  } catch {
    return true
  }
}