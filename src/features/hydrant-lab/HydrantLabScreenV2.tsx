import { useEffect } from 'react';
import { useHydrantLab } from './store';
import HydrantCanvasV2 from './HydrantCanvasV2';
import { ConfigTray } from './ConfigTray';
import { StatsStrip } from './StatsStrip';
import AdvisorChipsV2 from './AdvisorChipsV2';
import FlowBar from './FlowBar';

export function HydrantLabScreenV2() {
  const s = useHydrantLab();

  // Initial computation on mount only
  useEffect(() => {
    s.recompute();
  }, []); // Empty deps - only run once on mount

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header with V2 indicator */}
      <div className="bg-blue-600 text-white px-4 py-2 text-sm font-semibold">
        Hydrant Lab V2 (Enhanced Interactive Mode)
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        
        {/* Left: Interactive Canvas */}
        <div className="flex-1 flex flex-col gap-4">
          <HydrantCanvasV2 />
          <FlowBar />
        </div>

        {/* Right: Controls and Stats */}
        <div className="lg:w-96 flex flex-col gap-4 overflow-y-auto">
          <StatsStrip />
          <ConfigTray />
          <AdvisorChipsV2 />
        </div>
      </div>
    </div>
  );
}