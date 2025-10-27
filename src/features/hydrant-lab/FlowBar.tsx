import { useHydrantLab } from './store';

export default function FlowBar() {
  const s = useHydrantLab();
  
  // Calculate theoretical max at 20-psi main residual per NFPA 291
  // Using simplified formula: theoretical max based on available pressure
  // At 80 psi static with 20 psi floor = 60 psi available
  // Hydrant valve capacity: GPM ≈ 348 × √(ΔP)
  const RESIDUAL_FLOOR = 20;
  const availablePressure = Math.max(0, s.staticPsi - RESIDUAL_FLOOR);
  const theoreticalMax = availablePressure > 0 
    ? Math.min(348 * Math.sqrt(availablePressure), 2700)  // Cap at 2700 GPM (5.25" valve limit)
    : 0;
  
  const currentFlow = s.totalInflowGpm;
  const flowPercent = theoreticalMax > 0 
    ? Math.min((currentFlow / theoreticalMax) * 100, 100)
    : 0;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white text-sm font-semibold">Supply Flow</span>
        <span className="text-gray-400 text-xs">
          {currentFlow.toFixed(0)} / {theoreticalMax.toFixed(0)} GPM
        </span>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            flowPercent > 80 ? 'bg-red-500' :
            flowPercent > 60 ? 'bg-amber-500' :
            'bg-green-500'
          }`}
          style={{ width: `${flowPercent}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-400 mt-2">
        Theoretical max assumes 20 PSI main residual per NFPA 291
      </div>
      
      {/* Flow status indicator */}
      <div className="mt-2 text-xs">
        {flowPercent > 90 ? (
          <span className="text-red-400 font-semibold">⚠️ Near capacity - approaching hydrant limits</span>
        ) : flowPercent > 70 ? (
          <span className="text-amber-400 font-semibold">⚡ High flow - monitor residual pressure</span>
        ) : flowPercent > 40 ? (
          <span className="text-green-400 font-semibold">✓ Good flow - system operating normally</span>
        ) : (
          <span className="text-blue-400 font-semibold">💧 Low flow - capacity available for more demand</span>
        )}
      </div>
    </div>
  );
}