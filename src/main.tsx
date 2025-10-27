import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tailwind.css'
import App from './app/App'
import { useStore } from './state/store'
import { ErrorBoundary } from './app/ErrorBoundary'
import { initMobileToggles } from './mobile/registerMobileToggles'

// Initialize mobile toggle tiles
initMobileToggles()

// DEV-ONLY: Guard against setState loops
if (import.meta.env.DEV) {
  const store = useStore
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const origSet = (store as any).setState.bind(store)
  let last = 0
  let count = 0
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(store as any).setState = (partial: any, replace?: boolean, name?: string) => {
    const now = performance.now()
    count = (now - last) < 16 ? count + 1 : 1 // within same frame
    last = now
    
    if (count > 20) {
      console.error('⚠️ Potential update loop via setState:', name ?? '')
      // Optional: throw to break the loop
      // throw new Error('Update loop detected')
    }
    
    return origSet(partial, replace, name)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
