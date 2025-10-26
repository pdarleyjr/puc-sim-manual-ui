import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  err?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: undefined }
  
  static getDerivedStateFromError(err: Error) {
    return { err }
  }
  
  componentDidCatch(err: Error, info: any) {
    console.error('[Mobile crash]', err, info)
  }
  
  render() {
    if (this.state.err) {
      return (
        <div className="fixed inset-0 bg-[#0f141a] p-4 text-slate-200 flex items-center justify-center">
          <div className="max-w-md">
            <h1 className="text-lg font-bold mb-2 text-red-400">⚠️ Something went wrong</h1>
            <p className="text-sm opacity-80 mb-4">
              {this.state.err.message || 'An error occurred while rendering the mobile UI.'}
            </p>
            <p className="text-xs opacity-60">
              Reload the page or tap "Desktop mode" in your browser settings.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-lg font-medium"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}