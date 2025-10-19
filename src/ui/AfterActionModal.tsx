import { X, Download, Copy } from 'lucide-react'
import { useStore } from '../state/store'
import type { LogEvent } from '../state/store'

interface AfterActionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AfterActionModal({ isOpen, onClose }: AfterActionModalProps) {
  const session = useStore(state => state.session)
  
  if (!isOpen) return null
  
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts)
    return date.toISOString()
  }
  
  const formatRelativeTime = (ts: number) => {
    if (!session.startTs) return '0.0s'
    const seconds = (ts - session.startTs) / 1000
    return `${seconds.toFixed(1)}s`
  }
  
  const generateCSV = () => {
    const rows = [
      ['timestamp', 'relative_time', 'event', 'meta'],
      ...session.events.map(e => [
        formatTimestamp(e.ts),
        formatRelativeTime(e.ts),
        e.t,
        JSON.stringify(e.meta ?? {})
      ])
    ]
    return rows.map(r => r.join(',')).join('\n')
  }
  
  const handleDownloadCSV = () => {
    const csv = generateCSV()
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pump-session-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  const handleCopyCSV = async () => {
    const csv = generateCSV()
    try {
      await navigator.clipboard.writeText(csv)
      alert('CSV copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }
  
  const duration = session.startTs && session.endTs 
    ? ((session.endTs - session.startTs) / 1000).toFixed(1) 
    : '0.0'
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1a1d23] border border-white/20 rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold">After-Action Report</h2>
            <p className="text-sm opacity-60 mt-1">
              Session Duration: {duration}s · {session.events.length} events
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Timeline */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {session.events.map((event, idx) => (
              <EventRow key={idx} event={event} relativeTime={formatRelativeTime(event.ts)} />
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between gap-4 p-6 border-t border-white/10">
          <div className="flex gap-3">
            <button
              onClick={handleCopyCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
            >
              <Copy size={16} />
              Copy CSV
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg transition-all"
            >
              <Download size={16} />
              Download CSV
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function EventRow({ event, relativeTime }: { event: LogEvent; relativeTime: string }) {
  const getEventColor = (type: string) => {
    if (type.includes('SESSION')) return 'text-emerald-400'
    if (type.includes('WARNING')) return 'text-red-400'
    if (type.includes('REDLINE')) return 'text-orange-400'
    if (type.includes('GOVERNOR')) return 'text-purple-400'
    if (type.includes('SOURCE')) return 'text-sky-400'
    return 'text-white/80'
  }
  
  return (
    <div className="flex items-start gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-all">
      <div className="text-xs tabular-nums opacity-60 w-16 flex-shrink-0 pt-0.5">
        {relativeTime}
      </div>
      <div className="flex-1">
        <div className={`font-semibold text-sm ${getEventColor(event.t)}`}>
          {event.t.replace(/_/g, ' ')}
        </div>
        {event.meta && Object.keys(event.meta).length > 0 && (
          <div className="text-xs opacity-60 mt-1 font-mono">
            {JSON.stringify(event.meta, null, 2)}
          </div>
        )}
      </div>
    </div>
  )
}