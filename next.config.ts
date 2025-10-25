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
};

export default nextConfig;
