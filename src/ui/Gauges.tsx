import { useState, useEffect, useId } from 'react'
import { useStore } from '../state/store'
import { selectCavitating } from '../state/selectors'

interface AnalogGaugeProps {
  label: string
  value: number
  min: number
  max: number
  unit?: string
  redline?: number
}

// Damping function for slew rate limiting
function dampValue(current: number, target: number, maxStep: number = 12): number {
  const delta = target - current
  const step = Math.sign(delta) * Math.min(Math.abs(delta), maxStep)
  return current + step
}

export function AnalogGauge({ label, value, min, max, unit = 'PSI', redline }: AnalogGaugeProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const cavitating = useStore(selectCavitating)
  
  // Damping effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayValue(prev => dampValue(prev, value, 12))
    }, 50)
    return () => clearInterval(interval)
  }, [value])
  
  // Cavitation jitter (±2-4 degrees at 8-12 Hz)
  const [jitter, setJitter] = useState(0)
  useEffect(() => {
    if (!cavitating) {
      setJitter(0)
      return
    }
    const interval = setInterval(() => {
      setJitter((Math.random() - 0.5) * 6) // ±3 degrees
    }, 100) // 10 Hz
    return () => clearInterval(interval)
  }, [cavitating])
  
  const SWEEP = 240
  const START = -120
  const pct = Math.max(0, Math.min(1, (displayValue - min) / (max - min)))
  const angle = START + pct * SWEEP + jitter

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
        <div className="text-xl font-bold tabular-nums">{Math.round(displayValue)}</div>
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
  bezelSrc?: string
  cal?: {
    cx?: number      // SVG center X, default 100
    cy?: number      // SVG center Y, default 100
    r?: number       // dial radius in SVG units, default 60
    margin?: number  // safety margin (needle stops short), default 2
    debug?: boolean  // show debug ring
  }
}

export function LineAnalogGauge({ 
  label, 
  psi, 
  min = 0, 
  max = 400,
  bezelSrc,
  cal = {}
}: LineAnalogGaugeProps) {
  const [displayPsi, setDisplayPsi] = useState(psi)
  const cavitating = useStore(selectCavitating)
  const clipId = useId() // Unique ID for clipPath
  
  // Damping effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayPsi(prev => dampValue(prev, psi, 8))
    }, 50)
    return () => clearInterval(interval)
  }, [psi])
  
  // Cavitation jitter
  const [jitter, setJitter] = useState(0)
  useEffect(() => {
    if (!cavitating) {
      setJitter(0)
      return
    }
    const interval = setInterval(() => {
      setJitter((Math.random() - 0.5) * 6) // ±3 degrees
    }, 100) // 10 Hz
    return () => clearInterval(interval)
  }, [cavitating])
  
  const SWEEP = 240
  const START = -120
  const pct = Math.max(0, Math.min(1, (displayPsi - min) / (max - min)))
  const angle = START + pct * SWEEP + jitter

  // Extract calibration values with defaults
  const cx = cal.cx ?? 100
  const cy = cal.cy ?? 100
  const r = cal.r ?? 60  // Spec-compliant: 2000px PNG with 600px radius = 60% of 200 SVG units
  const margin = cal.margin ?? 2
  const debug = cal.debug ?? false
  
  // Derive needle length from radius (stops short by margin)
  const needleLength = Math.max(0, r - margin)
  
  // Calculate needle endpoint
  const x2 = cx + needleLength * Math.cos((Math.PI / 180) * angle)
  const y2 = cy + needleLength * Math.sin((Math.PI / 180) * angle)

  // Determine bezel source
  const bezelPath = bezelSrc ?? `${import.meta.env.BASE_URL}assets/crosslay_analog_gauge.png`

  return (
    <div className="relative aspect-square w-44 mx-auto select-none">
      {/* Bezel PNG layer */}
      <img 
        src={bezelPath}
        alt="" 
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        onError={(e) => {
          // Hide image if not found, use fallback SVG circle
          e.currentTarget.style.display = 'none'
        }}
      />
      
      {/* SVG needle overlay */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full" aria-hidden="true">
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>

        {/* Fallback dial if image not loaded */}
        <circle cx={cx} cy={cy} r="70" stroke="white" strokeWidth="2" fill="none" opacity="0.1" />
        
        {/* Debug ring - shows exact dial radius for calibration */}
        {debug && (
          <circle 
            cx={cx} 
            cy={cy} 
            r={r} 
            fill="none" 
            stroke="magenta" 
            strokeWidth="2" 
            strokeDasharray="4 4" 
            opacity="0.8"
          />
        )}
        
        {/* Needle - CLIPPED to dial */}
        <g clipPath={`url(#${clipId})`}>
          <line 
            x1={cx} 
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="white"
            strokeWidth="4" 
            strokeLinecap="round"
          />
        </g>
        
        {/* Center pivot cap */}
        <circle cx={cx} cy={cy} r="5" fill="white" />
      </svg>
      
      {/* Digital readout below */}
      <div className="absolute -bottom-6 w-full text-center text-sm font-semibold tabular-nums">
        {Math.round(displayPsi)} PSI
      </div>
      
      {/* Label above */}
      <div className="absolute -top-6 w-full text-center text-[10px] tracking-wider opacity-80">
        {label}
      </div>
    </div>
  )
}