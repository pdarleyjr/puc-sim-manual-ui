import { useState, useRef, useEffect } from 'react'
import { useStore } from '../../state/store'

export default function GovernorChip() {
  // Select primitive values directly to avoid infinite loop from object creation
  const governorMode = useStore(state => state.governor.mode)
  const governorSetPsi = useStore(state => state.governor.setPsi)
  const governorSetRpm = useStore(state => state.governor.setRpm)
  const setGovernorMode = useStore(state => state.setGovernorMode)
  const setGovernorSetPsi = useStore(state => state.setGovernorSetPsi)
  const setGovernorSetRpm = useStore(state => state.setGovernorSetRpm)
  
  const [open, setOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  
  // Derive display values
  const displayMode = governorMode === 'pressure' ? 'PDP' : 'RPM'
  const setpoint = governorMode === 'pressure' ? governorSetPsi : governorSetRpm
  const increment = governorMode === 'pressure' ? 5 : 50
  
  // Close on outside click
  useEffect(() => {
    if (!open) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])
  
  // Close on escape
  useEffect(() => {
    if (!open) return
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])
  
  const handleAdjust = (delta: number) => {
    if (governorMode === 'pressure') {
      setGovernorSetPsi(governorSetPsi + delta)
    } else {
      setGovernorSetRpm(governorSetRpm + delta)
    }
  }
  
  return (
    <div className="justify-self-end relative" ref={popoverRef}>
      <button 
        className="rounded-xl bg-[#0b1220] border border-[#2a3340] px-2 py-1 text-[11px] font-mono min-h-[44px]"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <div className="text-[8px] uppercase opacity-60">GOV</div>
        <div>
          {displayMode} · <span className="text-teal-400">{setpoint}</span>
        </div>
      </button>
      
      {open && (
        <div 
          role="dialog" 
          aria-label="Governor Controls"
          className="absolute right-0 mt-2 w-[240px] rounded-xl bg-[#121922] p-3 border border-[#2a3340] z-50 shadow-xl"
        >
          <div className="text-xs font-semibold mb-2 text-center opacity-80">GOVERNOR MODE</div>
          
          <div className="flex gap-2 mb-3">
            <button 
              className={governorMode === 'pressure' ? 'btn-on flex-1' : 'btn-off flex-1'}
              onClick={() => setGovernorMode('pressure')}
              aria-pressed={governorMode === 'pressure'}
            >
              Pressure
            </button>
            <button 
              className={governorMode === 'rpm' ? 'btn-on flex-1' : 'btn-off flex-1'}
              onClick={() => setGovernorMode('rpm')}
              aria-pressed={governorMode === 'rpm'}
            >
              RPM
            </button>
          </div>
          
          <div className="text-xs font-semibold mb-2 text-center opacity-80">SETPOINT</div>
          
          <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
            <button 
              className="h-11 rounded-lg bg-[#1a2332] border border-[#2a3340] text-xl font-bold hover:bg-[#232b3a] active:bg-[#2a3340]"
              onClick={() => handleAdjust(-increment)}
              aria-label={`Decrease ${increment}`}
            >
              −
            </button>
            <div className="text-center font-mono text-2xl font-bold text-teal-400">
              {setpoint}
            </div>
            <button 
              className="h-11 rounded-lg bg-[#1a2332] border border-[#2a3340] text-xl font-bold hover:bg-[#232b3a] active:bg-[#2a3340]"
              onClick={() => handleAdjust(increment)}
              aria-label={`Increase ${increment}`}
            >
              +
            </button>
          </div>
          
          <div className="mt-2 text-center text-[10px] opacity-50">
            {governorMode === 'pressure' ? 'PSI' : 'RPM'}
          </div>
        </div>
      )}
    </div>
  )
}