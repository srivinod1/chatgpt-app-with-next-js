"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useMaxHeight,
  useDisplayMode,
  useIsChatGptApp,
} from "./hooks";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const maxHeight = useMaxHeight() ?? undefined;
  const displayMode = useDisplayMode();
  const isChatGptApp = useIsChatGptApp();

  useEffect(() => {
    // Add debugging for ChatGPT environment
    console.log('Home page loaded:', {
      isChatGptApp,
      isRedirecting,
      baseURL: typeof window !== 'undefined' ? window.innerBaseUrl : 'server',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server'
    });

    // Only redirect if we're not already on the map page and not in ChatGPT
    if (!isRedirecting && !isChatGptApp) {
      setIsRedirecting(true);
      try {
        // Use replace instead of push to avoid back button issues
        router.replace('/map');
      } catch (error) {
        console.error('Router error:', error);
        setIsRedirecting(false);
      }
    }
  }, [router, isRedirecting, isChatGptApp]);

  // If we're in ChatGPT, show a simple message
  if (isChatGptApp) {
    return (
      <div
        className="font-sans h-screen flex items-center justify-center bg-[#0F172A] text-[#E2E8F0]"
        style={{
          maxHeight,
          height: displayMode === "fullscreen" ? maxHeight : undefined,
        }}
      >
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Interactive Map</h1>
          <p className="text-gray-300">Map functionality available through ChatGPT tools</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="font-sans h-screen flex items-center justify-center bg-[#0F172A] text-[#E2E8F0]"
      style={{
        maxHeight,
        height: displayMode === "fullscreen" ? maxHeight : undefined,
      }}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading map...</p>
      </div>
    </div>
  );
}
