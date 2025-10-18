import React from 'react'

interface AnalogGaugeProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  redline?: number
}

export function AnalogGauge({ label, value, min, max, unit = 'PSI', redline }: AnalogGaugeProps) {
  const SWEEP = 240
  const START = -120
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)))
  const angle = START + pct * SWEEP

  // Calculate redline arc if provided
  let redlineArc = null
  if (redline !== undefined) {
    const redlinePct = Math.max(0, Math.min(1, (redline - min) / (max - min)))
    const redlineStart = START + redlinePct * SWEEP
    const redlineEnd = START + SWEEP
    const radius = 70
    const startX = 100 + radius * Math.cos((Math.PI / 180) * redlineStart)
    const startY = 100 + radius * Math.sin((Math.PI / 180) * redlineStart)
    const endX = 100 + radius * Math.cos((Math.PI / 180) * redlineEnd)
    const endY = 100 + radius * Math.sin((Math.PI / 180) * redlineEnd)
    const largeArc = (redlineEnd - redlineStart) > 180 ? 1 : 0
    
    redlineArc = (
      <path
        d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
        stroke="#EF4444"
        strokeWidth="6"
        fill="none"
        opacity="0.6"
      />
    )
  }

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Background arc */}
        <circle cx="100" cy="100" r="70" stroke="white" strokeWidth="2" fill="none" opacity="0.2" />
        
        {/* Redline arc */}
        {redlineArc}
        
        {/* Needle */}
        <g transform={`rotate(${angle} 100 100)`}>
          <line x1="100" y1="100" x2="100" y2="40" strokeWidth="3" stroke="white" strokeLinecap="round" />
          <circle cx="100" cy="100" r="5" fill="white" />
        </g>
      </svg>
      
      <div className="absolute -bottom-6 w-full text-center">
        <div className="text-xl font-bold tabular-nums">{Math.round(value)}</div>
        <div className="text-[10px] opacity-60">{unit}</div>
      </div>
      
      <div className="absolute -top-5 w-full text-center text-[10px] tracking-wider opacity-80 uppercase">
        {label}
      </div>
    </div>
  )
}

interface LineAnalogGaugeProps {
  label: string
  psi: number
  min?: number
  max?: number
}

export function LineAnalogGauge({ label, psi, min = 0, max = 400 }: LineAnalogGaugeProps) {
  const SWEEP = 240
  const START = -120
  const pct = Math.max(0, Math.min(1, (psi - min) / (max - min)))
  const angle = START + pct * SWEEP

  return (
    <div className="relative w-40 h-40 mx-auto">
      {/* Face plate image - will be added later */}
      <img 
        src="/assets/crosslay_analog_gauge.png" 
        alt="" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        onError={(e) => {
          // Hide image if not found, use fallback SVG circle
          e.currentTarget.style.display = 'none'
        }}
      />
      
      {/* SVG needle overlay */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full">
        {/* Fallback dial if image not loaded */}
        <circle cx="100" cy="100" r="70" stroke="white" strokeWidth="2" fill="none" opacity="0.1" />
        
        {/* Center pivot */}
        <circle cx="100" cy="100" r="5" fill="white" />
        
        {/* Needle */}
        <line 
          x1="100" 
          y1="100"
          x2={100 + 70 * Math.cos((Math.PI / 180) * angle)}
          y2={100 + 70 * Math.sin((Math.PI / 180) * angle)}
          stroke="white"
          strokeWidth="4" 
          strokeLinecap="round"
        />
      </svg>
      
      {/* Digital readout below */}
      <div className="absolute -bottom-5 w-full text-center text-sm font-semibold tabular-nums">
        {Math.round(psi)} PSI
      </div>
      
      {/* Label above */}
      <div className="absolute -top-5 w-full text-center text-[10px] tracking-wider opacity-80">
        {label}
      </div>
    </div>
  )
}