import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  // Ensure proper handling of static assets in iframe
  trailingSlash: false,
  // Add standalone output for better deployment
  output: 'standalone',
  // Disable ETags to prevent caching issues
  generateEtags: false,
  // Fix workspace root warning
  outputFileTracingRoot: __dirname,
  // Disable certain optimizations that can cause chunk issues
  experimental: {
    optimizePackageImports: ['maplibre-gl', '@types/maplibre-gl', '@types/geojson'],
  },
  // Important for ChatGPT custom GPTs - CORS headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ]
  },
};

export default nextConfig;
