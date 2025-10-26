import type { NextConfig } from "next";
import { baseURL } from "./baseUrl";

// Force fresh build - cache bust
const BUILD_ID = Date.now().toString();

const nextConfig: NextConfig = {
  assetPrefix: baseURL,
  generateBuildId: async () => BUILD_ID,
};

export default nextConfig;
