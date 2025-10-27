import { useHydrantLab } from './store';

type ChipType = 'warning' | 'info' | 'success';

interface AdvisorChip {
  type: ChipType;
  title: string;
  message: string;
  action: string;
}

export default function AdvisorChipsV2() {
  const s = useHydrantLab();
  
  const chips: AdvisorChip[] = [];

  // 20-psi main residual guidance (NFPA 291)
  if (s.hydrantResidualPsi < 20) {
    chips.push({
      type: 'warning',
      title: '⚠️ Low Intake Pressure',
      message: `Hydrant residual at ${s.hydrantResidualPsi} PSI is below NFPA 291 20-PSI floor`,
      action: 'Reduce discharge flow or increase supply line capacity'
    });
  } else if (s.hydrantResidualPsi < 25) {
    chips.push({
      type: 'warning',
      title: '⚠️ Marginal Residual',
      message: `Hydrant residual at ${s.hydrantResidualPsi} PSI is near minimum threshold`,
      action: 'Consider adding another supply leg or reducing demand'
    });
  }

  // Engine intake pressure check
  if (s.engineIntakePsi < 10) {
    chips.push({
      type: 'warning',
      title: '⚠️ Cavitation Risk',
      message: `Engine intake at ${s.engineIntakePsi} PSI - pump may cavitate`,
      action: 'Check for kinks, add supply legs, or reduce pump discharge pressure'
    });
  } else if (s.engineIntakePsi < 25) {
    chips.push({
      type: 'info',
      title: 'ℹ️ Low Engine Intake',
      message: `Engine intake at ${s.engineIntakePsi} PSI is below ideal operating range`,
      action: 'Monitor closely during high-flow operations'
    });
  }

  // Double/triple tap detection
  const openLegs = Object.values(s.legs)
    .filter(Boolean)
    .filter((leg: any) => leg.id === 'steamer' || leg.gateOpen);
  
  const openPorts = openLegs.length;
  
  if (openPorts === 2) {
    chips.push({
      type: 'info',
      title: '🔄 Double Tap Configuration',
      message: 'Two supply lines active - increased available flow but also friction losses',
      action: 'Monitor intake pressure carefully during high-flow operations'
    });
  } else if (openPorts === 3) {
    chips.push({
      type: 'success',
      title: '✅ Triple Tap Configuration',
      message: 'Maximum supply capacity active - optimal for sustained operations',
      action: 'System configured for maximum flow delivery'
    });
  } else if (openPorts === 1) {
    chips.push({
      type: 'info',
      title: 'ℹ️ Single Supply Line',
      message: 'Operating on single supply leg - limited flow capacity',
      action: 'Consider double-tapping (steamer + side) for flows >1000 GPM'
    });
  }

  // HAV mode detection
  if (s.hav.enabled && s.hav.mode === 'boost') {
    chips.push({
      type: 'info',
      title: '🚀 HAV Boost Active',
      message: `HAV boosting at ${s.hav.boostPsi} PSI to overcome initial line friction`,
      action: 'Boosted pressure helps maintain flow in long supply lines'
    });
  } else if (s.hav.enabled && s.hav.mode === 'bypass') {
    chips.push({
      type: 'info',
      title: '🔀 HAV Bypass Active',
      message: 'HAV in bypass mode - minor internal friction loss (~4 PSI)',
      action: 'Consider switching to boost mode if intake pressure is low'
    });
  }

  // 3" hose warning at high flow
  const has3InchLeg = openLegs.some((leg: any) => leg.sizeIn === 3);
  if (has3InchLeg && s.totalInflowGpm > 500) {
    chips.push({
      type: 'warning',
      title: '⚠️ 3" Hose at High Flow',
      message: '3″ hose has high friction loss coefficient (C=0.8) compared to 5″ LDH (C=0.08)',
      action: 'Consider upgrading to 5″ LDH for flows >500 GPM'
    });
  }

  // System optimal message if no issues
  if (chips.length === 0) {
    chips.push({
      type: 'success',
      title: '✅ System Operating Normally',
      message: 'All parameters within acceptable ranges for current configuration',
      action: 'Continue monitoring pressures during operations'
    });
  }

  return (
    <div className="space-y-2 bg-gray-800 rounded-lg p-4">
      <h3 className="text-white font-semibold text-sm mb-3">Advisor</h3>
      {chips.map((chip, i) => (
        <div
          key={i}
          className={`rounded p-3 text-sm border ${
            chip.type === 'warning'
              ? 'bg-amber-900/30 border-amber-600 text-amber-200'
              : chip.type === 'success'
              ? 'bg-green-900/30 border-green-600 text-green-200'
              : 'bg-blue-900/30 border-blue-600 text-blue-200'
          }`}
        >
          <div className="font-semibold mb-1">{chip.title}</div>
          <div className="text-xs opacity-90 mb-2">{chip.message}</div>
          <div className="text-xs font-semibold opacity-80">→ {chip.action}</div>
        </div>
      ))}
    </div>
  );
}