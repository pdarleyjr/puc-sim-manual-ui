import type { ReactNode } from 'react'
import SAHud from './SAHud'
import BottomNav from './BottomNav'
import QuickTogglesSheet from './QuickTogglesSheet'
import { featureFlag } from '../flags'

/**
 * MobileFrame - Alternative mobile layout wrapper
 * 
 * Feature Flag Gating:
 * - Controlled by VITE_MOBILE_APP_UI environment variable (default: false)
 * - Can be overridden via URL: ?flag:mobile_app_ui=1
 * - When flag is OFF, this component returns null (desktop layout used)
 * 
 * Viewport Detection:
 * - Activates for viewports ≤ 768px
 * - Can be force-enabled via query param: ?m=1
 * 
 * Components:
 * - SAHud: Situational Awareness HUD at top (collapsible)
 * - QuickTogglesSheet: Bottom sheet with context-sensitive controls
 * - BottomNav: Fixed navigation bar at bottom
 * 
 * Note: This is an alternative layout to MobileShell. Choose one based on needs.
 */
function shouldRenderMobile(): boolean {
  // Use centralized feature flag check with query parameter override support
  const flagEnabled = featureFlag('MOBILE_APP_UI', false)
  
  // Check if mobile viewport (≤768px) or force-enabled via query param
  const searchParams = new URLSearchParams(window.location.search)
  const queryForce = searchParams.get('m') === '1'
  const isMobileViewport = window.innerWidth <= 768
  
  return flagEnabled && (isMobileViewport || queryForce)
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