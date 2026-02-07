import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for optimized production deployment
  // This creates a minimal production server with all dependencies included
  output: 'standalone',
};

export default nextConfig;
