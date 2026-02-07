import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for optimized hybrid deployment to Azure Static Web Apps
  // This creates a minimal production build with all dependencies included
  output: 'standalone',
};

export default nextConfig;
