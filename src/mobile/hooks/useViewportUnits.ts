import { useEffect } from 'react'

/**
 * Sets --svh CSS custom property for small viewport height
 * Uses visualViewport API when available for accurate mobile viewport handling
 */
export function useViewportUnits() {
  useEffect(() => {
    const setViewportHeight = () => {
      // Use visualViewport API if available (modern iOS), fallback to window.innerHeight
      const hv = (window as any).visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--svh', `${hv}px`)
    }
    
    // Set initial value
    setViewportHeight()
    
    // Listen to various viewport changes
    const vp = (window as any).visualViewport
    if (vp) {
      vp.addEventListener('resize', setViewportHeight)
    }
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', setViewportHeight)
    
    return () => {
      if (vp) {
        vp.removeEventListener('resize', setViewportHeight)
      }
      window.removeEventListener('resize', setViewportHeight)
      window.removeEventListener('orientationchange', setViewportHeight)
    }
  }, [])
}