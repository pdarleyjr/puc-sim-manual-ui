import type { ReactNode } from 'react'

type TilesFactory = () => ReactNode
const map = new Map<string, TilesFactory>()

export function registerMobileToggles(route: string, factory: TilesFactory) {
  map.set(route, factory)
}

export function getTiles(route: string): ReactNode {
  return map.get(route)?.() ?? null
}