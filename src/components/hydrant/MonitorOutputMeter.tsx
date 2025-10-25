// components/hydrant/MonitorOutputMeter.tsx
type MonitorOutputMeterProps = {
  flowNowGpm: number;        // Current deliverable flow to monitor
  truckMaxGpm: number;       // Supply- and pump-curve-limited ceiling
  residualPsi: number;       // Hydrant main residual (must stay ≥20 psi)
  className?: string;
};

/**
 * Water Output Meter - Hydrant Lab Only
 * 
 * Displays real hydraulics-backed flow metrics:
 * - Flow Now: What the truck can deliver right now with current setup
 * - Truck Theoretical Max: Current ceiling considering supply and pump curve
 * - Residual tracking: Main must stay ≥20 psi per NFPA 291
 * 
 * Features:
 * - Accessible ARIA progressbar semantics
 * - Reduced-motion support
 * - Color-coded status based on residual pressure
 * - Dark avionics styling matching existing Hydrant Lab theme
 */
export default function MonitorOutputMeter({
  flowNowGpm,
  truckMaxGpm,
  residualPsi,
  className = ""
}: MonitorOutputMeterProps) {
  const max = Math.max(1, truckMaxGpm)
  const ratio = Math.min(1, Math.max(0, flowNowGpm / max))
  const pct = Math.round(ratio * 100)
  
  // NFPA 291 floor: main residual must stay ≥20 psi
  const starving = residualPsi < 20
  const statusColor = residualPsi >= 20 ? "text-emerald-400" 
                    : residualPsi >= 10 ? "text-amber-400"
                    : "text-red-400"

  return (
    <section
      className={`rounded-2xl border border-[#232b35] bg-[#181f27] p-4 ${className}`}
      aria-labelledby="monitor-output-title"
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-3">
        <h3 id="monitor-output-title" className="text-sm font-medium text-slate-300">
          Water Output Meter
        </h3>
        <span
          className={`text-xs font-semibold tabular-nums ${statusColor}`}
          role="status"
          aria-live="polite"
        >
          Main Res {Math.round(residualPsi)} psi
        </span>
      </header>

      {/* Progress Bar - Accessible */}
      <div
        role="progressbar"
        aria-label="Monitor output flow"
        aria-valuemin={0}
        aria-valuemax={Math.round(max)}
        aria-valuenow={Math.round(flowNowGpm)}
        aria-valuetext={`${Math.round(flowNowGpm)} of ${Math.round(max)} GPM`}
        className="h-3 w-full rounded-full bg-slate-800/80 ring-1 ring-[#2a3440] overflow-hidden"
      >
        <div
          className={
            "h-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 " +
            "transition-[width] duration-500 ease-out motion-reduce:transition-none"
          }
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Flow Metrics */}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-slate-300">
        <dt className="text-xs text-slate-400">Flow now</dt>
        <dd className="text-right tabular-nums font-semibold text-sm">
          {Math.round(flowNowGpm).toLocaleString()} gpm
        </dd>
        
        <dt className="text-xs text-slate-400">Truck max (current)</dt>
        <dd className="text-right tabular-nums font-semibold text-sm">
          {Math.round(truckMaxGpm).toLocaleString()} gpm
        </dd>
      </dl>

      {/* Status Footer */}
      <footer className="mt-3 pt-3 border-t border-slate-700/50">
        {starving ? (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <span aria-hidden="true">⚠</span>
            <span>Main residual below 20 psi floor</span>
          </p>
        ) : (
          <p className="text-xs text-slate-400">
            Tip: Add 5″ side line to raise intake; keep main res ≥20 psi
          </p>
        )}
      </footer>
    </section>
  );
}