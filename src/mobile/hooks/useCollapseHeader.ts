import { useEffect, useState, useRef } from 'react'

export function useCollapseHeader(scrollContainerId: string) {
  const [isCompact, setIsCompact] = useState(false)
  const lastScrollYRef = useRef(0)

  useEffect(() => {
    const container = document.getElementById(scrollContainerId)
    if (!container) return

    const handleScroll = () => {
      const currentScrollY = container.scrollTop
      const lastScrollY = lastScrollYRef.current

      // Collapse when scrolling down, expand when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 20) {
        setIsCompact(true)
      } else if (currentScrollY < lastScrollY - 10) {
        setIsCompact(false)
      }

      lastScrollYRef.current = currentScrollY
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [scrollContainerId])

  return isCompact
}