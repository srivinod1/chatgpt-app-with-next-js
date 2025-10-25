"use client";

import Circle30Map from '@/components/Circle30Map';
import { useWidgetProps, useMaxHeight, useDisplayMode } from './hooks';
import { ParsedAIResponse, MapActionData } from '@/types/responses';

export default function Home() {
  const toolOutput = useWidgetProps<Record<string, unknown>>();
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();

  // Extract GeoJSON data from tool output
  const geojsonData = (toolOutput as any)?.geojson || null;
  
  // Extract map action from tool output
  const mapAction = (toolOutput as any)?.action ? (toolOutput as any) as MapActionData : undefined;
  
  // Debug logging
  console.log('Tool output:', toolOutput);
  console.log('Map action:', mapAction);

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
        <Circle30Map geojsonData={geojsonData} mapAction={mapAction} />
      </div>
    </div>
  );
}
