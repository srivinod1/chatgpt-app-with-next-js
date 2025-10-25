"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to map page immediately
    router.push('/map');
  }, [router]);

  return (
    <div className="font-sans h-screen flex items-center justify-center bg-[#0F172A] text-[#E2E8F0]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading map...</p>
      </div>
    </div>
  );
}
