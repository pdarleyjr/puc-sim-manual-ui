import { useEffect } from 'react'

/**
 * Sets --svh CSS custom property for small viewport height
 * Uses visualViewport API when available for accurate mobile viewport handling
 */
export function useViewportUnits() {
  useEffect(() => {
    const updateVH = () => {
      // Use visualViewport if available (better for mobile)
      const hv = (window as any).visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--svh', `${hv}px`)
    }

    // Initial set
    updateVH()

    // Update on resize, visualViewport changes, and orientation change
    window.addEventListener('resize', updateVH)
    window.addEventListener('orientationchange', updateVH)
    ;(window as any).visualViewport?.addEventListener('resize', updateVH)
    
    return () => {
      window.removeEventListener('resize', updateVH)
      window.removeEventListener('orientationchange', updateVH)
      ;(window as any).visualViewport?.removeEventListener('resize', updateVH)
    }
  }, [])
}