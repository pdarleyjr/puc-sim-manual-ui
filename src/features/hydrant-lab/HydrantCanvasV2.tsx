import { useHydrantLab } from './store';

export default function HydrantCanvasV2() {
  const s = useHydrantLab();

  const handlePortClick = (portId: 'steamer' | 'sideA' | 'sideB') => {
    const leg = s.legs[portId];
    if (!leg) {
      // Auto-connect 5" hose
      s.attachLeg(portId, 5);
    }
  };

  const handleGateClick = (portId: 'sideA' | 'sideB', e: React.MouseEvent) => {
    e.stopPropagation();
    s.toggleGate(portId);
  };

  const handleHAVClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!s.hav.enabled) {
      s.setHavEnabled(true);
      s.setHavMode('bypass');
    } else {
      // Cycle: bypass -> boost -> off
      if (s.hav.mode === 'bypass') {
        s.setHavMode('boost');
      } else {
        s.setHavEnabled(false);
      }
    }
  };

  const getPortColor = (portId: 'steamer' | 'sideA' | 'sideB') => {
    const leg = s.legs[portId];
    if (!leg) return '#374151'; // gray-700 (disconnected)
    
    // Check if gate is closed for side ports
    if (portId !== 'steamer' && 'gateOpen' in leg && !leg.gateOpen) {
      return '#ef4444'; // red-500 (closed)
    }
    
    // Color by flow
    if (leg.gpm > 1000) return '#10b981'; // green-500
    if (leg.gpm > 500) return '#f59e0b'; // amber-500
    return '#3b82f6'; // blue-500
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex-1 flex items-center justify-center">
      <svg viewBox="0 0 600 400" className="w-full h-full max-h-[500px]">
        {/* Hydrant body */}
        <rect x="250" y="100" width="100" height="200" fill="#d1d5db" stroke="#9ca3af" strokeWidth="2" rx="10" />
        
        {/* Port A (left) */}
        <g
          onClick={() => handlePortClick('sideA')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <circle
            cx="230"
            cy="150"
            r="25"
            fill={getPortColor('sideA')}
            stroke="#fff"
            strokeWidth="3"
          />
          <text x="230" y="157" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
            {s.legs.sideA ? `${s.legs.sideA.sizeIn}"` : 'A'}
          </text>
        </g>
        
        {/* Gate for Port A */}
        {s.legs.sideA && (
          <g
            onClick={(e) => handleGateClick('sideA', e)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <rect 
              x="185" 
              y="125" 
              width="40" 
              height="20" 
              fill={s.legs.sideA.gateOpen ? '#10b981' : '#ef4444'} 
              stroke="#fff" 
              strokeWidth="2" 
              rx="3"
            />
            <text x="205" y="138" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
              {s.legs.sideA.gateOpen ? 'OPEN' : 'SHUT'}
            </text>
          </g>
        )}
        
        {/* Port B (right) */}
        <g
          onClick={() => handlePortClick('sideB')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <circle
            cx="370"
            cy="150"
            r="25"
            fill={getPortColor('sideB')}
            stroke="#fff"
            strokeWidth="3"
          />
          <text x="370" y="157" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
            {s.legs.sideB ? `${s.legs.sideB.sizeIn}"` : 'B'}
          </text>
        </g>
        
        {/* Gate for Port B */}
        {s.legs.sideB && (
          <g
            onClick={(e) => handleGateClick('sideB', e)}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <rect 
              x="375" 
              y="125" 
              width="40" 
              height="20" 
              fill={s.legs.sideB.gateOpen ? '#10b981' : '#ef4444'} 
              stroke="#fff" 
              strokeWidth="2" 
              rx="3"
            />
            <text x="395" y="138" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
              {s.legs.sideB.gateOpen ? 'OPEN' : 'SHUT'}
            </text>
          </g>
        )}
        
        {/* Steamer port (bottom center) */}
        <g
          onClick={() => handlePortClick('steamer')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        >
          <circle
            cx="300"
            cy="320"
            r="30"
            fill={getPortColor('steamer')}
            stroke="#fff"
            strokeWidth="3"
          />
          <text x="300" y="328" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
            {s.legs.steamer ? '5"' : 'STM'}
          </text>
        </g>
        
        {/* HAV Toggle near steamer */}
        {s.legs.steamer && (
          <g
            onClick={handleHAVClick}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <rect 
              x="340" 
              y="305" 
              width="50" 
              height="30" 
              fill={
                s.hav.enabled 
                  ? (s.hav.mode === 'boost' ? '#3b82f6' : '#f59e0b')
                  : '#6b7280'
              } 
              stroke="#fff" 
              strokeWidth="2" 
              rx="4"
            />
            <text x="365" y="320" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">
              HAV
            </text>
            {s.hav.enabled && (
              <text x="365" y="330" textAnchor="middle" fill="#fff" fontSize="8">
                {s.hav.mode === 'boost' ? 'BOOST' : 'BYPASS'}
              </text>
            )}
          </g>
        )}
        
        {/* Operating nut on top */}
        <rect x="275" y="80" width="50" height="25" fill="#9ca3af" stroke="#6b7280" strokeWidth="2" rx="5" />
        
        {/* Static pressure indicator */}
        <text x="300" y="60" textAnchor="middle" fill="#94a3b8" fontSize="16" fontWeight="bold">
          {s.staticPsi} PSI
        </text>
        
        {/* Instructions */}
        <text x="300" y="380" textAnchor="middle" fill="white" fontSize="11" opacity="0.7">
          Click ports to toggle | Click HAV to cycle modes
        </text>
      </svg>
    </div>
  );
}