import { useEffect, useState } from 'react'

export function useKeyboardOpen() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    // Use visualViewport API for modern browsers
    if (window.visualViewport) {
      const handleResize = () => {
        const viewportHeight = window.visualViewport?.height ?? window.innerHeight
        const windowHeight = window.innerHeight
        
        // Keyboard is open if viewport is significantly smaller than window
        const keyboardVisible = windowHeight - viewportHeight > 150
        setIsKeyboardOpen(keyboardVisible)
      }

      window.visualViewport.addEventListener('resize', handleResize)
      return () => window.visualViewport?.removeEventListener('resize', handleResize)
    }

    // Fallback: ResizeObserver on body
    const handleResize = () => {
      const heightDiff = window.innerHeight - document.documentElement.clientHeight
      setIsKeyboardOpen(heightDiff > 150)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isKeyboardOpen
}