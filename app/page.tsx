"use client";

import Circle30Map from '@/components/Circle30Map';
import { useWidgetProps, useMaxHeight, useDisplayMode } from './hooks';
import { ParsedAIResponse, MapActionData } from '@/types/responses';

export default function Home() {
  // coco2 version - iframe fix deployed
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
  
  // Also check structuredContent for map actions
  const structuredContent = (toolOutput as any)?.structuredContent;
  console.log('Structured content:', structuredContent);
  
  // Check if action is in structuredContent
  const mapActionFromStructured = structuredContent?.action ? structuredContent as MapActionData : undefined;
  console.log('Map action from structured:', mapActionFromStructured);
  
  // Handle show_map tool format (center/zoom without action)
  let mapActionFromShowMap: MapActionData | undefined = undefined;
  if (toolOutput && (toolOutput as any).center && !mapAction && !mapActionFromStructured) {
    const centerStr = (toolOutput as any).center;
    const zoom = (toolOutput as any).zoom || 12;
    
    // Parse center string (e.g., "52.3765,4.9084")
    if (typeof centerStr === 'string' && centerStr.includes(',')) {
      const [lat, lng] = centerStr.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        mapActionFromShowMap = {
          action: 'center_map',
          latitude: lat,
          longitude: lng,
          zoom: zoom,
          timestamp: new Date().toISOString()
        };
        console.log('Created map action from show_map tool:', mapActionFromShowMap);
      }
    }
  }
  
  // Use the map action from wherever it is
  const finalMapAction = mapAction || mapActionFromStructured || mapActionFromShowMap;

  return (
    <div
      className="font-sans h-screen flex flex-col bg-[#0F172A] text-[#E2E8F0] relative overflow-hidden"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
      }}
    >
      <header className="p-4 border-b border-[#1E293B] text-xl font-bold z-50 bg-[#0F172A]">
        Interactive Map Visualization [BUILD: 2025-10-26-STRING-ID]
      </header>

      <div className="flex-1 relative">
        <Circle30Map geojsonData={geojsonData} mapAction={finalMapAction} />
      </div>
    </div>
  );
}
