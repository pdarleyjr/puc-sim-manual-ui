import { useHydrantLab } from './store'

export function HydrantCanvas() {
  const s = useHydrantLab()
  
  const handlePortClick = (portId: 'steamer' | 'sideA' | 'sideB') => {
    const leg = s.legs[portId]
    if (!leg) {
      // Show connection menu - for now just auto-connect 5"
      s.attachLeg(portId, 5)
    }
  }
  
  const getSteamerColor = () => {
    const leg = s.legs.steamer
    if (!leg) return '#374151' // gray-700
    return leg.gpm > 1000 ? '#10b981' : leg.gpm > 500 ? '#f59e0b' : '#3b82f6'
  }
  
  const getSideColor = (portId: 'sideA' | 'sideB') => {
    const leg = s.legs[portId]
    if (!leg) return '#374151' // gray-700
    if (!leg.gateOpen) return '#ef4444' // red-500 (closed)
    return leg.gpm > 500 ? '#10b981' : leg.gpm > 250 ? '#f59e0b' : '#3b82f6'
  }
  
  return (
    <div className="relative w-[400px] h-[500px]">
      {/* Hydrant body - simplified SVG representation */}
      <svg viewBox="0 0 400 500" className="w-full h-full">
        {/* Main body */}
        <rect x="150" y="200" width="100" height="200" fill="#d1d5db" stroke="#9ca3af" strokeWidth="2" rx="10" />
        
        {/* Steamer port (bottom center) */}
        <g
          onClick={() => handlePortClick('steamer')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <circle cx="200" cy="420" r="35" fill={getSteamerColor()} stroke="#fff" strokeWidth="3" />
          <text x="200" y="428" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
            {s.legs.steamer ? '5"' : 'STEAMER'}
          </text>
        </g>
        
        {/* Side A port (left) */}
        <g
          onClick={() => handlePortClick('sideA')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <circle cx="80" cy="300" r="30" fill={getSideColor('sideA')} stroke="#fff" strokeWidth="3" />
          <text x="80" y="308" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
            {s.legs.sideA ? `${s.legs.sideA.sizeIn}"` : 'A'}
          </text>
        </g>
        
        {/* Side B port (right) */}
        <g
          onClick={() => handlePortClick('sideB')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <circle cx="320" cy="300" r="30" fill={getSideColor('sideB')} stroke="#fff" strokeWidth="3" />
          <text x="320" y="308" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="bold">
            {s.legs.sideB ? `${s.legs.sideB.sizeIn}"` : 'B'}
          </text>
        </g>
        
        {/* Operating nut on top */}
        <rect x="180" y="180" width="40" height="25" fill="#9ca3af" stroke="#6b7280" strokeWidth="2" rx="5" />
        
        {/* Static pressure indicator */}
        <text x="200" y="160" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="bold">
          {s.staticPsi} PSI
        </text>
      </svg>
      
      {/* Labels */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
        <div className="text-lg font-bold text-slate-300">Hydrant</div>
        <div className="text-xs text-slate-500">Click ports to connect/configure</div>
      </div>
    </div>
  )
}