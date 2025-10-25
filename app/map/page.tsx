"use client";

import Circle30Map from '@/components/Circle30Map';
import { useWidgetProps, useMaxHeight, useDisplayMode } from '../hooks';
import { ParsedAIResponse } from '@/types/responses';

export default function MapPage() {
  const toolOutput = useWidgetProps<Record<string, unknown>>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  // Extract GeoJSON data from tool output
  const geojsonData = (toolOutput as any)?.geojson || null;

  return (
    <div
      className="font-sans h-screen flex flex-col bg-[#0F172A] text-[#E2E8F0] relative overflow-hidden"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
      }}
    >
      <header className="p-4 border-b border-[#1E293B] text-xl font-bold z-50 bg-[#0F172A]">
        Interactive Map Visualization
      </header>

      <div className="flex-1 relative">
        <Circle30Map geojsonData={geojsonData} />
        
        {/* Info panel */}
        <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 p-4 rounded-lg z-50 max-w-sm">
          <h3 className="text-lg font-semibold text-white mb-2">Map Controls</h3>
          <p className="text-sm text-gray-300 mb-2">
            Use the navigation controls in the top-right corner to zoom and pan.
          </p>
          <p className="text-sm text-gray-300 mb-2">
            Hover over colored areas to see detailed information.
          </p>
          {geojsonData && (
            <div className="mt-2 p-2 bg-green-900 bg-opacity-50 rounded">
              <p className="text-sm text-green-200">
                ✓ {geojsonData.features?.length || 0} features loaded
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
