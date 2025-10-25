"use client";

import Circle30Map from '@/components/Circle30Map';
import { ParsedAIResponse } from '@/types/responses';

export default function MapPage() {
  // For direct access (not in ChatGPT), show empty map
  const geojsonData: ParsedAIResponse['geojson'] = null;

  return (
    <div className="font-sans h-screen flex flex-col bg-[#0F172A] text-[#E2E8F0] relative overflow-hidden">
      <header className="p-4 border-b border-[#1E293B] text-xl font-bold z-50 bg-[#0F172A]">
        Interactive Map Visualization
      </header>

      <div className="flex-1 relative">
        <Circle30Map geojsonData={geojsonData} />
      </div>
    </div>
  );
}
