import { type ReactNode, createElement } from 'react'
import HydrantTiles from './tiles/HydrantTiles'
import PanelTiles from './tiles/PanelTiles'

/**
 * Mobile Toggles Registration System
 * 
 * Purpose:
 * Provides a registry for context-sensitive quick toggle tiles that appear
 * in the QuickTogglesSheet based on the active mode (panel vs hydrant)
 * 
 * Architecture:
 * - Factory pattern: Each route registers a component factory function
 * - Dynamic loading: Tiles are rendered only when sheet is expanded
 * - Context-aware: Different tiles for different modes
 * 
 * Usage:
 * 1. Create tile component (e.g., HydrantTiles.tsx)
 * 2. Import and register in initMobileToggles()
 * 3. Component factory is called when sheet needs content
 * 
 * Routes:
 * - 'panel': Pump panel mode (discharges, foam, intake)
 * - 'hydrant': Hydrant lab mode (ports, gates, HAV)
 * - 'scenario': Scenario mode (objectives, timer, scoring)
 * 
 * Tile Guidelines:
 * - Use 2-column grid layout
 * - 56px minimum height per tile
 * - Touch-friendly 44x44px minimum hit targets
 * - Active state with color coding
 * - Context menu for advanced options (long-press)
 */

type TilesFactory = () => ReactNode

const map = new Map<string, TilesFactory>()

/**
 * Register a tile factory for a specific route
 * @param route - The mode route ('panel', 'hydrant', etc.)
 * @param factory - Function that returns the tile component
 */
export function registerMobileToggles(route: string, factory: TilesFactory) {
  map.set(route, factory)
}

/**
 * Get tiles for a specific route
 * @param route - The mode route to get tiles for
 * @returns The tile component or null if not registered
 */
export function getTiles(route: string): ReactNode {
  return map.get(route)?.() ?? null
}

/**
 * Initialize mobile toggle tiles
 * Called during app startup to register all tile factories
 */
export function initMobileToggles() {
  // Register panel tiles (pump panel, foam mode, scenario mode)
  registerMobileToggles('panel', () => createElement(PanelTiles))
  
  // Register hydrant tiles (hydrant connection lab)
  registerMobileToggles('hydrant', () => createElement(HydrantTiles))
}