import { useEffect } from 'react'

/**
 * Sets --svh CSS custom property for small viewport height
 * Uses visualViewport API when available for accurate mobile viewport handling
 */
export function useViewportUnits() {
  useEffect(() => {
    const updateVH = () => {
      // Use visualViewport if available (better for mobile)
      const vh = window.visualViewport?.height ?? window.innerHeight
      document.documentElement.style.setProperty('--svh', `${vh}px`)
    }

    // Initial set
    updateVH()

    // Update on resize and visualViewport changes
    window.addEventListener('resize', updateVH)
    window.visualViewport?.addEventListener('resize', updateVH)
    
    return () => {
      window.removeEventListener('resize', updateVH)
      window.visualViewport?.removeEventListener('resize', updateVH)
    }
  }, [])
}