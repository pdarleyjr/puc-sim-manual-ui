import { useEffect } from 'react'

/**
 * Detects keyboard open/close state and adds safe-bottom class
 * for proper bottom padding when keyboard is visible
 */
export function useKeyboard() {
  useEffect(() => {
    const handleResize = () => {
      // On mobile, when keyboard opens, visualViewport height shrinks
      const vh = window.visualViewport?.height ?? window.innerHeight
      const windowHeight = window.innerHeight
      
      // If visualViewport is significantly smaller than window, keyboard is likely open
      const keyboardOpen = windowHeight - vh > 150
      
      // Add/remove class on mobile-body element
      const mobileBody = document.getElementById('mobile-body')
      if (mobileBody) {
        if (keyboardOpen) {
          mobileBody.classList.add('keyboard-open')
        } else {
          mobileBody.classList.remove('keyboard-open')
        }
      }
    }

    // Listen to visualViewport changes
    window.visualViewport?.addEventListener('resize', handleResize)
    window.addEventListener('resize', handleResize)
    
    // Initial check
    handleResize()
    
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize)
      window.removeEventListener('resize', handleResize)
    }
  }, [])
}