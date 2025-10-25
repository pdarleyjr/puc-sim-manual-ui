import { useHydrantLab } from './store'

export function HosePaths() {
  const s = useHydrantLab()
  
  // Calculate animation speed based on flow (faster = more flow)
  const getAnimDuration = (gpm: number) => {
    if (gpm === 0) return 0
    // Clamp between 400ms (fast) and 1800ms (slow)
    return Math.max(400, Math.min(1800, 1400 - gpm / 10))
  }
  
  const renderHose = (
    portId: 'steamer' | 'sideA' | 'sideB',
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ) => {
    const leg = s.legs[portId]
    if (!leg) return null
    if (portId !== 'steamer' && !leg.gateOpen) return null
    
    const color = leg.sizeIn === 5 ? '#475569' : '#0891b2' // 5" slate-blue, 3" teal
    const animDuration = getAnimDuration(leg.gpm)
    
    // Create a curved path
    const midX = (startX + endX) / 2
    const midY = (startY + endY) / 2 - 50 // Arch upward
    
    return (
      <g key={portId}>
        <path
          d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth={leg.sizeIn === 5 ? 12 : 8}
          strokeLinecap="round"
          opacity="0.8"
        />
        {leg.gpm > 0 && (
          <path
            d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
            fill="none"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="24 12"
            opacity="0.6"
            style={{
              animation: `flow ${animDuration}ms linear infinite`
            }}
          />
        )}
      </g>
    )
  }
  
  return (
    <>
      <style>
        {`
          @keyframes flow {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: -36; }
          }
        `}
      </style>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 500">
        {/* Steamer to engine (bottom) */}
        {renderHose('steamer', 200, 455, 200, 490)}
        
        {/* Side A to engine (left side) */}
        {renderHose('sideA', 80, 330, 150, 490)}
        
        {/* Side B to engine (right side) */}
        {renderHose('sideB', 320, 330, 250, 490)}
        
        {/* Engine intake point indicator */}
        <circle cx="200" cy="490" r="8" fill="#3b82f6" stroke="#fff" strokeWidth="2" />
        <text x="200" y="495" textAnchor="middle" fill="#94a3b8" fontSize="10" dy="20">
          ENGINE
        </text>
      </svg>
    </>
  )
}