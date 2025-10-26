import type { ReactNode } from 'react'
import SAHud from './SAHud'
import BottomNav from './BottomNav'
import QuickTogglesSheet from './QuickTogglesSheet'

// Feature flag check
function shouldRenderMobile(): boolean {
  // Check environment variable or query string
  const searchParams = new URLSearchParams(window.location.search)
  const queryFlag = searchParams.get('m') === '1'
  const envFlag = import.meta.env.VITE_MOBILE_APP_UI === 'true'
  
  // Check if mobile viewport (≤768px)
  const isMobileViewport = window.innerWidth <= 768
  
  return (envFlag || queryFlag) && isMobileViewport
}

interface MobileFrameProps {
  children: ReactNode
}

export default function MobileFrame({ children }: MobileFrameProps) {
  if (!shouldRenderMobile()) {
    return null
  }

  return (
    <div className="md:hidden fixed inset-0 bg-[#0f141a] text-slate-100 flex flex-col">
      <SAHud />
      <main id="mobile-main" className="flex-1 overflow-y-auto pb-[120px]">
        {children}
      </main>
      <QuickTogglesSheet />
      <BottomNav />
    </div>
  )
}