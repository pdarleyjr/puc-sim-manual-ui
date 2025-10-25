import { useEffect } from 'react'
import { useHydrantLab } from './store'
import { HydrantCanvas } from './HydrantCanvas'
import { EngineIntakePuck } from './EngineIntakePuck'
import { ConfigTray } from './ConfigTray'
import { StatsStrip } from './StatsStrip'
import { AdvisorChips } from './AdvisorChips'
import { HosePaths } from './HosePaths'

function Pill({ 
  label, 
  value, 
  tone 
}: { 
  label: string
  value: string
  tone: 'neutral' | 'good' | 'warn' | 'danger' 
}) {
  const colors = {
    neutral: 'bg-slate-500/20 text-slate-300',
    good: 'bg-emerald-500/20 text-emerald-300',
    warn: 'bg-amber-500/20 text-amber-300',
    danger: 'bg-red-500/20 text-red-300'
  }
  
  return (
    <div className={`px-3 py-1 rounded-full ${colors[tone]}`}>
      <span className="opacity-70 text-[10px] uppercase tracking-wide mr-2">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  )
}

function toneByResidual(psi: number): 'good' | 'warn' | 'danger' {
  if (psi >= 40) return 'good'
  if (psi >= 25) return 'warn'
  return 'danger'
}

function OutlineButton({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors text-sm"
    >
      {children}
    </button>
  )
}

function IconButton({ 
  children, 
  'aria-label': ariaLabel,
  onClick 
}: { 
  children: React.ReactNode
  'aria-label': string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="w-8 h-8 rounded-lg border border-white/20 hover:border-white/40 hover:bg-white/5 transition-colors flex items-center justify-center text-sm"
    >
      {children}
    </button>
  )
}

export function HydrantLabScreen() {
  const s = useHydrantLab()
  
  // Recompute on mount and when key values change
  useEffect(() => {
    s.recompute()
  }, [s.legs, s.hav, s.governorPsi, s.staticPsi])
  
  return (
    <div className="h-screen bg-[#0f141a] text-slate-100 flex flex-col">
      {/* Top status bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex gap-2 text-[12px] font-mono tabular-nums">
          <Pill label="STATIC" value={`${s.staticPsi} PSI`} tone="neutral" />
          <Pill 
            label="HYDRANT RES" 
            value={`${s.hydrantResidualPsi} PSI`} 
            tone={toneByResidual(s.hydrantResidualPsi)} 
          />
          <Pill 
            label="ENGINE INTAKE" 
            value={`${s.engineIntakePsi} PSI`} 
            tone={toneByResidual(s.engineIntakePsi)} 
          />
          <Pill label="TOTAL INFLOW" value={`${Math.round(s.totalInflowGpm)} GPM`} tone="neutral" />
        </div>
        <div className="flex gap-2">
          <OutlineButton>A/B Compare</OutlineButton>
          <IconButton aria-label="Mini tour">?</IconButton>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 grid grid-cols-[1fr_380px] gap-4 p-4 overflow-hidden">
        {/* Left: Hydrant visualization */}
        <div className="rounded-2xl bg-[#171d24] p-6 relative overflow-hidden flex items-center justify-center">
          <div className="relative">
            <HydrantCanvas />
            <HosePaths />
          </div>
        </div>

        {/* Right: Controls and stats */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="rounded-2xl bg-[#171d24] p-4">
            <EngineIntakePuck 
              intakePsi={s.engineIntakePsi} 
              totalGpm={s.totalInflowGpm} 
            />
          </div>
          
          <div className="rounded-2xl bg-[#171d24] p-4">
            <ConfigTray />
          </div>
          
          <div className="rounded-2xl bg-[#171d24] p-4">
            <StatsStrip />
          </div>
          
          <div className="rounded-2xl bg-[#171d24] p-4">
            <AdvisorChips />
          </div>
        </div>
      </div>
    </div>
  )
}